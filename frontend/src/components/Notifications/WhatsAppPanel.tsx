/**
 * WhatsAppPanel — Prospección comercial vía REPS para auditores
 * Consulta datos.gov.co en tiempo real para encontrar prestadores habilitados
 * y permite contactarlos por WhatsApp para ofrecer servicios de auditoría Res. 3100.
 */

import React, { useState, useCallback } from 'react';
import { repsApi, RepsProspecto } from '../../services/api';
import './WhatsAppPanel.css';

const DEPARTAMENTOS_COLOMBIA = [
  'AMAZONAS','ANTIOQUIA','ARAUCA','ATLÁNTICO','BOLÍVAR','BOYACÁ','CALDAS',
  'CAQUETÁ','CASANARE','CAUCA','CESAR','CHOCÓ','CÓRDOBA','CUNDINAMARCA',
  'GUAINÍA','GUAVIARE','HUILA','LA GUAJIRA','MAGDALENA','META','NARIÑO',
  'NORTE DE SANTANDER','PUTUMAYO','QUINDÍO','RISARALDA','SAN ANDRÉS Y PROVIDENCIA',
  'SANTANDER','SUCRE','TOLIMA','VALLE DEL CAUCA','VAUPÉS','VICHADA',
];

const CLASES_PRESTADOR = [
  'Profesional Independiente',
  'Institución Prestadora de Servicios de Salud',
  'Empresa Social del Estado',
  'Transporte Especial de Pacientes',
  'Objeto Social Diferente al de Salud',
];

const PLANTILLA_DEFAULT = `Estimado(a) {{nombre_prestador}},

Mi nombre es [Tu nombre] y me especializo en auditoría de habilitación bajo la Resolución 3100 de 2019.

He revisado su registro en el REPS nacional y me gustaría ofrecerle nuestros servicios:

✅ Autoevaluación de los 512 criterios de la Norma 3100
✅ Preparación ante visitas de entes de control
✅ Acompañamiento en corrección de no conformidades

🏥 Código REPS: {{codigo_habilitacion}}
📍 Municipio: {{municipio}}

¿Le interesa conocer cómo podemos apoyar a su institución?

Quedo atento(a),
[Tu nombre y contacto]`;

type ClaseChip = { label: string; color: 'azul' | 'morado' | 'verde' | 'gris' };

function chipParaClase(clase: string): ClaseChip {
  const c = clase.toLowerCase();
  if (c.includes('ese') || c.includes('empresa social')) return { label: 'ESE', color: 'azul' };
  if (c.includes('ips') || c.includes('institución') || c.includes('institucion')) return { label: 'IPS', color: 'verde' };
  if (c.includes('profesional')) return { label: 'Prof. Ind.', color: 'morado' };
  if (c.includes('transporte')) return { label: 'Transporte', color: 'gris' };
  return { label: clase.slice(0, 10) + (clase.length > 10 ? '…' : ''), color: 'gris' };
}

function buildMensaje(plantilla: string, p: RepsProspecto): string {
  return plantilla
    .replace(/{{nombre_prestador}}/g, p.nombre_prestador)
    .replace(/{{codigo_habilitacion}}/g, p.codigo_habilitacion || 'N/D')
    .replace(/{{municipio}}/g, p.municipio);
}

function toWaPhone(celular: string): string {
  const d = celular.replace(/\D/g, '');
  if (d.startsWith('57') && d.length === 12) return d;
  if (d.length === 10 && d.startsWith('3')) return `57${d}`;
  return d;
}

