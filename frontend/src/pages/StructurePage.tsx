/**
 * StructurePage — "Estructura de Servicios"
 * Visualiza la jerarquía real Grupo de servicio -> Servicio -> Capítulo (agrupador) -> Criterio,
 * más la rama aparte de los 512 criterios transversales (7 estándares). Solo lectura — pensada
 * para que el usuario y la Dra. Adriana entiendan cómo está conectado todo sin depender de que
 * un desarrollador lo explique. Ver CONTEXT.md sección "Agrupador".
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  structureApi,
  StructureGrupo,
  StructureCapitulo,
  StructureCriterio,
  StructureEstandar,
} from '../services/api';
import './Pages.css';

const CONFIDENCE_STYLE: Record<string, { bg: string; border: string; color: string; label: string }> = {
  high: { bg: '#f0fdf4', border: '#86efac', color: '#166534', label: '✓ Confirmado' },
  needs_review: { bg: '#fffbeb', border: '#fcd34d', color: '#92400e', label: '⚠ Sin confirmar por Adriana' },
  category_wide: { bg: '#eff6ff', border: '#93c5fd', color: '#1e40af', label: 'ℹ Aplica a toda la categoría' },
  other_regulation: { bg: '#f9fafb', border: '#d1d5db', color: '#4b5563', label: 'ℹ Otra normativa' },
};

export const StructurePage: React.FC = () => {
  const [tab, setTab] = useState<'jerarquia' | 'transversal'>('jerarquia');
  const [grupos, setGrupos] = useState<StructureGrupo[]>([]);
  const [estandares, setEstandares] = useState<StructureEstandar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [expandedGrupos, setExpandedGrupos] = useState<Set<string>>(new Set());
  const [expandedServicios, setExpandedServicios] = useState<Set<string>>(new Set());
  const [expandedCapitulos, setExpandedCapitulos] = useState<Set<string>>(new Set());
  const [expandedEstandares, setExpandedEstandares] = useState<Set<string>>(new Set());

  const [capituloCriteria, setCapituloCriteria] = useState<Map<string, StructureCriterio[]>>(new Map());
  const [loadingCapitulo, setLoadingCapitulo] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([structureApi.getTree(), structureApi.getTransversal()])
      .then(([treeRes, transRes]) => {
        setGrupos(treeRes.data || []);
        setEstandares(transRes.data || []);
      })
      .catch(() => setError('No se pudo cargar la estructura. Intenta recargar la página.'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, id: string) => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    setter(next);
  };

  const loadCapituloCriteria = async (capId: string) => {
    if (capituloCriteria.has(capId) || loadingCapitulo.has(capId)) return;
    setLoadingCapitulo((prev) => new Set([...prev, capId]));
    try {
      const res = await structureApi.getCapituloCriteria(capId);
      setCapituloCriteria((prev) => new Map(prev).set(capId, res.data || []));
    } catch {
      setCapituloCriteria((prev) => new Map(prev).set(capId, []));
    } finally {
      setLoadingCapitulo((prev) => {
        const next = new Set(prev);
        next.delete(capId);
        return next;
      });
    }
  };

  const toggleCapitulo = (capId: string) => {
    const wasExpanded = expandedCapitulos.has(capId);
    toggle(expandedCapitulos, setExpandedCapitulos, capId);
    if (!wasExpanded) void loadCapituloCriteria(capId);
  };

  // Filtrado por búsqueda: si hay texto, solo muestra grupos/servicios con coincidencia (nombre
  // de servicio o de capítulo), y expande automáticamente el camino hasta el resultado.
  const q = search.trim().toLowerCase();
  const filteredGrupos = useMemo(() => {
    if (!q) return grupos;
    return grupos
      .map((g) => ({
        ...g,
        servicios: g.servicios.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.code.toLowerCase().includes(q) ||
            s.capitulos.some((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
        ),
      }))
      .filter((g) => g.servicios.length > 0);
  }, [grupos, q]);

  useEffect(() => {
    if (!q) return;
    const gIds = new Set(expandedGrupos);
    const sIds = new Set(expandedServicios);
    filteredGrupos.forEach((g) => {
      gIds.add(g.category);
      g.servicios.forEach((s) => sIds.add(s.id));
    });
    setExpandedGrupos(gIds);
    setExpandedServicios(sIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const totalServicios = grupos.reduce((acc, g) => acc + g.servicios.length, 0);
  const totalCapitulos = new Set(
    grupos.flatMap((g) => g.servicios.flatMap((s) => s.capitulos.map((c) => c.id)))
  ).size;

  if (loading) {
    return (
      <div className="page-container page-loading">
        <div className="page-spinner" />
        <p>Cargando estructura...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '22px' }}>Estructura de Servicios</h1>
        <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>
          Cómo está conectado Grupo → Servicio → Capítulo → Criterio en HabilitaPro. Solo lectura.
        </p>
      </div>

      {error && (
        <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#991b1b', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
        <button
          onClick={() => setTab('jerarquia')}
          style={{
            padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '13px',
            color: tab === 'jerarquia' ? '#2563eb' : '#6b7280',
            borderBottom: tab === 'jerarquia' ? '2px solid #2563eb' : '2px solid transparent',
          }}
        >
          Grupo → Servicio → Capítulo ({totalServicios} servicios, {totalCapitulos} capítulos)
        </button>
        <button
          onClick={() => setTab('transversal')}
          style={{
            padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '13px',
            color: tab === 'transversal' ? '#2563eb' : '#6b7280',
            borderBottom: tab === 'transversal' ? '2px solid #2563eb' : '2px solid transparent',
          }}
        >
          Estándares Transversales (512 criterios aparte, aplican a todos)
        </button>
      </div>

      {tab === 'jerarquia' && (
        <>
          <input
            type="text"
            placeholder="Buscar servicio o capítulo por nombre o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', maxWidth: '480px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}
          />

          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {Object.entries(CONFIDENCE_STYLE).map(([key, s]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#6b7280' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: s.bg, border: `1px solid ${s.border}` }} />
                {s.label}
              </div>
            ))}
          </div>

          {filteredGrupos.length === 0 && (
            <p style={{ color: '#9ca3af', fontSize: '13px' }}>Sin resultados para "{search}".</p>
          )}

          {filteredGrupos.map((grupo) => {
            const isGrupoOpen = expandedGrupos.has(grupo.category);
            return (
              <div key={grupo.category} style={{ marginBottom: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                <button
                  onClick={() => toggle(expandedGrupos, setExpandedGrupos, grupo.category)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '12px 16px', border: 'none', cursor: 'pointer',
                    background: '#f9fafb', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700, fontSize: '14px',
                  }}
                >
                  <span>{isGrupoOpen ? '▼' : '▶'}</span>
                  {grupo.category}
                  <span style={{ fontWeight: 400, fontSize: '12px', color: '#9ca3af' }}>({grupo.servicios.length} servicios)</span>
                </button>

                {isGrupoOpen && (
                  <div style={{ padding: '4px 12px 12px 28px' }}>
                    {grupo.servicios.map((servicio) => {
                      const isServicioOpen = expandedServicios.has(servicio.id);
                      return (
                        <div key={servicio.id} style={{ marginTop: '6px' }}>
                          <button
                            onClick={() => toggle(expandedServicios, setExpandedServicios, servicio.id)}
                            style={{
                              width: '100%', textAlign: 'left', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px',
                              cursor: 'pointer', background: servicio.capitulos.length > 0 ? 'white' : '#fafafa',
                              display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500,
                            }}
                          >
                            <span style={{ fontSize: '11px' }}>{servicio.capitulos.length > 0 ? (isServicioOpen ? '▼' : '▶') : '·'}</span>
                            {servicio.name}
                            <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 400 }}>· {servicio.code}</span>
                            {servicio.capitulos.length > 0 && (
                              <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#6b7280' }}>
                                {servicio.capitulos.length} capítulo{servicio.capitulos.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </button>

                          {isServicioOpen && servicio.capitulos.length > 0 && (
                            <div style={{ padding: '6px 0 4px 24px' }}>
                              {servicio.capitulos.map((cap) => {
                                const style = CONFIDENCE_STYLE[cap.confidence] || CONFIDENCE_STYLE.high;
                                const isCapOpen = expandedCapitulos.has(cap.id);
                                const criteria = capituloCriteria.get(cap.id);
                                return (
                                  <div key={`${servicio.id}-${cap.id}`} style={{ marginBottom: '6px' }}>
                                    <button
                                      onClick={() => toggleCapitulo(cap.id)}
                                      style={{
                                        width: '100%', textAlign: 'left', padding: '7px 10px', borderRadius: '6px', cursor: 'pointer',
                                        background: style.bg, border: `1px solid ${style.border}`, color: style.color,
                                        display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px',
                                      }}
                                    >
                                      <span>{isCapOpen ? '▼' : '▶'}</span>
                                      <strong>{cap.name}</strong>
                                      <span style={{ opacity: 0.7 }}>· {cap.code}</span>
                                      <span style={{ marginLeft: 'auto', fontSize: '10px' }} title="Criterios que se responden. Los encabezados agrupan sub-criterios y no se califican.">
                                        {cap.criteria_count} criterios
                                        {cap.header_count > 0 && ` + ${cap.header_count} encabezados`}
                                      </span>
                                    </button>
                                    {cap.note && (
                                      <div style={{ padding: '4px 10px 0 10px', fontSize: '11px', color: style.color, opacity: 0.85 }}>
                                        {cap.note}
                                      </div>
                                    )}
                                    {isCapOpen && (
                                      <div style={{ padding: '6px 10px 6px 24px', fontSize: '12px' }}>
                                        {loadingCapitulo.has(cap.id) && <span style={{ color: '#9ca3af' }}>Cargando criterios...</span>}
                                        {criteria && criteria.length === 0 && <span style={{ color: '#9ca3af' }}>Sin criterios.</span>}
                                        {criteria && criteria.map((crit) => (
                                          <div
                                            key={crit.id}
                                            style={{
                                              padding: '3px 0', color: crit.is_section_header ? '#6b7280' : '#374151',
                                              fontWeight: crit.is_section_header ? 600 : 400,
                                              fontStyle: crit.is_section_header ? 'italic' : 'normal',
                                            }}
                                          >
                                            {crit.name}
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
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {tab === 'transversal' && (
        <div>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
            Estos 512 criterios aplican a <strong>todos</strong> los servicios por igual — no dependen de grupo ni de servicio, solo del estándar.
          </p>
          {estandares.map((est) => {
            const isOpen = expandedEstandares.has(est.id);
            return (
              <div key={est.id} style={{ marginBottom: '8px', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                <button
                  onClick={() => toggle(expandedEstandares, setExpandedEstandares, est.id)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', cursor: 'pointer',
                    background: '#f9fafb', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600, fontSize: '13px',
                  }}
                >
                  <span>{isOpen ? '▼' : '▶'}</span>
                  {est.name}
                  <span style={{ fontWeight: 400, fontSize: '11px', color: '#9ca3af' }}>
                    {est.code} · {est.criterios.length} criterios
                  </span>
                </button>
                {isOpen && (
                  <div style={{ padding: '8px 14px 10px 30px', fontSize: '12px' }}>
                    {est.criterios.map((crit) => (
                      <div
                        key={crit.id}
                        style={{
                          padding: '3px 0', color: crit.is_section_header ? '#6b7280' : '#374151',
                          fontWeight: crit.is_section_header ? 600 : 400,
                          fontStyle: crit.is_section_header ? 'italic' : 'normal',
                        }}
                      >
                        {crit.name}
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
};
