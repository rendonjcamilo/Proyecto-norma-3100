export function PrivacyPolicyPage(): JSX.Element {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px', fontFamily: 'Inter, system-ui, sans-serif', color: '#1f2937', lineHeight: '1.7' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#4f46e5', marginBottom: '8px' }}>
          Política de Privacidad y Tratamiento de Datos Personales
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>
          HabilitaPro — Última actualización: junio de 2025
        </p>
      </div>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={h2}>1. Responsable del tratamiento</h2>
        <p>
          <strong>G2 Intelligence S.A.S.</strong>, en adelante <em>HabilitaPro</em>, con domicilio en Colombia,
          es el responsable del tratamiento de los datos personales recolectados a través de la plataforma
          accesible en <strong>app.habilitapro.com</strong>.
        </p>
        <p>Contacto para asuntos de privacidad: <strong>hola@g2intelligence.co</strong></p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={h2}>2. Marco legal aplicable</h2>
        <p>
          El tratamiento de datos personales se rige por la <strong>Ley 1581 de 2012</strong> (Ley de Protección
          de Datos Personales de Colombia), el <strong>Decreto 1377 de 2013</strong>, y demás normas
          concordantes. Los datos de salud son tratados con las medidas reforzadas que exige la normativa
          colombiana para datos sensibles.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={h2}>3. Datos que recopilamos</h2>
        <ul style={ul}>
          <li><strong>Datos de cuenta:</strong> nombre, correo electrónico, contraseña cifrada, rol asignado.</li>
          <li><strong>Datos del prestador de salud:</strong> razón social, NIT, sede, servicios habilitados.</li>
          <li><strong>Datos de evaluación:</strong> respuestas a criterios de la Resolución 3100, evidencias adjuntas, hallazgos, acciones correctivas.</li>
          <li><strong>Documentos adjuntos:</strong> archivos subidos manualmente o seleccionados desde Google Drive por el propio usuario.</li>
          <li><strong>Datos de uso:</strong> registros de acceso, acciones realizadas en la plataforma (audit log).</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={h2}>4. Integración con Google Drive</h2>
        <p>
          HabilitaPro permite al usuario adjuntar documentos almacenados en su cuenta personal de Google Drive
          como evidencia de cumplimiento normativo. Para ello:
        </p>
        <ul style={ul}>
          <li>
            Se solicita el permiso <strong>drive.readonly</strong>, que permite únicamente <em>leer y descargar</em> los
            archivos que el usuario seleccione explícitamente a través del selector de Google Drive (Google Picker).
          </li>
          <li>
            HabilitaPro <strong>no accede, no lee ni indexa</strong> ningún otro archivo del Drive del usuario más
            allá del seleccionado en cada acción.
          </li>
          <li>
            El acceso a Google Drive es temporal y se realiza exclusivamente durante la sesión activa del usuario.
            No almacenamos tokens de acceso de Google de forma persistente.
          </li>
          <li>
            El archivo seleccionado es descargado y almacenado en los servidores seguros de HabilitaPro
            únicamente como evidencia asociada a la evaluación normativa del prestador.
          </li>
        </ul>
        <p>
          El uso de los datos obtenidos a través de las APIs de Google cumple con la
          <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer"
            style={{ color: '#4f46e5', marginLeft: '4px' }}>
            Política de Datos de Usuario de los Servicios API de Google
          </a>, incluyendo los requisitos de Uso Limitado.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={h2}>5. Finalidades del tratamiento</h2>
        <ul style={ul}>
          <li>Gestionar el acceso autenticado a la plataforma.</li>
          <li>Permitir la autoevaluación y verificación de cumplimiento ante la Resolución 3100 de 2019.</li>
          <li>Generar reportes de auditoría y seguimiento de hallazgos.</li>
          <li>Garantizar la integridad y trazabilidad de las evaluaciones mediante cadena de eventos (event sourcing).</li>
          <li>Cumplir con obligaciones legales ante organismos de control del sistema de salud colombiano.</li>
          <li>Mejorar y mantener la seguridad de la plataforma.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={h2}>6. Transferencia y almacenamiento</h2>
        <p>
          Los datos se almacenan en servidores seguros ubicados en centros de datos con estándares de
          seguridad internacionales. No vendemos ni cedemos datos personales a terceros con fines comerciales.
          Podemos compartir información con proveedores de infraestructura tecnológica bajo acuerdos de
          confidencialidad y únicamente para la prestación del servicio.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={h2}>7. Derechos del titular</h2>
        <p>
          De conformidad con la Ley 1581 de 2012, usted tiene derecho a:
        </p>
        <ul style={ul}>
          <li><strong>Conocer</strong> los datos personales que HabilitaPro tiene sobre usted.</li>
          <li><strong>Actualizar y rectificar</strong> sus datos cuando sean inexactos o incompletos.</li>
          <li><strong>Suprimir</strong> sus datos cuando no sean necesarios para las finalidades autorizadas.</li>
          <li><strong>Revocar la autorización</strong> de tratamiento de datos en cualquier momento.</li>
          <li><strong>Presentar quejas</strong> ante la Superintendencia de Industria y Comercio (SIC).</li>
        </ul>
        <p>
          Para ejercer estos derechos, envíe su solicitud a: <strong>privacidad@g2intelligence.co</strong>
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={h2}>8. Seguridad de la información</h2>
        <p>
          Implementamos medidas técnicas y organizativas para proteger sus datos, incluyendo:
          cifrado en tránsito (HTTPS/TLS), contraseñas cifradas con bcrypt, control de acceso basado en roles
          (RBAC), registros de auditoría y cadena de hash de integridad en eventos críticos.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={h2}>9. Cambios a esta política</h2>
        <p>
          HabilitaPro puede actualizar esta política en cualquier momento. Las modificaciones se comunicarán
          mediante aviso en la plataforma y/o correo electrónico. El uso continuado de la plataforma tras la
          notificación implica la aceptación de los cambios.
        </p>
      </section>

      <section style={{ marginBottom: '48px' }}>
        <h2 style={h2}>10. Contacto</h2>
        <p>
          Para cualquier consulta relacionada con el tratamiento de sus datos personales:
        </p>
        <ul style={ul}>
          <li>Correo: <strong>hola@g2intelligence.co</strong></li>
          <li>Sitio web: <strong>app.habilitapro.com</strong></li>
        </ul>
      </section>

      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '24px', textAlign: 'center' }}>
        <a href="/" style={{ color: '#4f46e5', fontSize: '14px', textDecoration: 'none' }}>
          ← Volver a HabilitaPro
        </a>
      </div>
    </div>
  );
}

const h2: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#111827',
  marginBottom: '12px',
  marginTop: '0',
  paddingBottom: '8px',
  borderBottom: '1px solid #f3f4f6',
};

const ul: React.CSSProperties = {
  paddingLeft: '20px',
  marginTop: '8px',
};
