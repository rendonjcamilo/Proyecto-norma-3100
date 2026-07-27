/**
 * Estructura de Servicios — solo lectura.
 *
 * Muestra la estructura de auditoría tal como está en el archivo de la Resolución 3100:
 * Grupo (11.1 … 11.6) → Servicio → Criterio.
 *
 * Los 157 servicios REPS (Anestesia, Cardiología, Optometría…) NO van aquí: ese es el catálogo de
 * habilitación del prestador — dice qué ofrece, no contra qué se audita.
 */

import { useEffect, useState, useMemo } from 'react';
import {
  structureApi,
  type StructureGrupo,
  type StructureOtraNormativa,
  type StructureCriterio,
} from '../services/api';

export function StructurePage() {
  const [grupos, setGrupos] = useState<StructureGrupo[]>([]);
  const [otras, setOtras] = useState<StructureOtraNormativa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(['11.1']));
  const [openServicio, setOpenServicio] = useState<string | null>(null);
  const [criterios, setCriterios] = useState<Record<string, StructureCriterio[]>>({});
  const [loadingCriterios, setLoadingCriterios] = useState(false);

  useEffect(() => {
    structureApi
      .getTree()
      .then((r) => {
        setGrupos(r.data);
        setOtras(r.otraNormativa || []);
      })
      .catch(() => setError('No se pudo cargar la estructura.'))
      .finally(() => setLoading(false));
  }, []);

  const toggleGroup = (norm: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(norm)) next.delete(norm);
      else next.add(norm);
      return next;
    });
  };

  const openServicioCriteria = async (key: string, kind: 'standard' | 'chapter', id: string | null) => {
    if (openServicio === key) {
      setOpenServicio(null);
      return;
    }
    setOpenServicio(key);
    if (!id || criterios[key]) return;
    setLoadingCriterios(true);
    try {
      const r = await structureApi.getCriteria(kind, id);
      setCriterios((prev) => ({ ...prev, [key]: r.data }));
    } catch {
      setCriterios((prev) => ({ ...prev, [key]: [] }));
    } finally {
      setLoadingCriterios(false);
    }
  };

  const q = search.trim().toLowerCase();
  const gruposFiltrados = useMemo(() => {
    if (!q) return grupos;
    return grupos
      .map((g) => ({
        ...g,
        servicios: g.servicios.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.code.toLowerCase().includes(q) ||
            s.norm.includes(q)
        ),
      }))
      .filter((g) => g.servicios.length > 0);
  }, [grupos, q]);

  const totales = useMemo(() => {
    const servicios = grupos.reduce((a, g) => a + g.servicios.length, 0);
    const criteriosTotal = grupos.reduce((a, g) => a + g.criteria_total, 0);
    return { servicios, criteriosTotal };
  }, [grupos]);

  if (loading) return <div style={{ padding: 24 }}>Cargando estructura…</div>;
  if (error) return <div style={{ padding: 24, color: '#b91c1c' }}>{error}</div>;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Estructura de Servicios</h1>
      <p style={{ color: '#64748b', fontSize: 13, marginBottom: 4 }}>
        Resolución 3100 de 2019, Capítulo 11 — Grupo → Servicio → Criterio. Solo lectura.
      </p>
      <p style={{ color: '#64748b', fontSize: 12, marginBottom: 20 }}>
        {totales.servicios} servicios auditables · {totales.criteriosTotal} criterios que se responden
      </p>

      <input
        type="text"
        placeholder="Buscar servicio por nombre, código o numeral (ej. 11.3.4)…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%', maxWidth: 480, padding: '8px 12px', border: '1px solid #d1d5db',
          borderRadius: 6, fontSize: 14, marginBottom: 18, boxSizing: 'border-box',
        }}
      />

      {gruposFiltrados.map((g) => {
        const isOpen = openGroups.has(g.norm) || !!q;
        return (
          <div key={g.norm} style={{ border: '1px solid #e2e8f0', borderRadius: 10, marginBottom: 12, overflow: 'hidden' }}>
            <button
              onClick={() => toggleGroup(g.norm)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                background: g.transversal ? '#eff6ff' : '#f8fafc', border: 'none', cursor: 'pointer',
                textAlign: 'left', fontSize: 15,
              }}
            >
              <span style={{ color: '#64748b' }}>{isOpen ? '▼' : '▶'}</span>
              <strong style={{ color: '#1e3a8a' }}>{g.norm}</strong>
              <strong>{g.name}</strong>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b' }}>
                {g.servicios.length} servicios · {g.criteria_total} criterios
              </span>
            </button>

            {isOpen && (
              <div style={{ padding: '4px 10px 10px 10px' }}>
                {g.transversal && (
                  <div style={{ fontSize: 12, color: '#1e40af', padding: '6px 8px 10px 8px' }}>
                    Estos criterios aplican a <strong>todos</strong> los servicios, sin importar el grupo.
                  </div>
                )}
                {g.servicios.map((s) => {
                  const key = `${s.kind}:${s.code}`;
                  const isSvcOpen = openServicio === key;
                  const list = criterios[key];
                  return (
                    <div key={key} style={{ marginBottom: 4 }}>
                      <button
                        onClick={() => openServicioCriteria(key, s.kind, s.id)}
                        disabled={s.missing}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                          background: isSvcOpen ? '#f1f5f9' : '#fff', border: '1px solid #e2e8f0',
                          borderRadius: 6, cursor: s.missing ? 'not-allowed' : 'pointer',
                          textAlign: 'left', fontSize: 13, opacity: s.missing ? 0.5 : 1,
                        }}
                      >
                        <span style={{ color: '#94a3b8' }}>{isSvcOpen ? '▼' : '▶'}</span>
                        <span style={{ color: '#1e3a8a', fontWeight: 600, minWidth: 58 }}>{s.norm}</span>
                        <span style={{ fontWeight: 500 }}>{s.name}</span>
                        <span style={{ color: '#94a3b8', fontSize: 11 }}>· {s.code}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#64748b' }}>
                          {s.missing
                            ? 'no está en la base de datos'
                            : `${s.criteria_count} criterios${s.header_count > 0 ? ` + ${s.header_count} encabezados` : ''}`}
                        </span>
                      </button>

                      {isSvcOpen && (
                        <div style={{ padding: '8px 12px 8px 34px', fontSize: 12 }}>
                          {loadingCriterios && !list && <span style={{ color: '#94a3b8' }}>Cargando criterios…</span>}
                          {list && list.length === 0 && <span style={{ color: '#94a3b8' }}>Sin criterios registrados.</span>}
                          {list?.map((c) => (
                            <div
                              key={c.id}
                              style={{
                                padding: '4px 8px', marginBottom: 2, borderRadius: 4,
                                background: c.is_section_header ? '#f1f5f9' : 'transparent',
                                color: c.is_section_header ? '#475569' : '#0f172a',
                                fontWeight: c.is_section_header ? 600 : 400,
                              }}
                              title={c.is_section_header ? 'Encabezado de grupo: no se califica' : 'Criterio: se responde C / NC / NA'}
                            >
                              {c.is_section_header && <span style={{ fontSize: 10, marginRight: 6, color: '#64748b' }}>▸</span>}
                              {c.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {otras.length > 0 && !q && (
        <div style={{ marginTop: 24, padding: 14, border: '1px dashed #cbd5e1', borderRadius: 10, background: '#fffbeb' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Fuera de la Resolución 3100</div>
          {otras.map((o) => (
            <div key={o.code} style={{ fontSize: 12, color: '#78350f' }}>
              <strong>{o.name}</strong> · {o.code} — {o.criteria_count} criterios
              <div style={{ fontSize: 11, opacity: 0.85 }}>{o.note}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
