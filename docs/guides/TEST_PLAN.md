# Plan de Testeo MVP - Norma 3100 Dashboard

**Estado:** En Progreso  
**Fecha:** 2026-04-12  
**Ambiente:** http://localhost:5173  
**Credenciales:** Email: admin@test.com | 4 Roles Mock disponibles

---

## 📋 Módulo 1: Autenticación ✅ COMPLETADO

### ✅ 1.1 Login Mock
- [ ] Abre http://localhost:5173
- [ ] Verifica que ves LoginPage con logo "Norma 3100"
- [ ] Email prellenado: admin@test.com
- [ ] Click "Mostrar opciones de prueba"
- [ ] Aparecen 4 botones: Super Admin, Admin Prestador, Auditor, Visualizador
- [ ] **Test 1A:** Click "Admin Prestador" → Redirige a Dashboard
- [ ] **Test 1B:** Click "Super Admin" → Redirige a Dashboard (mismo flujo)
- [ ] Verifica avatar en sidebar con initiales correctas (UP = Usuario Prueba)

### ✅ 1.2 Logout
- [ ] En el Dashboard, click avatar en sidebar (esquina inferior)
- [ ] Aparece dropdown con "🚪 Cerrar Sesión"
- [ ] Click logout → Redirige a LoginPage
- [ ] Verifica que localStorage se limpió (abre DevTools → Application → localStorage)

### ✅ 1.3 Persistencia de Sesión
- [ ] Login con un rol mock
- [ ] Recarga la página (F5)
- [ ] Verifica que sigues logueado (no redirige a login)
- [ ] Cierra sesión y recarga
- [ ] Verifica que te redirige a login

---

## 📊 Módulo 2: Dashboard Principal

### 2.1 KPIs y Métricas
- [ ] **Test 2A:** Verifica que se muestren 4 cards principales:
  - "CUMPLIMIENTO GENERAL" → 70% (gauge)
  - "TENDENCIA MENSUAL" → +5.2% (con icono mejorado)
  - "RIESGO PROMEDIO" → 65/100 (gauge)
  - "CONFORMIDAD" → 35 en proceso/resueltos
- [ ] **Test 2B:** Verifica colores:
  - 70% compliance → Verde/Amarillo
  - 65 risk → Amarillo (riesgo moderado)
  - +5.2% → Verde (mejorando)
- [ ] **Test 2C:** Hover sobre las cards → Muestra tooltip con explicación

### 2.2 Gráfico de Estados de Hallazgos
- [ ] **Test 2D:** Verifica 5 botones de estado:
  - Abiertos (20%, 10)
  - En Progreso (40%, 20)
  - Resueltos (30%, 15)
  - Cerrados (10%, 5)
  - Vencidos (6%, 3)
- [ ] **Test 2E:** Click en cada botón → Muestra detalles/lista filtrada
- [ ] **Test 2F:** Abajo hay gráfico de pastel con los 4 estados principales

### 2.3 Alertas de Riesgo
- [ ] **Test 2G:** Verifica 3 alertas en rojo/naranja:
  - "Sistema de backup no operacional" (Critical, 92)
  - "Certificaciones vencidas" (High, 85)
  - "Protocolos desactualizados" (High, 78)
- [ ] **Test 2H:** Click en alerta → Expande con detalles

### 2.4 Controles del Dashboard
- [ ] **Test 2I:** Checkbox "Auto-actualizar" → Alterna estado
- [ ] **Test 2J:** Click botón "Actualizar" → Simula refresh de datos (spinner ~1s)
- [ ] **Test 2K:** Breadcrumb arriba dice "SISTEMA OPERATIVO · DATOS EN TIEMPO REAL"

---

## 🚨 Módulo 3: Página Hallazgos (/findings)

### 3.1 Navegación
- [ ] **Test 3A:** Click "Hallazgos" en sidebar → Navega a /findings
- [ ] **Test 3B:** Verifica URL cambió a http://localhost:5173/findings
- [ ] **Test 3C:** Página muestra header "Hallazgos" con subtítulo

### 3.2 Filtros por Estado
- [ ] **Test 3D:** Verifica tabs horizontales:
  - "Todos" (default, activo)
  - "Abiertos"
  - "En Progreso"
  - "Resueltos"
  - "Cerrados"
  - "Vencidos"
- [ ] **Test 3E:** Click cada tab → Lista se filtra
- [ ] **Test 3F:** Badge rojo "10" indica hallazgos abiertos