export const WhatsAppPanel: React.FC = () => {
  const [prospectos, setProspectos] = useState<RepsProspecto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalEncontrados, setTotalEncontrados] = useState<number | null>(null);

  const [departamento, setDepartamento] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [clase, setClase] = useState('');
  const [soloConCelular, setSoloConCelular] = useState(false);

  const [selected, setSelected] = useState<RepsProspecto | null>(null);
  const [plantilla, setPlantilla] = useState(PLANTILLA_DEFAULT);
  const [manualPhone, setManualPhone] = useState('');

  const canSearch = departamento.trim() !== '' || municipio.trim() !== '';

  const cargar = useCallback(async () => {
    if (!canSearch) return;
    setLoading(true);
    setError('');
    setSelected(null);
    try {
      const res = await repsApi.getMercadoPotencial({
        departamento: departamento || undefined,
        municipio: municipio.trim().toUpperCase() || undefined,
        clase: clase || undefined,
        soloConCelular,
      });
      setProspectos(res.data || []);
      setTotalEncontrados(res.total ?? res.data.length);
    } catch {
      setError('No se pudo conectar con datos.gov.co. Verifica tu conexión e intenta de nuevo.');
      setTotalEncontrados(null);
    } finally {
      setLoading(false);
    }
  }, [departamento, municipio, clase, soloConCelular, canSearch]);

  const handleSelect = (p: RepsProspecto) => {
    setSelected(p);
    setManualPhone(p.celular ? toWaPhone(p.celular) : '');
  };

  const handleEnviarWhatsApp = () => {
    if (!selected) return;
    const phone = manualPhone || (selected.celular ? toWaPhone(selected.celular) : '');
    if (!phone) return;
    const texto = encodeURIComponent(buildMensaje(plantilla, selected));
    window.open(`https://wa.me/${phone}?text=${texto}`, '_blank', 'noopener,noreferrer');
  };

  const phoneValido = manualPhone.replace(/\D/g, '').length >= 10;

  return (
    <div className="wap-root">
      {/* Header */}
      <div className="wap-header">
        <span className="wap-header-badge">
          <svg width="6" height="6" viewBox="0 0 6 6"><circle cx="3" cy="3" r="3" fill="#25d366"/></svg>
          WhatsApp · Prospección REPS
        </span>
        <h2>Prestadores habilitados — Prospección comercial</h2>
        <p>
          Consulta el REPS nacional en tiempo real. Encuentra prestadores en tu zona y contáctalos
          para ofrecerles servicios de auditoría bajo la Resolución 3100 de 2019.
        </p>
      </div>

      {/* Barra de filtros */}
      <div className="wap-filters">
        <div className="wap-filter-group">
          <label>Departamento *</label>
          <select value={departamento} onChange={(e) => setDepartamento(e.target.value)}>
            <option value="">— Selecciona departamento —</option>
            {DEPARTAMENTOS_COLOMBIA.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="wap-filter-group wap-filter-group--municipio">
          <label>Municipio (opcional)</label>
          <input
            type="text"
            value={municipio}
            onChange={(e) => setMunicipio(e.target.value)}
            placeholder="Ej: MEDELLÍN"
            className="wap-municipio-input"
          />
        </div>

        <div className="wap-filter-group">
          <label>Tipo de prestador</label>
          <select value={clase} onChange={(e) => setClase(e.target.value)}>
            <option value="">— Todos los tipos —</option>
            {CLASES_PRESTADOR.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="wap-filter-celular">
          <label className="wap-checkbox-label">
            <input
              type="checkbox"
              checked={soloConCelular}
              onChange={(e) => setSoloConCelular(e.target.checked)}
            />
            Solo con celular
          </label>
        </div>

        <button
          className="wap-search-btn"
          onClick={cargar}
          disabled={loading || !canSearch}
          title={!canSearch ? 'Selecciona al menos departamento o municipio' : ''}
        >
          {loading ? (
            <><div className="wap-spinner-sm" /> Consultando REPS...</>
          ) : (
            <>🔍 Buscar en REPS</>
          )}
        </button>
      </div>

      {!canSearch && (
        <div className="wap-hint-required">
          Selecciona al menos un departamento o escribe un municipio para iniciar la búsqueda.
        </div>
      )}

      <div className="wap-body">
        {/* Panel izquierdo: lista */}
        <div className="wap-list-panel">
          <div className="wap-list-header">
            {!loading && totalEncontrados !== null && prospectos.length > 0 && (
              <span className="wap-list-count">
                <strong>{prospectos.length}</strong> prestadores
                {departamento && <> en <strong>{departamento}</strong></>}
                {municipio && <> · <strong>{municipio.toUpperCase()}</strong></>}
              </span>
            )}
            {!loading && prospectos.length === 0 && !error && totalEncontrados === null && (
              <span className="wap-list-count">Usa los filtros y presiona Buscar</span>
            )}
          </div>

          {loading && (
            <div className="wap-state">
              <div className="wap-spinner" />
              <span>Consultando datos.gov.co — REPS nacional...</span>
              <small>Esto puede tomar unos segundos</small>
            </div>
          )}

          {!loading && error && (
            <div className="wap-state wap-state--error">
              <span>⚠️ {error}</span>
              <button onClick={cargar}>Reintentar</button>
            </div>
          )}

          {!loading && !error && prospectos.length === 0 && totalEncontrados !== null && (
            <div className="wap-state wap-state--empty">
              <span className="wap-empty-icon">🔍</span>
              <span>No se encontraron prestadores con los filtros seleccionados.</span>
              {soloConCelular && <small>Prueba desactivando "Solo con celular"</small>}
            </div>
          )}

          {!loading && !error && prospectos.length > 0 && (
            <ul className="wap-list">
              {prospectos.map((p) => {
                const chip = chipParaClase(p.clase_prestador);
                const isActive = selected?.codigo_habilitacion === p.codigo_habilitacion && selected?.nit === p.nit;
                return (
                  <li
                    key={`${p.codigo_habilitacion}-${p.nit}`}
                    className={`wap-item ${isActive ? 'wap-item--active' : ''}`}
                    onClick={() => handleSelect(p)}
                  >
                    <div className="wap-item-top">
                      <span className="wap-item-name">{p.nombre_prestador}</span>
                      <span className={`wap-chip wap-chip--${chip.color}`}>{chip.label}</span>
                    </div>
                    <div className="wap-item-meta">
                      <span>NIT {p.nit}</span>
                      {p.codigo_habilitacion && <span>· Hab. {p.codigo_habilitacion}</span>}
                    </div>
                    <div className="wap-item-loc">
                      📍 {p.municipio}{p.departamento ? `, ${p.departamento}` : ''}
                    </div>
                    {p.direccion && (
                      <div className="wap-item-dir">{p.direccion}</div>
                    )}
                    <div className="wap-item-phone">
                      {p.celular
                        ? <><span>📱</span> {p.celular}</>
                        : p.telefono_raw
                          ? <><span>📞</span> {p.telefono_raw} <span className="wap-no-phone">(fijo)</span></>
                          : <span className="wap-no-phone">Sin número en REPS</span>
                      }
                      {p.email && <span className="wap-item-email">· {p.email}</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Panel derecho: compositor */}
        <div className="wap-composer">
          {!selected ? (
            <div className="wap-composer-empty">
              <div className="wap-composer-empty-icon">💬</div>
              <p>Selecciona un prestador de la lista para preparar el mensaje de contacto</p>
            </div>
          ) : (
            <>
              <div className="wap-composer-header">
                <div>
                  <div className="wap-composer-name">{selected.nombre_prestador}</div>
                  <div className="wap-composer-sub">
                    NIT {selected.nit}
                    {selected.codigo_habilitacion && ` · Hab. ${selected.codigo_habilitacion}`}
                    {' · '}{selected.municipio}
                    {selected.departamento && `, ${selected.departamento}`}
                  </div>
                  {selected.direccion && (
                    <div className="wap-composer-dir">{selected.direccion}</div>
                  )}
                </div>
                {(() => { const chip = chipParaClase(selected.clase_prestador); return (
                  <span className={`wap-chip wap-chip--${chip.color}`}>{chip.label}</span>
                ); })()}
              </div>

              {/* Número de WhatsApp */}
              <div className="wap-field">
                <label>Número de WhatsApp</label>
                <div className="wap-phone-row">
                  <span className="wap-phone-prefix">+</span>
                  <input
                    type="tel"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="573001234567"
                    maxLength={15}
                  />
                  {selected.celular && (
                    <button
                      className="wap-phone-fill"
                      onClick={() => setManualPhone(toWaPhone(selected.celular!))}
                    >
                      Usar REPS
                    </button>
                  )}
                </div>
                {selected.celular
                  ? <small className="wap-hint">Celular extraído del REPS: {selected.celular}</small>
                  : selected.telefono_raw
                    ? <small className="wap-hint-warn">REPS solo tiene número fijo ({selected.telefono_raw}). Ingresa el celular manualmente.</small>
                    : <small className="wap-hint-warn">Este prestador no tiene teléfono en REPS. Ingresa el número manualmente.</small>
                }
                {!phoneValido && manualPhone.length > 0 && (
                  <small className="wap-hint-error">Ingresa un número colombiano válido (ej: 573001234567)</small>
                )}
              </div>

              {/* Plantilla de mensaje */}
              <div className="wap-field">
                <label>Mensaje de contacto</label>
                <textarea
                  value={plantilla}
                  onChange={(e) => setPlantilla(e.target.value)}
                  rows={11}
                />
                <small className="wap-hint">
                  Variables disponibles: <code>{'{{nombre_prestador}}'}</code> <code>{'{{codigo_habilitacion}}'}</code> <code>{'{{municipio}}'}</code>
                </small>
              </div>

              {/* Vista previa */}
              <div className="wap-preview">
                <div className="wap-preview-label">Vista previa</div>
                <div className="wap-preview-bubble">
                  {buildMensaje(plantilla, selected).split('\n').map((line, i) => (
                    <React.Fragment key={i}>{line}<br /></React.Fragment>
                  ))}
                </div>
              </div>

              <button
                className="wap-send-btn"
                onClick={handleEnviarWhatsApp}
                disabled={!phoneValido}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.552 4.12 1.518 5.851L.057 23.944l6.254-1.641A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.847 0-3.574-.487-5.063-1.337l-.363-.214-3.716.975.992-3.624-.237-.375A9.955 9.955 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
                Abrir en WhatsApp
              </button>

              <p className="wap-disclaimer">
                Se abrirá WhatsApp Web / app con el mensaje listo. El envío automático se configurará en una fase posterior.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
