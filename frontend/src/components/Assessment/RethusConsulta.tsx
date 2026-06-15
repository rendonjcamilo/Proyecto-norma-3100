import React, { useState } from 'react';

const PORTAL_URL = 'http://web.sispro.gov.co/THS/Cliente/ConsultasPublicas/ConsultaPublicaDeTHxIdentificacion.aspx';

const TIPOS = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'TI', label: 'Tarjeta de Identidad' },
  { value: 'PA', label: 'Pasaporte' },
];

const RethusConsulta: React.FC = () => {
  const [tipoDoc, setTipoDoc] = useState('CC');
  const [numDoc, setNumDoc] = useState('');

  const handleAbrir = () => {
    window.open(PORTAL_URL, '_blank', 'noopener,noreferrer');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && numDoc.trim().length >= 4) handleAbrir();
  };

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
          Verificar inscripción en ReTHUS
        </strong>
        <span style={{ fontSize: 11, color: '#555', marginLeft: 4 }}>
          (Ley 1164 de 2007 — portal SISPRO/MINSALUD)
        </span>
      </div>

      <div style={{ fontSize: 12, color: '#444', marginBottom: 10 }}>
        Ingrese el documento del profesional y abra el portal oficial para verificar su inscripción.
        El portal solicita CAPTCHA y nombre del profesional.
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={tipoDoc}
          onChange={(e) => setTipoDoc(e.target.value)}
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
          placeholder="Número de documento (referencia)"
          value={numDoc}
          onChange={(e) => setNumDoc(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={15}
          style={{
            padding: '6px 10px', borderRadius: 4, border: '1px solid #90caf9',
            fontSize: 13, width: 200, background: '#fff',
          }}
        />

        <button
          type="button"
          onClick={handleAbrir}
          style={{
            padding: '6px 16px', borderRadius: 4, border: 'none',
            background: '#1565c0',
            color: '#fff', fontSize: 13, cursor: 'pointer',
            fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          Consultar en portal SISPRO ↗
        </button>
      </div>

      <div style={{
        marginTop: 10, fontSize: 11, color: '#666',
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        <span>Enlace directo:</span>
        <a
          href={PORTAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#1565c0', fontSize: 11 }}
        >
          web.sispro.gov.co — Consulta Pública ReTHUS
        </a>
      </div>
    </div>
  );
};

export default RethusConsulta;