### 3.3 Lista de Hallazgos
- [ ] **Test 3G:** Cada hallazgo muestra:
  - Icono de severidad (crítico=rojo, alto=naranja, medio=amarillo)
  - Título del hallazgo
  - Descripción corta
  - Fecha de vencimiento
  - Badge de estado
- [ ] **Test 3H:** Click en hallazgo → Expande o abre detalle

### 3.4 Búsqueda y Filtros Avanzados
- [ ] **Test 3I:** Busca por "backup" en barra de búsqueda → Filtra hallazgos
- [ ] **Test 3J:** Filtro por severidad (dropdown) → Solo muestra ese nivel
- [ ] **Test 3K:** Filtro por rango de fechas → Filtra por vencimiento

---

## 📋 Módulo 4: Página Evaluaciones (/assessments)

### 4.1 Navegación
- [ ] **Test 4A:** Click "Evaluaciones" en sidebar → /assessments
- [ ] **Test 4B:** Verifica header "Evaluaciones"

### 4.2 Grid de Evaluaciones
- [ ] **Test 4C:** Verifica cards de assessments en grid 2-3 columnas:
  - Nombre del prestador
  - % de cumplimiento (barra de progreso)
  - Fecha de evaluación
  - Estado (En progreso, Completada, etc.)
- [ ] **Test 4D:** Colores: <40% rojo, 40-70% naranja, >70% verde
- [ ] **Test 4E:** Click card → Abre detalle de la evaluación

### 4.3 Detalles de Evaluación
- [ ] **Test 4F:** Muestra:
  - Nombre del prestador
  - Porcentaje general
  - Semáforo visual (Verde/Amarillo/Rojo)
  - Criterios respondidos vs totales
  - Historial de cambios
- [ ] **Test 4G:** Botón "Ver Criterios" → Lista todos los criterios de Norma 3100

---

## 🏥 Módulo 5: Página Proveedores (/providers)

### 5.1 Navegación
- [ ] **Test 5A:** Click "Proveedores" en sidebar → /providers
- [ ] **Test 5B:** Verifica header "Proveedores"

### 5.2 Tabla de Proveedores
- [ ] **Test 5C:** Columnas visibles:
  - Nombre
  - RUT/Identificación
  - Ciudad
  - Estado (Habilitado/Suspendido)
  - Compliance %
  - Último audit
- [ ] **Test 5D:** Filas tienen colores alternados (blanco/gris claro)

### 5.3 Búsqueda
- [ ] **Test 5E:** Busca por nombre "Hospital" → Filtra resultados
- [ ] **Test 5F:** Busca por RUT → Filtra resultados
- [ ] **Test 5G:** Busca por ciudad → Filtra resultados

### 5.4 Estados y Badges
- [ ] **Test 5H:** Estado "Habilitado" → Badge verde
- [ ] **Test 5I:** Estado "Suspendido" → Badge rojo
- [ ] **Test 5J:** Compliance: rojo si <40%, naranja si 40-70%, verde si >70%

### 5.5 Acciones
- [ ] **Test 5K:** Click en prestador → Abre detalle/perfil
- [ ] **Test 5L:** Botón "Ver Evaluaciones" → Navega a /assessments filtrado
- [ ] **Test 5M:** Botón "Auditoría" → Abre historia de auditorías

---

## 📄 Módulo 6: Página Documentos (Matriz Documental)

### 6.1 Navegación
- [ ] **Test 6A:** Click "Matriz Documental" en sidebar → /documents
- [ ] **Test 6B:** Verifica header "Matriz Documental - Norma 3100"

### 6.2 Catálogo de Documentos
- [ ] **Test 6C:** Verifica ~108 documentos en categorías:
  - Gestión Documental
  - Gestión Talento Humano
  - Gestión Infraestructura
  - Gestión Financiera
  - etc.
- [ ] **Test 6D:** Cada documento muestra:
  - Código (ej: GD-001)
  - Nombre
  - Descripción
  - Estatus de cumplimiento
  - Fecha de actualización

### 6.3 Filtros
- [ ] **Test 6E:** Filtro por categoría → Solo muestra esa categoría
- [ ] **Test 6F:** Filtro por estatus (Cumple/No Cumple) → Filtra
- [ ] **Test 6G:** Búsqueda por nombre/código → Filtra

### 6.4 Upload de Documentos
- [ ] **Test 6H:** Click "Subir Documento" → Abre modal
- [ ] **Test 6I:** Modal tiene:
  - Selector de documento requerido
  - Campo de archivo (drag-drop o click)
  - Fecha de evidencia
  - Notas opcionales
