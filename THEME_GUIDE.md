# 🎨 Sistema de Temas Global - Admin Dashboards

## Visión
Un sistema de diseño profesional, moderno y elegante que unifica todos los dashboards de administrador con:
- **Colores coherentes** (Azul primario #0052cc con gradientes)
- **Tipografía consistente** (Inter + JetBrains Mono)
- **Componentes reutilizables** (Botones, tablas, modales)
- **Experiencia fluida** (Animaciones y transiciones suaves)

---

## 🎯 Características Principales

### 1. **Paleta de Colores**
```css
Primarios:
- --brand-primary: #0052cc (Azul profesional)
- --brand-secondary: #00b8d9 (Teal/Cyan)
- --brand-accent: #6554c0 (Púrpura)

Estados:
- Success: #00875a (Verde)
- Warning: #ff8b00 (Naranja)
- Danger: #de350b (Rojo)
- Info: #0052cc (Azul)

Neutral (Grises profesionales):
- White: #ffffff
- Light: #f4f5f7
- Medium: #6b778c
- Dark: #172b4d
```

### 2. **Componentes**
- ✅ Botones (Primary, Secondary, Danger)
- ✅ Tablas con header gradiente
- ✅ Modales con animaciones
- ✅ Formularios con validación visual
- ✅ Búsqueda y toolbar
- ✅ Tarjetas con hover effects

### 3. **Animaciones**
- Fade in/up suave (300ms)
- Hover effects con elevación
- Transiciones de color fluidas
- Backdrop blur en modales

---

## 📝 Cómo Usar en Tus Dashboards

### Opción 1: Usar Clases Predefinidas (Recomendado)

#### Dashboard Container
```tsx
<div className="admin-dashboard">
  <div style={{ padding: '32px' }}>
    {/* Tu contenido aquí */}
  </div>
</div>
```

#### Header
```tsx
<div className="dashboard-header">
  <h1 className="dashboard-title">Gestión de Prestadores</h1>
  <p className="dashboard-subtitle">Administra todos los prestadores de salud</p>
</div>
```

#### Toolbar (Búsqueda + Botones)
```tsx
<div className="dashboard-toolbar">
  <div className="dashboard-search">
    <input type="text" placeholder="Buscar..." />
    <svg>...</svg>
  </div>
  <div className="dashboard-actions">
    <button className="btn-dashboard btn-dashboard-primary">
      Crear Nuevo
    </button>
  </div>
</div>
```

#### Tabla
```tsx
<div className="dashboard-table-container">
  <table className="dashboard-table">
    <thead>
      <tr>
        <th>Nombre</th>
        <th>Email</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>BEEPYRED</td>
        <td>admin@beepyred.com</td>
        <td className="dashboard-table-cell-muted">Activo</td>
      </tr>
    </tbody>
  </table>
</div>
```

#### Modal
```tsx
{showModal && (
  <div className="dashboard-modal-overlay" onClick={closeModal}>
    <div className="dashboard-modal" onClick={e => e.stopPropagation()}>
      <div className="dashboard-modal-header">
        <h2>Crear Prestador</h2>
        <button className="dashboard-modal-close">✕</button>
      </div>
      <div className="dashboard-modal-body">
        <div className="dashboard-form-group">
          <label>Nombre Legal</label>
          <input type="text" placeholder="Nombre" />
        </div>
      </div>
      <div className="dashboard-modal-footer">
        <button className="btn-dashboard btn-dashboard-secondary">Cancelar</button>
        <button className="btn-dashboard btn-dashboard-primary">Guardar</button>
      </div>
    </div>
  </div>
)}
```

#### Botones
```tsx
{/* Primary Button */}
<button className="btn-dashboard btn-dashboard-primary">
  Crear
</button>

{/* Secondary Button */}
<button className="btn-dashboard btn-dashboard-secondary">
  Cancelar
</button>

{/* Danger Button */}
<button className="btn-dashboard btn-dashboard-danger">
  Eliminar
</button>
```

---

## 🎨 Customización

### Usar Variables CSS
```tsx
<div style={{
  padding: 'var(--space-6)',
  background: 'var(--surface-raised)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-md)',
  transition: 'all var(--transition-base)'
}}>
  Contenido personalizado
</div>
```

### Variables Disponibles
- **Colores**: `--brand-primary`, `--text-primary`, `--border-default`, etc.
- **Espaciado**: `--space-2` (8px), `--space-4` (16px), `--space-6` (24px), etc.
- **Radios**: `--radius-sm` (4px), `--radius-md` (6px), `--radius-lg` (8px)
- **Sombras**: `--shadow-xs`, `--shadow-md`, `--shadow-lg`, `--shadow-2xl`
- **Transiciones**: `--transition-fast`, `--transition-base`, `--transition-slow`

---

## 📋 Dashboards a Actualizar

1. **✅ ProvidersPage** (Ya completa)
2. **UsersPage** → Aplicar tema
3. **AssessmentsPage** → Aplicar tema
4. **QuestionnairesPage** → Aplicar tema
5. **FindingsPage** → Aplicar tema
6. **InvimaPage** → Aplicar tema
7. **AuditorNotificationsPage** → Aplicar tema

---

## 🚀 Migración Rápida

Cada dashboard sigue este patrón:

```tsx
export const YourPage: React.FC = () => {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="admin-dashboard">
      <div style={{ padding: '32px', maxWidth: '1600px', margin: '0 auto' }}>
        {/* Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">Título</h1>
          <p className="dashboard-subtitle">Subtítulo descriptivo</p>
        </div>

        {/* Toolbar */}
        <div className="dashboard-toolbar">
          <div className="dashboard-search">
            <input type="text" placeholder="Buscar..." />
            <svg>...</svg>
          </div>
          <div className="dashboard-actions">
            <button className="btn-dashboard btn-dashboard-primary">
              Nuevo
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="dashboard-table-container">
          <table className="dashboard-table">
            {/* Contenido */}
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="dashboard-modal-overlay">
            <div className="dashboard-modal">
              {/* Contenido del modal */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

---

## 🎭 Ejemplos Completos

### ProvidersPage (Referencia)
Ver `frontend/src/pages/ProvidersPage.tsx` para ver la implementación completa.

### Resultado Visual
- ✨ Header con gradiente azul-cyan
- 📊 Tabla con encabezado gradiente y hover effects
- 🎯 Botones con sombras y elevación en hover
- 💫 Modal con animación slide-up y backdrop blur
- 🔍 Búsqueda profesional con iconos

---

## ⚙️ Variables de Temas Disponibles

```css
/* Colores */
--brand-primary: #0052cc
--brand-secondary: #00b8d9
--brand-accent: #6554c0
--text-primary: #172b4d
--surface-raised: #ffffff
--border-default: #dfe1e6

/* Espaciado */
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-6: 24px
--space-8: 32px

/* Sombras */
--shadow-xs: 0 1px 2px rgba(...)
--shadow-md: 0 4px 8px rgba(...)
--shadow-lg: 0 8px 16px rgba(...)
--shadow-2xl: 0 20px 32px rgba(...)

/* Transiciones */
--transition-fast: 150ms
--transition-base: 200ms
--transition-slow: 300ms
```

---

## 📱 Responsive

Todos los componentes son responsivos:
- Tablas se ajustan en móvil
- Modal se expande al 95% en pantallas pequeñas
- Toolbar apilado verticalmente en móvil

---

## ✨ Resultado Final

Un sistema de dashboards cohesivo, profesional y moderno que:
- ✅ Mantiene consistencia visual en todos los paneles
- ✅ Mejora la experiencia del usuario con animaciones fluidas
- ✅ Facilita futuras actualizaciones de diseño (cambiar variable global)
- ✅ Sigue mejores prácticas de UX/UI moderno

¡Aplica este tema a todos los dashboards y verás la transformación! 🚀
