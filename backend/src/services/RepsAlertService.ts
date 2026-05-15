/**
 * RepsAlertService — Cron diario de prospección REPS por vencimiento de habilitación
 *
 * Flujo semi-automático:
 *  1. Al activar, agenda un setTimeout para la hora configurada (hora_local)
 *  2. En cada ejecución: consulta REPS + enriquece con caché de fechas + filtra por vencimiento
 *  3. Guarda el resultado en reps_trigger_results
 *  4. Agenda la siguiente ejecución (mismo horario, día siguiente)
 *
 * El usuario ve los resultados en el panel WhatsApp y envía manualmente vía wa.me
 */

import { Pool } from 'pg';
import { RepsService } from './RepsService.js';
import { RepsEnrichmentService } from './RepsEnrichmentService.js';
import { logger } from '../utils/logger.js';

// Subconjunto del tipo retornado por RepsService.buscarProspectosReps
interface RepsProspecto {
  nit: string;
  nombre_prestador: string;
  codigo_habilitacion: string;
  municipio: string;
  departamento: string;
  clase_prestador: string;
  celular: string | null;
  telefono_raw?: string | null;
  email?: string | null;
  direccion?: string | null;
  fecha_vencimiento: string | null;
  dias_hasta_vencer: number | null;
}

export interface AlertTriggerConfig {
  id: string;
  departamento: string | null;
  municipio: string | null;
  clase_prestador: string | null;
  max_providers: number;
  dias_antes_vencer: number;
  solo_con_celular: boolean;
  hora_local: number;
  is_active: boolean;
  last_run_at: string | null;
  last_run_total: number | null;
  last_run_por_vencer: number | null;
  last_run_con_celular: number | null;
  last_run_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlertTriggerResult {
  id: string;
  trigger_id: string;
  run_at: string;
  total_consultados: number;
  total_por_vencer: number;
  con_celular: number;
  providers: RepsProspecto[];
  error: string | null;
}

export class RepsAlertService {
  private repsService: RepsService;
  private enrichmentService: RepsEnrichmentService;
  private timers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  constructor(private pool: Pool) {
    this.repsService = new RepsService(pool);
    this.enrichmentService = new RepsEnrichmentService(pool);
  }

  /** Retorna el único trigger global; lo crea si no existe */
  async getOrCreateDefaultTrigger(): Promise<AlertTriggerConfig> {
    const { rows } = await this.pool.query<AlertTriggerConfig>(
      `SELECT * FROM reps_alert_triggers ORDER BY created_at ASC LIMIT 1`
    );
    if (rows[0]) return rows[0];

    const { rows: created } = await this.pool.query<AlertTriggerConfig>(
      `INSERT INTO reps_alert_triggers (departamento, municipio, max_providers, dias_antes_vencer, solo_con_celular, hora_local)
       VALUES (NULL, NULL, 500, 30, true, 9)
       RETURNING *`
    );
    return created[0];
  }

