import { Pool } from 'pg';

export interface AuditorClient {
  id: string;
  user_id: string;
  rut?: string;
  legal_name: string;
  address?: string;
  city?: string;
  department?: string;
  email?: string;
  phone?: string;
  nombre_sede?: string;
  codigo_habilitacion?: string;
  tipo_prestador?: string;
  habilitacion_fecha_vencimiento?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditorClientInput {
  rut?: string;
  legal_name: string;
  address?: string;
  city?: string;
  department?: string;
  email?: string;
  phone?: string;
  nombre_sede?: string;
  codigo_habilitacion?: string;
  tipo_prestador?: string;
  habilitacion_fecha_vencimiento?: string;
  notes?: string;
}

export class AuditorClientService {
  constructor(private pool: Pool) {}

  async list(userId: string): Promise<AuditorClient[]> {
    const { rows } = await this.pool.query<AuditorClient>(
      `SELECT * FROM auditor_clients WHERE user_id = $1 ORDER BY legal_name ASC`,
      [userId]
    );
    return rows;
  }

  async create(userId: string, data: AuditorClientInput): Promise<AuditorClient> {
    const { rows } = await this.pool.query<AuditorClient>(
      `INSERT INTO auditor_clients
        (user_id, rut, legal_name, address, city, department, email, phone,
         nombre_sede, codigo_habilitacion, tipo_prestador, habilitacion_fecha_vencimiento, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        userId,
        data.rut || null,
        data.legal_name,
        data.address || null,
        data.city || null,
        data.department || null,
        data.email || null,
        data.phone || null,
        data.nombre_sede || null,
        data.codigo_habilitacion || null,
        data.tipo_prestador || null,
        data.habilitacion_fecha_vencimiento || null,
        data.notes || null,
      ]
    );
    return rows[0];
  }

  async update(userId: string, id: string, data: AuditorClientInput): Promise<AuditorClient | null> {
    const { rows } = await this.pool.query<AuditorClient>(
      `UPDATE auditor_clients SET
        rut = $3, legal_name = $4, address = $5, city = $6, department = $7,
        email = $8, phone = $9, nombre_sede = $10, codigo_habilitacion = $11,
        tipo_prestador = $12, habilitacion_fecha_vencimiento = $13, notes = $14,
        updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [
        id,
        userId,
        data.rut || null,
        data.legal_name,
        data.address || null,
        data.city || null,
        data.department || null,
        data.email || null,
        data.phone || null,
        data.nombre_sede || null,
        data.codigo_habilitacion || null,
        data.tipo_prestador || null,
        data.habilitacion_fecha_vencimiento || null,
        data.notes || null,
      ]
    );
    return rows[0] ?? null;
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      `DELETE FROM auditor_clients WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    return (rowCount ?? 0) > 0;
  }
}