- [ ] **Test 6J:** Drag-drop archivo → Lo acepta
- [ ] **Test 6K:** Click "Subir" → Simula upload (~2s) → Muestra confirmación

### 6.5 Ver Evidencia
- [ ] **Test 6L:** Click documento → Muestra evidencias cargadas
- [ ] **Test 6M:** Cada evidencia muestra:
  - Nombre de archivo
  - Fecha de upload
  - Usuario que subió
  - Checksum SHA-256 (primeros 8 caracteres)

---

## 📊 Módulo 7: Página Reportes (/reports)

### 7.1 Navegación
- [ ] **Test 7A:** Click "Reportes" en sidebar → /reports
- [ ] **Test 7B:** Verifica header "Reportes de Cumplimiento"

### 7.2 Opciones de Reporte
- [ ] **Test 7C:** Verifica 2 botones principales:
  - "📥 Descargar PDF"
  - "📊 Descargar Excel"
- [ ] **Test 7D:** Cada botón muestra descripcción

### 7.3 Generar PDF
- [ ] **Test 7E:** Click "Descargar PDF" → Simula generación (~3s)
- [ ] **Test 7F:** Muestra preview del PDF generado:
  - Header con logo Norma 3100
  - Datos del prestador
  - Resultados de compliance
  - Tabla de hallazgos
  - Firma de auditor
- [ ] **Test 7G:** Botón "Descargar" en preview → Descarga el PDF

### 7.4 Generar Excel
- [ ] **Test 7H:** Click "Descargar Excel" → Simula generación
- [ ] **Test 7I:** Muestra preview con:
  - Resumen en primera hoja
  - Hallazgos en segunda hoja
  - Documentos en tercera hoja
  - Criterios en cuarta hoja
- [ ] **Test 7J:** Botón "Descargar" → Descarga el Excel

---

## 🔔 Módulo 8: Notificaciones

### 8.1 Bell Icon (TopBar)
- [ ] **Test 8A:** TopBar derecha muestra 🔔 (campana)
- [ ] **Test 8B:** Hover sobre campana → Tooltip "Notificaciones"
- [ ] **Test 8C:** Número rojo en esquina si hay notificaciones no leídas

### 8.2 Panel de Notificaciones
- [ ] **Test 8D:** Click campana → Abre panel lateral
- [ ] **Test 8E:** Panel muestra lista de notificaciones:
  - Hallazgo vencido
  - Evaluación completada
  - Documento rechazado
  - etc.

### 8.3 Preferencias (/notifications/preferences)
- [ ] **Test 8F:** Click "Preferencias" en sidebar → /notifications/preferences
- [ ] **Test 8G:** Verifica toggles para:
  - Email
  - SMS
  - Push notifications
- [ ] **Test 8H:** Toggle encendido/apagado → Cambia ícono

### 8.4 Analíticas (/notifications/analytics)
- [ ] **Test 8I:** Click "Analíticas" en sidebar
- [ ] **Test 8J:** Muestra gráficos de:
  - Notificaciones enviadas (últimos 7 días)
  - Tasa de apertura
  - Canales más usados

---

## 🎨 Módulo 9: UI/UX General

### 9.1 Sidebar
- [ ] **Test 9A:** Click hamburguesa (☰) → Sidebar colapsa
- [ ] **Test 9B:** En mobile, overlay oscuro cubriendo contenido
- [ ] **Test 9C:** Todos los enlaces activos están resaltados
- [ ] **Test 9D:** Badges en "Hallazgos" (10) se mantienen actualizados

### 9.2 TopBar
- [ ] **Test 9E:** Breadcrumb muestra ruta actual
- [ ] **Test 9F:** Search bar (Cmd+K) es funcional
- [ ] **Test 9G:** Botones: Ayuda, Configuración, Notificaciones
- [ ] **Test 9H:** Responsive en mobile

### 9.3 Responsividad
- [ ] **Test 9I:** Redimensiona navegador a 320px (mobile)
- [ ] **Test 9J:** Sidebar colapsa automáticamente
- [ ] **Test 9K:** Grid se convierte a 1 columna
- [ ] **Test 9L:** Botones son clickeables (hit area >44px)
- [ ] **Test 9M:** Redimensiona a tablet (768px)
- [ ] **Test 9N:** Grid es 2-3 columnas

