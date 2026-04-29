/**
 * INVIMA Registry Page — Consulta de registros sanitarios
 * Busca por número de registro o texto libre; muestra todos los campos.
 */

import React, { useState } from 'react';
import { invimaApi, type InvimaRegistro, type InvimaLookupResult } from '../services/api';
import './InvimaPage.css';

interface InvimaPageProps {
  providerId: string;
}

const ESTADO_COLORS: Record<string, string> = {
  vigente: '#059669',
  vencido: '#dc2626',
  suspendido: '#d97706',
  cancelado: '#dc2626',
  en_tramite: '#6366f1',
  desconocido: '#64748b',
};

function normalizeEstado(estado: string | null | undefined): string {
  if (!estado) return 'desconocido';
  return estado.toLowerCase().replace(/\s+/g, '_');
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="inv-field">
      <span className="inv-field-label">{label}</span>
      <span className="inv-field-value">{value}</span>
    </div>
  );
}

function RegistroCard({ reg, onBack }: { reg: InvimaRegistro; onBack: () => void }) {
  const estadoKey = normalizeEstado(reg.estado);
  const estadoColor = ESTADO_COLORS[estadoKey] ?? '#64748b';

  const rawData = reg.datos_crudos as Record<string, unknown> | null | undefined;

  return (
    <div className="inv-card">
      <button className="inv-back-btn" onClick={onBack}>
        ← Volver
      </button>

      <div className="inv-card-header">
        <div className="inv-card-numero">{reg.numero_registro}</div>
        <span className="inv-estado-badge" style={{ background: estadoColor + '22', color: estadoColor, border: `1px solid ${estadoColor}55` }}>
          {reg.estado ?? 'Desconocido'}
        </span>
      </div>

      <h2 className="inv-card-nombre">{reg.nombre_producto ?? 'Sin nombre'}</h2>

      <div className="inv-fields-grid">
        <Field label="Categoría" value={reg.categoria} />
        <Field label="Tipo de registro" value={reg.tipo_registro} />
        <Field label="Clasificación de riesgo" value={reg.clasificacion_riesgo} />
        <Field label="País de origen" value={reg.pais_origen} />
        <Field label="Fecha de emisión" value={reg.fecha_emision} />
        <Field label="Fecha de vencimiento" value={reg.fecha_vencimiento} />
        <Field label="Titular / Marca" value={reg.titular_registro} />
        <Field label="Fabricante" value={reg.titular_fabricante} />
        <Field label="Importador" value={reg.titular_importador} />
        <Field label="Principios activos" value={reg.principios_activos} />
        <Field label="Presentaciones autorizadas" value={reg.presentaciones_autorizadas} />
        <Field label="Fuente de datos" value={reg.fuente_datos} />
        <Field label="Última consulta" value={reg.ultima_consulta ? new Date(reg.ultima_consulta).toLocaleString('es-CO') : null} />
      </div>

      {rawData && Object.keys(rawData).length > 0 && (
        <div className="inv-raw-section">
          <div className="inv-raw-title">Datos adicionales</div>
          <div className="inv-fields-grid">
            {Object.entries(rawData).map(([k, v]) =>
              v != null && String(v).trim() !== '' ? (
                <Field key={k} label={k.replace(/_/g, ' ')} value={String(v)} />
              ) : null
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export const InvimaPage: React.FC<InvimaPageProps> = ({ providerId: _providerId }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<InvimaRegistro[]>([]);
  const [lookupResult, setLookupResult] = useState<InvimaLookupResult | null>(null);
  const [selected, setSelected] = useState<InvimaRegistro | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    setResults([]);
    setLookupResult(null);
    setSelected(null);
    setSearched(true);

    try {
      // Si parece número de registro (contiene letras + números con guiones) → lookup directo
      const isRegistroNumber = /^[A-Z0-9]{2,}-?\d/i.test(q);

      if (isRegistroNumber) {
        const res = await invimaApi.lookup(q);
        setLookupResult(res.data);
        if (res.data.found && res.data.data) {
          setSelected(res.data.data as InvimaRegistro);
        }
      } else {
        const res = await invimaApi.search(q, 30);
        setResults(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      setError('Error al consultar INVIMA. Verifique su conexión e intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSelected(null);
    setLookupResult(null);
  };

  const openInvimaOficial = () => {
    window.open(
      'https://consultaregistro.invima.gov.co/registrosconsultaligera/registrosanitario/consultar',
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div className="invima-page">
      <div className="inv-header">
        <div className="inv-header-text">
          <span className="inv-badge">INVIMA</span>
          <h1>Consulta de Registros Sanitarios</h1>
          <p>Busca por número de registro, nombre de producto, marca o principio activo</p>
        </div>
      </div>

      <div className="inv-search-wrapper">
        <form className="inv-search-form" onSubmit={handleSearch}>
          <div className="inv-search-box">
            <svg className="inv-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="inv-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej: RSAB-CM-21-010, Amoxicilina, Bayer, 2022M-001..."
              autoFocus
            />
            <button className="inv-search-btn" type="submit" disabled={loading || !query.trim()}>
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </form>
      </div>

      <div className="inv-results-area">
        {loading && (
          <div className="inv-state-msg">
            <div className="page-spinner" />
            <p>Consultando base de datos INVIMA...</p>
          </div>
        )}

        {!loading && error && (
          <div className="inv-state-msg inv-state-error">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {!loading && selected && (
          <RegistroCard reg={selected} onBack={handleBack} />
        )}

        {!loading && !selected && searched && !error && lookupResult && !lookupResult.found && (
          <div className="inv-not-found">
            <div className="inv-not-found-icon">🔍</div>
            <p className="inv-not-found-title">No encontrado en registros históricos</p>
            <p className="inv-not-found-desc">
              El registro <strong>{query}</strong> no está en los datos abiertos de datos.gov.co
              (que solo incluye registros vencidos). Puede estar vigente en el portal oficial de INVIMA.
            </p>
            <div className="inv-not-found-hint">
              En el portal oficial, seleccione <em>"Por número de registro"</em> y escriba: <code>{query}</code>
            </div>
            <button className="inv-oficial-btn" onClick={openInvimaOficial}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Consultar en portal oficial INVIMA
            </button>
          </div>
        )}

        {!loading && !selected && results.length > 0 && (
          <div className="inv-results-list">
            <div className="inv-results-count">{results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}</div>
            {results.map((reg) => {
              const estadoKey = normalizeEstado(reg.estado);
              const estadoColor = ESTADO_COLORS[estadoKey] ?? '#64748b';
              return (
                <button key={reg.id} className="inv-result-item" onClick={() => setSelected(reg)}>
                  <div className="inv-result-main">
                    <span className="inv-result-numero">{reg.numero_registro}</span>
                    <span className="inv-result-nombre">{reg.nombre_producto ?? 'Sin nombre'}</span>
                  </div>
                  <div className="inv-result-meta">
                    {reg.titular_registro && <span>{reg.titular_registro}</span>}
                    {reg.categoria && <span>{reg.categoria}</span>}
                    <span className="inv-result-estado" style={{ color: estadoColor }}>{reg.estado}</span>
                  </div>
                  <svg className="inv-result-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              );
            })}
          </div>
        )}

        {!loading && !selected && searched && !error && results.length === 0 && !(lookupResult && !lookupResult.found) && !lookupResult && (
          <div className="inv-not-found">
            <div className="inv-not-found-icon">🔍</div>
            <p className="inv-not-found-title">Sin resultados en registros históricos</p>
            <p className="inv-not-found-desc">
              No hay coincidencias para <strong>{query}</strong> en los datos abiertos.
              Si busca un registro vigente, consúltelo directamente en el portal oficial de INVIMA.
            </p>
            <div className="inv-not-found-hint">
              En el portal oficial busque por nombre: <code>{query}</code>
            </div>
            <button className="inv-oficial-btn" onClick={openInvimaOficial}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Consultar en portal oficial INVIMA
            </button>
          </div>
        )}

        {!searched && (
          <div className="inv-placeholder">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#c7d2fe" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <p>Ingrese un número de registro o el nombre de un producto para consultar</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvimaPage;