  /** Actualiza campos configurables del trigger */
  async updateTrigger(
    id: string,
    updates: Partial<Pick<AlertTriggerConfig,
      'departamento' | 'municipio' | 'clase_prestador' | 'max_providers' |
      'dias_antes_vencer' | 'solo_con_celular' | 'hora_local' | 'is_active'
    >>
  ): Promise<AlertTriggerConfig> {
    const entries = Object.entries(updates).filter(([, v]) => v !== undefined);
    if (entries.length === 0) {
      const { rows } = await this.pool.query<AlertTriggerConfig>(
        `SELECT * FROM reps_alert_triggers WHERE id = $1`, [id]
      );
      return rows[0];
    }

    const setClause = entries.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const values = entries.map(([, v]) => v);

    const { rows } = await this.pool.query<AlertTriggerConfig>(
      `UPDATE reps_alert_triggers SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return rows[0];
  }

  /** Último resultado de ejecución del trigger */
  async getLastResult(triggerId: string): Promise<AlertTriggerResult | null> {
    const { rows } = await this.pool.query<AlertTriggerResult>(
      `SELECT * FROM reps_trigger_results WHERE trigger_id = $1 ORDER BY run_at DESC LIMIT 1`,
      [triggerId]
    );
    return rows[0] || null;
  }

  /** Ejecuta el trigger: consulta REPS → enriquece con caché → filtra → guarda resultado */
  async runTrigger(triggerId: string): Promise<AlertTriggerResult> {
    const { rows } = await this.pool.query<AlertTriggerConfig>(
      `SELECT * FROM reps_alert_triggers WHERE id = $1`,
      [triggerId]
    );
    const trigger = rows[0];
    if (!trigger) throw new Error('Trigger no encontrado');

    logger.info({
      msg: 'REPS Alert: iniciando ejecución de trigger',
      triggerId,
      departamento: trigger.departamento,
      municipio: trigger.municipio,
      diasAntesVencer: trigger.dias_antes_vencer,
    });

    let totalConsultados = 0;
    let totalPorVencer = 0;
    let conCelular = 0;
    let providers: RepsProspecto[] = [];
    let errorMsg: string | null = null;

    try {
      // 1. Consultar REPS (datos.gov.co) — sin filtro de vencimiento (usamos caché propia)
      const resultado = await this.repsService.buscarProspectosReps({
        departamento: trigger.departamento || undefined,
        municipio: trigger.municipio || undefined,
        clasePrestador: trigger.clase_prestador || undefined,
        soloConCelular: trigger.solo_con_celular,
        limit: trigger.max_providers,
      });

      totalConsultados = resultado.total;

      // 2. Enriquecer con fechas de vencimiento desde la caché de MINSALUD
      if (resultado.data.length > 0) {
        const nits = (resultado.data as RepsProspecto[]).map((p) => p.nit).filter(Boolean);
        const enrichedMap = await this.enrichmentService.getBatchCached(nits);
        const todayMidnight = new Date();
        todayMidnight.setUTCHours(0, 0, 0, 0);
        const todayMs = todayMidnight.getTime();

        resultado.data = (resultado.data as RepsProspecto[]).map((p) => {
          const cached = enrichedMap.get(p.nit);
          if (cached?.fecha_vencimiento) {
            const dias = Math.floor(
              (new Date(cached.fecha_vencimiento).getTime() - todayMs) / 86_400_000
            );
            return { ...p, fecha_vencimiento: cached.fecha_vencimiento, dias_hasta_vencer: dias };
          }
          return p;
        });
      }

      // 3. Filtrar solo los que vencen dentro del rango configurado
      const porVencer = (resultado.data as RepsProspecto[]).filter(
        (p) =>
          p.fecha_vencimiento !== null &&
          p.dias_hasta_vencer !== null &&
          p.dias_hasta_vencer <= trigger.dias_antes_vencer
      );

      totalPorVencer = porVencer.length;
      conCelular = porVencer.filter((p) => p.celular).length;
      providers = porVencer;

      logger.info({
        msg: 'REPS Alert: ejecución completada',
        triggerId,
        totalConsultados,
        totalPorVencer,
        conCelular,
      });
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : String(err);
      logger.error({ msg: 'REPS Alert: error en ejecución', triggerId, error: errorMsg });
    }

    // Guardar resultado en BD
    const { rows: resultRows } = await this.pool.query<AlertTriggerResult>(
      `INSERT INTO reps_trigger_results (trigger_id, total_consultados, total_por_vencer, con_celular, providers, error)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6)
       RETURNING *`,
      [triggerId, totalConsultados, totalPorVencer, conCelular, JSON.stringify(providers), errorMsg]
    );

    // Actualizar metadatos en el trigger
    await this.pool.query(
      `UPDATE reps_alert_triggers
       SET last_run_at = NOW(), last_run_total = $2, last_run_por_vencer = $3,
           last_run_con_celular = $4, last_run_error = $5, updated_at = NOW()
       WHERE id = $1`,
      [triggerId, totalConsultados, totalPorVencer, conCelular, errorMsg]
    );

    return resultRows[0];
  }

  /** Agenda la próxima ejecución para hora_local del día siguiente si es necesario */
  scheduleNext(trigger: AlertTriggerConfig): void {
    // Cancelar timer previo si existe
    const existing = this.timers.get(trigger.id);
    if (existing) clearTimeout(existing);

    if (!trigger.is_active) return;

    const now = new Date();
    const next = new Date(now);
    next.setHours(trigger.hora_local, 0, 0, 0);
    if (next.getTime() <= now.getTime()) {
      next.setDate(next.getDate() + 1);
    }

    const msUntilNext = next.getTime() - now.getTime();
    logger.info({
      msg: 'REPS Alert: próxima ejecución agendada',
      triggerId: trigger.id,
      nextRun: next.toISOString(),
      enMinutos: Math.round(msUntilNext / 60000),
    });

    const timer = setTimeout(async () => {
      try {
        await this.runTrigger(trigger.id);
      } catch (e) {
        logger.error({ msg: 'REPS Alert: error en ejecución programada', error: (e as Error).message });
      }

      // Re-leer config (puede haber cambiado) y re-agendar
      const { rows } = await this.pool.query<AlertTriggerConfig>(
        'SELECT * FROM reps_alert_triggers WHERE id = $1',
        [trigger.id]
      );
      if (rows[0]) this.scheduleNext(rows[0]);
    }, msUntilNext);

    this.timers.set(trigger.id, timer);
  }

  /** Cancela el scheduler de un trigger específico */
  cancelScheduler(triggerId: string): void {
    const existing = this.timers.get(triggerId);
    if (existing) {
      clearTimeout(existing);
      this.timers.delete(triggerId);
    }
    logger.info({ msg: 'REPS Alert: scheduler cancelado', triggerId });
  }

  /** Llamado al iniciar el servidor: activa los schedulers de todos los triggers activos */
  async initAllActiveSchedulers(): Promise<void> {
    try {
      const { rows } = await this.pool.query<AlertTriggerConfig>(
        `SELECT * FROM reps_alert_triggers WHERE is_active = true`
      );
      for (const trigger of rows) {
        this.scheduleNext(trigger);
      }
      logger.info({ msg: 'REPS Alert: schedulers inicializados', count: rows.length });
    } catch (err) {
      logger.error({ msg: 'REPS Alert: error inicializando schedulers', error: (err as Error).message });
    }
  }
}