### 9.4 Navegación
- [ ] **Test 9O:** Click cada link en sidebar → Navega correctamente
- [ ] **Test 9P:** URL cambia según ruta
- [ ] **Test 9Q:** Back button del navegador funciona
- [ ] **Test 9R:** Refresh en cualquier ruta mantiene la sesión

### 9.5 Estilos y Colores
- [ ] **Test 9S:** Verifica paleta:
  - Primario (azul) para botones
  - Rojo para crítico/error
  - Naranja para advertencia
  - Verde para éxito
  - Gris para secundario
- [ ] **Test 9T:** Contraste de texto suficiente (WCAG AA)
- [ ] **Test 9U:** Fuentes legibles en todos los tamaños

---

## 🔗 Módulo 10: Navegación y Enrutamiento

### 10.1 Rutas Protegidas
- [ ] **Test 10A:** Sin autenticación, acceso a /dashboard → Redirige a /login
- [ ] **Test 10B:** Sin autenticación, acceso a /findings → Redirige a /login
- [ ] **Test 10C:** Autenticado, acceso a /login → Redirige a /

### 10.2 Rutas Inexistentes
- [ ] **Test 10D:** Acceso a /ruta-inexistente → Redirige a / o muestra 404
- [ ] **Test 10E:** URL malformada → Maneja con gracia

### 10.3 Parámetros en URL
- [ ] **Test 10F:** /assessments?provider=prov-001 → Filtra si implementado
- [ ] **Test 10G:** /findings?status=open → Filtra hallazgos abiertos

---

## ⚡ Módulo 11: Performance

### 11.1 Carga Inicial
- [ ] **Test 11A:** Primera carga del dashboard (F5) → <3 segundos
- [ ] **Test 11B:** Elementos empiezan a aparecer progresivamente

### 11.2 Navegación Entre Páginas
- [ ] **Test 11C:** Click entre links → <500ms de cambio visual
- [ ] **Test 11D:** No hay parpadeos o saltos de contenido

### 11.3 DevTools
- [ ] **Test 11E:** Abre DevTools (F12) → Console sin errores rojos
- [ ] **Test 11F:** Network tab → Solicitudes terminan correctamente
- [ ] **Test 11G:** Performance tab → Buen Lighthouse score

---

## 🔒 Módulo 12: Seguridad Básica

### 12.1 Auth Storage
- [ ] **Test 12A:** DevTools → Application → localStorage
- [ ] **Test 12B:** Verifica que existe `auth_token` y `auth_user`
- [ ] **Test 12C:** Token está en formato JWT (3 partes separadas por .)

### 12.2 No Exposición de Datos
- [ ] **Test 12D:** En Network tab, requests no muestran contraseñas
- [ ] **Test 12E:** Request/Response están limpios (no logs sensibles)

### 12.3 XSS Prevention
- [ ] **Test 12F:** En barra de búsqueda, escribe: `<script>alert(1)</script>`
- [ ] **Test 12G:** No ejecuta script, muestra como texto

---

## 📈 Resumen de Testeo

| Módulo | Tests | Status |
|--------|-------|--------|
| 1. Autenticación | 5 | ✅ |
| 2. Dashboard | 7 | ⏳ |
| 3. Hallazgos | 4 | ⏳ |
| 4. Evaluaciones | 4 | ⏳ |
| 5. Proveedores | 6 | ⏳ |
| 6. Documentos | 7 | ⏳ |
| 7. Reportes | 4 | ⏳ |
| 8. Notificaciones | 4 | ⏳ |
| 9. UI/UX General | 6 | ⏳ |
| 10. Navegación | 5 | ⏳ |
| 11. Performance | 3 | ⏳ |
| 12. Seguridad | 3 | ⏳ |
| **TOTAL** | **58** | **5 / 58** |

---

## 📝 Notas Importantes

- Los tests 2.1-2.4 (Dashboard) y 1.1-1.3 (Auth) ya fueron completados
- Los datos mostrados son **mock** — en producción vendrán de la API
- Algunos tests pueden mostrar "simula" porque la BD no está conectada
- Cuando la BD esté lista, los datos serán reales

---

## 🚀 Próximos Pasos

1. **Completar tests del Dashboard** (Módulo 2) — Continuamos desde 2.1
2. **Hallazgos** (Módulo 3) — Verificar filtros y estados
3. **Evaluaciones** (Módulo 4) — Verificar cálculos de %
4. **Rest de módulos** — Uno por uno

¿Empezamos con el Dashboard?
