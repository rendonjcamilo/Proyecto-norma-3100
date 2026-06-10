export function TermsOfServicePage(): JSX.Element {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px', fontFamily: 'Inter, system-ui, sans-serif', color: '#1f2937', lineHeight: '1.7' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#4f46e5', marginBottom: '8px' }}>
          Términos y Condiciones de Uso
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>
          HabilitaPro — Última actualización: junio de 2025
        </p>
      </div>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={h2}>1. Aceptación de los términos</h2>
        <p>
          Al acceder y utilizar la plataforma <strong>HabilitaPro</strong> (app.habilitapro.com), el usuario
          acepta los presentes Términos y Condiciones de Uso. Si no está de acuerdo con alguno de estos
          términos, debe abstenerse de usar la plataforma.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={h2}>2. Descripción del servicio</h2>
        <p>
          HabilitaPro es una plataforma de gestión de cumplimiento normativo que permite a los prestadores
          de servicios de salud en Colombia:
        </p>
        <ul style={ul}>
          <li>Realizar autoevaluaciones frente a la <strong>Resolución 3100 de 2019</strong> del Ministerio de Salud y Protección Social.</li>
          <li>Gestionar hallazgos, inconformidades y oportunidades de mejora.</li>
          <li>Adjuntar evidencias documentales de cumplimiento.</li>
          <li>Facilitar procesos de auditoría y verificación ante organismos de control.</li>
          <li>Generar reportes de seguimiento del cumplimiento normativo.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={h2}>3. Registro y cuenta de usuario</h2>
        <p>
          El acceso a HabilitaPro requiere la creación de una cuenta con credenciales válidas. El usuario es
          responsable de:
        </p>
        <ul style={ul}>
          <li>Mantener la confidencialidad de su contraseña.</li>
          <li>Notificar de inmediato cualquier acceso no autorizado a su cuenta.</li>
          <li>Garantizar que la información registrada sea veraz, completa y actualizada.</li>
          <li>No compartir sus credenciales con terceros.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={h2}>4. Uso permitido</h2>
        <p>La plataforma está diseñada exclusivamente para uso profesional en el contexto del sistema de
          salud colombiano. Está prohibido:</p>
        <ul style={ul}>
          <li>Usar la plataforma para fines distintos a la gestión de cumplimiento normativo en salud.</li>
          <li>Suplantar la identidad de otro usuario, prestador o entidad.</li>
          <li>Cargar contenido falso, fraudulento o que induzca a error en los procesos de habilitación.</li>
          <li>Intentar acceder a datos de otros prestadores sin autorización.</li>
          <li>Realizar ingeniería inversa, descompilar o extraer el código fuente de la plataforma.</li>
          <li>Usar herramientas automatizadas para sobrecargar los servidores o vulnerar la seguridad del sistema.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={h2}>5. Integración con Google Drive</h2>
        <p>
          La plataforma ofrece integración con Google Drive para adjuntar documentos de evidencia. Al usar
          esta funcionalidad, el usuario:
        </p>
        <ul style={ul}>
          <li>Autoriza a HabilitaPro a acceder únicamente al archivo que seleccione explícitamente.</li>
          <li>Es responsable de que los archivos compartidos sean de su propiedad o que cuente con autorización para usarlos.</li>
          <li>Acepta que HabilitaPro almacenará dicho archivo en sus servidores como evidencia de cumplimiento normativo.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={h2}>6. Propiedad intelectual</h2>
        <p>
          Todo el contenido, diseño, código, marcas y materiales de HabilitaPro son propiedad de
          <strong> G2 Intelligence S.A.S.</strong> y están protegidos por las leyes colombianas e internacionales
          de propiedad intelectual. El usuario no adquiere ningún derecho de propiedad sobre la plataforma
          por el hecho de utilizarla.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={h2}>7. Disponibilidad del servicio</h2>
        <p>
          HabilitaPro se esfuerza por mantener la plataforma disponible de forma continua, pero no garantiza
          una disponibilidad del 100%. Pueden presentarse interrupciones por mantenimiento, actualizaciones
          o causas ajenas al control de G2 Intelligence S.A.S. No nos hacemos responsables por pérdidas
          derivadas de la indisponibilidad temporal del servicio.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={h2}>8. Limitación de responsabilidad</h2>
        <p>
          HabilitaPro es una herramienta de apoyo a la gestión del cumplimiento normativo. No reemplaza el
          criterio profesional de los prestadores de salud, auditores ni el concepto oficial de los organismos
          de control. G2 Intelligence S.A.S. no es responsable por:
        </p>
        <ul style={ul}>
          <li>Decisiones tomadas con base en los reportes generados por la plataforma.</li>
          <li>Resultados de procesos de habilitación o acreditación ante entidades gubernamentales.</li>
          <li>Errores en la información ingresada por los usuarios.</li>
          <li>Daños indirectos, lucro cesante o pérdida de datos por causas fuera de nuestro control.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={h2}>9. Suspensión y terminación</h2>
        <p>
          HabilitaPro se reserva el derecho de suspender o cancelar el acceso de cualquier usuario que
          incumpla los presentes términos, realice usos indebidos de la plataforma, o cuya conducta
          ponga en riesgo la seguridad o integridad del sistema.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={h2}>10. Modificaciones</h2>
        <p>
          G2 Intelligence S.A.S. puede modificar estos términos en cualquier momento. Los cambios serán
          comunicados a través de la plataforma y/o correo electrónico. El uso continuado del servicio
          tras la notificación implica la aceptación de los nuevos términos.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={h2}>11. Ley aplicable y jurisdicción</h2>
        <p>
          Los presentes términos se rigen por las leyes de la <strong>República de Colombia</strong>.
          Cualquier controversia será resuelta ante los jueces competentes de la ciudad de
          <strong> Bogotá D.C.</strong>, salvo que las partes acuerden un mecanismo alternativo de
          solución de conflictos.
        </p>
      </section>

      <section style={{ marginBottom: '48px' }}>
        <h2 style={h2}>12. Contacto</h2>
        <p>Para consultas sobre estos términos:</p>
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
