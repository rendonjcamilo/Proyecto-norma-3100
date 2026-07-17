# Pull Request

## Resumen
<!-- Breve descripción de los cambios y su propósito -->

## Tipo de cambio
- [ ] feat: Nueva funcionalidad
- [ ] fix: Corrección de bug
- [ ] refactor: Refactorización (sin cambio funcional)
- [ ] perf: Mejora de rendimiento
- [ ] docs: Documentación
- [ ] test: Tests
- [ ] chore: Tareas de mantenimiento
- [ ] security: Mejora de seguridad

## Módulo afectado
- [ ] Backend (API, services, models)
- [ ] Frontend (UI, components)
- [ ] Base de datos (schemas, migrations)
- [ ] CI/CD
- [ ] Documentación

## Checklist de calidad
- [ ] He probado los cambios localmente
- [ ] He agregado/actualizado tests cuando aplica
- [ ] `npm run lint` pasa sin errores
- [ ] `npm run build` compila sin errores
- [ ] Los cambios respetan la Norma 3100
- [ ] He actualizado la documentación (OpenAPI, README) cuando aplica

## Checklist de seguridad (OBLIGATORIO — no mergear sin completar)
- [ ] No incluyo secretos, credenciales ni datos sensibles en el código o en variables de entorno hardcodeadas
- [ ] Nuevos endpoints públicos tienen rate limiting aplicado (`authLimiter` / `apiLimiter`)
- [ ] Nuevas tablas con datos de usuario/tenant tienen RLS habilitado
- [ ] Queries SQL usan prepared statements (sin concatenación de strings)
- [ ] Si hay nuevos puertos en `docker-compose`: DB/Redis en red interna (sin `ports:` o solo `127.0.0.1:`)
- [ ] Healthchecks en contenedores nuevos usan `interval: 30s` mínimo
- [ ] He revisado RBAC: ¿los nuevos endpoints validan rol antes de responder?

## Cómo probar
<!-- Pasos para validar los cambios -->
1.
2.
3.

## Issues relacionados
<!-- Closes #123 -->

## Screenshots (si aplica)
<!-- Imágenes de antes/después para cambios de UI -->
