import React, { useState } from 'react';
import { rethusApi, TipoDocumentoRethus, RethusPersona } from '../../services/api';

const TIPOS: { value: TipoDocumentoRethus; label: string }[] = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'TI', label: 'Tarjeta de Identidad' },
  { value: 'PA', label: 'Pasaporte' },
  { value: 'SC', label: 'Salvo Conducto' },
  { value: 'RC', label: 'Registro Civil' },
  { value: 'MS', label: 'Menor sin identificación' },
];

const RethusConsulta: React.FC = () => {
  const [tipoDoc, setTipoDoc] = useState<TipoDocumentoRethus>('CC');
  const [numDoc, setNumDoc] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<RethusPersona | null>(null);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConsultar = async () => {
    const doc = numDoc.trim();
    if (!doc || doc.length < 4) return;
    setLoading(true);
    setResultado(null);
    setNoEncontrado(false);
    setError(null);

    try {
      const res = await rethusApi.consultar(tipoDoc, doc);
      if (res.found && res.persona) {
        setResultado(res.persona);
      } else {
        setNoEncontrado(true);
      }
    } catch {
      setError('No se pudo conectar con el portal RETHUS. Intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') void handleConsultar();
  };

  const estadoColor = resultado
    ? resultado.estado.toUpperCase() === 'ACTIVO'
      ? '#2e7d32'
      : resultado.estado.toUpperCase() === 'SUSPENDIDO'
      ? '#e65100'
      : '#c62828'
    : '#333';

  return (
    <div style={{
      margin: '12px 0',
      padding: '14px 16px',
      background: '#f0f7ff',
      border: '1px solid #90caf9',
      borderLeft: '4px solid #1565c0',
      borderRadius: '6px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 16 }}>🏥</span>
        <strong style={{ color: '#1565c0', fontSize: 13 }}>
          Consultar inscripción en RETHUS
        </strong>
        <span style={{ fontSize: 11, color: '#555', marginLeft: 4 }}>
          (Ley 1164 de 2007 — opcional pero recomendado)
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={tipoDoc}
          onChange={(e) => setTipoDoc(e.target.value as TipoDocumentoRethus)}
          disabled={loading}
          style={{
            padding: '6px 8px', borderRadius: 4, border: '1px solid #90caf9',
            fontSize: 13, background: '#fff', color: '#333', cursor: 'pointer',
          }}
        >
          {TIPOS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Número de documento"
          value={numDoc}
          onChange={(e) => setNumDoc(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          maxLength={15}
          style={{
            padding: '6px 10px', borderRadius: 4, border: '1px solid #90caf9',
            fontSize: 13, width: 160, background: '#fff',
          }}
        />

        <button
          type="button"
          onClick={() => void handleConsultar()}
          disabled={loading || numDoc.trim().length < 4}
          style={{
            padding: '6px 16px', borderRadius: 4, border: 'none',
            background: loading || numDoc.trim().length < 4 ? '#90caf9' : '#1565c0',
            color: '#fff', fontSize: 13, cursor: loading || numDoc.trim().length < 4 ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
        >
          {loading ? 'Consultando…' : 'Consultar'}
        </button>
      </div>

      {/* Resultado encontrado */}
      {resultado && (
        <div style={{
          marginTop: 12, padding: '10px 14px',
          background: '#fff', border: '1px solid #90caf9', borderRadius: 5,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <strong style={{ fontSize: 14, color: '#1a237e' }}>{resultado.nombre}</strong>
              <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>
                {resultado.tipoDoc} {resultado.numDoc}
              </div>
            </div>
            <span style={{
              padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700,
              background: estadoColor === '#2e7d32' ? '#e8f5e9' : '#fce4ec',
              color: estadoColor,
              border: `1px solid ${estadoColor}`,
            }}>
              {resultado.estado}
            </span>
          </div>

          {resultado.registros.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {resultado.registros.map((reg, i) => (
                <div key={i} style={{
                  marginTop: 6, paddingTop: 6,
                  borderTop: i > 0 ? '1px dashed #e0e0e0' : 'none',
                  fontSize: 13,
                }}>
                  {reg.profesion && (
                    <div>
                      <span style={{ color: '#555' }}>Profesión: </span>
                      <strong>{reg.profesion}</strong>
                    </div>
                  )}
                  {reg.tipoRegistro && (
                    <div>
                      <span style={{ color: '#555' }}>Tipo registro: </span>
                      {reg.tipoRegistro}
                    </div>
                  )}
                  {reg.numRegistro && (
                    <div>
                      <span style={{ color: '#555' }}>No. registro: </span>
                      {reg.numRegistro}
                    </div>
                  )}
                  {reg.departamento && (
                    <div>
                      <span style={{ color: '#555' }}>Departamento: </span>
                      {reg.departamento}
                    </div>
                  )}
                  {reg.fechaInscripcion && (
                    <div>
                      <span style={{ color: '#555' }}>Inscripción: </span>
                      {reg.fechaInscripcion}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No encontrado */}
      {noEncontrado && (
        <div style={{
          marginTop: 10, padding: '8px 12px',
          background: '#fff3e0', border: '1px solid #ffb74d', borderRadius: 4,
          fontSize: 13, color: '#e65100',
        }}>
          No se encontró registro en RETHUS para el documento ingresado.
          Verifique el número o consulte directamente en{' '}
          <a href="https://rethus.minsalud.gov.co" target="_blank" rel="noopener noreferrer"
            style={{ color: '#1565c0' }}>
            rethus.minsalud.gov.co
          </a>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          marginTop: 10, padding: '8px 12px',
          background: '#fce4ec', border: '1px solid #e57373', borderRadius: 4,
          fontSize: 13, color: '#c62828',
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default RethusConsulta;
