/**
 * OpenAPI / Swagger Configuration
 * Professional API documentation for Norma 3100 Compliance Management System
 */

import swaggerJSDoc from 'swagger-jsdoc';

const version = '1.0.0';

export const openapiSpec = swaggerJSDoc({
  failOnErrors: false,
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Norma 3100 Compliance API',
      version,
      description: `
## Sistema de Gestión de Cumplimiento - Norma 3100

API profesional para la gestión integral del cumplimiento de la **Norma 3100 de 2019**
del Ministerio de Salud de Colombia, aplicable a prestadores de servicios de salud.

### Módulos disponibles

- **Autenticación**: JWT con refresh tokens, login, registro
- **Prestadores**: Gestión de prestadores de servicios de salud
- **Autoevaluaciones**: Gestión del ciclo completo de autoevaluaciones
- **Hallazgos**: Seguimiento de hallazgos con scoring de riesgo
- **Matriz Documental**: Gestión de más de 100 documentos obligatorios
- **Reportes**: Generación de reportes PDF y Excel de cumplimiento
- **Notificaciones**: Multi-canal (email, SMS, webhooks)

### Autenticación

La mayoría de endpoints requieren un token JWT. Incluya el header:

\`\`\`
Authorization: Bearer <token>
\`\`\`

Obtenga el token desde \`POST /auth/login\`.

### Rate Limiting

- **API estándar**: 100 req / 15 min
- **Autenticación**: 5 intentos / 15 min
- **Subidas**: 20 uploads / hora
- **Reportes**: 10 generaciones / 5 min
- **Webhooks**: 500 req / 15 min
      `.trim(),
      contact: {
        name: 'Soporte Técnico Norma 3100',
        email: 'soporte@norma3100.local',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Desarrollo local',
      },
      {
        url: 'https://api.norma3100.local',
        description: 'Producción',
      },
    ],
    tags: [
      { name: 'Health', description: 'Estado del sistema' },
      { name: 'Auth', description: 'Autenticación y autorización' },
      { name: 'Providers', description: 'Gestión de prestadores de salud' },
      { name: 'Assessments', description: 'Autoevaluaciones de cumplimiento' },
      { name: 'Findings', description: 'Hallazgos y seguimiento' },
      { name: 'Questions', description: 'Catálogo de preguntas normativas' },
      { name: 'Services', description: 'Servicios de salud ofertados' },
      { name: 'Documents', description: 'Matriz documental (108 docs)' },
      { name: 'Reports', description: 'Generación de reportes PDF/Excel' },
      { name: 'Notifications', description: 'Notificaciones multicanal' },
      { name: 'Webhooks', description: 'Webhooks de proveedores externos' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtenido desde /auth/login',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Bad Request' },
            message: { type: 'string', example: 'Descripción del error' },
          },
          required: ['error'],
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: { type: 'array', items: {} },
            total: { type: 'integer', example: 42 },
            page: { type: 'integer', example: 1 },
            pageSize: { type: 'integer', example: 20 },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'healthy' },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number', example: 3600 },
            environment: { type: 'string', example: 'development' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@norma3100.local' },
            password: { type: 'string', format: 'password', example: 'Pa$$w0rd!' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                email: { type: 'string', format: 'email' },
                role: { type: 'string', enum: ['super_admin', 'auditor', 'provider_admin'] },
              },
            },
          },
        },
        Provider: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            legal_name: { type: 'string', example: 'Clínica San Rafael S.A.S.' },
            rut: { type: 'string', example: '900.123.456-7' },
            city: { type: 'string', example: 'Bogotá D.C.' },
            department: { type: 'string', example: 'Cundinamarca' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Finding: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            status: { type: 'string', enum: ['open', 'in_progress', 'resolved', 'closed'] },
            risk_score: { type: 'integer', minimum: 0, maximum: 100 },
            due_date: { type: 'string', format: 'date' },
            provider_id: { type: 'string', format: 'uuid' },
          },
        },
        DocumentCatalogItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            code: { type: 'string', example: 'TA-01' },
            name: { type: 'string', example: 'Registro de Talento Humano' },
            category: { type: 'string', example: 'Talento Humano' },
            is_mandatory: { type: 'boolean' },
            expiry_months: { type: 'integer', nullable: true, example: 12 },
            standard_reference: { type: 'string', example: 'NTS-1.1' },
          },
        },
        ProviderDocument: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            provider_id: { type: 'string', format: 'uuid' },
            document_catalog_id: { type: 'string', format: 'uuid' },
            filename: { type: 'string' },
            mime_type: { type: 'string', example: 'application/pdf' },
            file_size_bytes: { type: 'integer' },
            status: { type: 'string', enum: ['pending', 'compliant', 'expired', 'rejected', 'under_review'] },
            issue_date: { type: 'string', format: 'date', nullable: true },
            expiry_date: { type: 'string', format: 'date', nullable: true },
            version: { type: 'integer' },
          },
        },
        ComplianceSummary: {
          type: 'object',
          properties: {
            provider_id: { type: 'string', format: 'uuid' },
            provider_name: { type: 'string' },
            total_required: { type: 'integer' },
            compliant_count: { type: 'integer' },
            expired_count: { type: 'integer' },
            expiring_soon_count: { type: 'integer' },
            pending_count: { type: 'integer' },
            rejected_count: { type: 'integer' },
            compliance_percentage: { type: 'number', format: 'float', example: 87.5 },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Token JWT faltante o inválido',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: 'Unauthorized', message: 'Missing or invalid Authorization header' },
            },
          },
        },
        Forbidden: {
          description: 'No tiene permisos para este recurso',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: 'Forbidden', message: 'Insufficient role' },
            },
          },
        },
        NotFound: {
          description: 'Recurso no encontrado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: 'Not Found' },
            },
          },
        },
        RateLimit: {
          description: 'Límite de peticiones excedido',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: 'Too Many Requests', retryAfter: '15 minutes' },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Estado del sistema',
          description: 'Retorna el estado de salud del servicio',
          security: [],
          responses: {
            200: {
              description: 'Sistema operativo',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/HealthResponse' },
                },
              },
            },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Iniciar sesión',
          description: 'Autentica un usuario y retorna tokens JWT',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginRequest' },
              },
            },
          },
          responses: {
            200: {
              description: 'Login exitoso',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/LoginResponse' },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            429: { $ref: '#/components/responses/RateLimit' },
          },
        },
      },
      '/api/providers': {
        get: {
          tags: ['Providers'],
          summary: 'Listar prestadores',
          responses: {
            200: {
              description: 'Lista de prestadores',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { type: 'array', items: { $ref: '#/components/schemas/Provider' } },
                      total: { type: 'integer' },
                    },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/api/documents/catalog': {
        get: {
          tags: ['Documents'],
          summary: 'Catálogo de documentos normativos',
          description: 'Lista todos los documentos del catálogo Norma 3100 (108 items)',
          parameters: [
            {
              name: 'category',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filtrar por categoría (ej: "Talento Humano")',
            },
            {
              name: 'mandatory',
              in: 'query',
              schema: { type: 'boolean' },
              description: 'Filtrar solo documentos obligatorios',
            },
          ],
          responses: {
            200: {
              description: 'Catálogo de documentos',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/DocumentCatalogItem' },
                      },
                      total: { type: 'integer' },
                    },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/api/providers/{providerId}/documents': {
        get: {
          tags: ['Documents'],
          summary: 'Documentos de un prestador',
          parameters: [
            {
              name: 'providerId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          responses: {
            200: {
              description: 'Lista de documentos del prestador',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/ProviderDocument' },
                      },
                      total: { type: 'integer' },
                    },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
        post: {
          tags: ['Documents'],
          summary: 'Subir documento para un prestador',
          description: 'Sube un archivo (PDF, imagen, Word, Excel) - máx 50MB',
          parameters: [
            {
              name: 'providerId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['file', 'document_catalog_id'],
                  properties: {
                    file: { type: 'string', format: 'binary' },
                    document_catalog_id: { type: 'string', format: 'uuid' },
                    issue_date: { type: 'string', format: 'date' },
                    expiry_date: { type: 'string', format: 'date' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Documento subido',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { data: { $ref: '#/components/schemas/ProviderDocument' } },
                  },
                },
              },
            },
            400: {
              description: 'Archivo inválido',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            429: { $ref: '#/components/responses/RateLimit' },
          },
        },
      },
      '/api/providers/{providerId}/documents/compliance': {
        get: {
          tags: ['Documents'],
          summary: 'Resumen de cumplimiento documental',
          parameters: [
            {
              name: 'providerId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          responses: {
            200: {
              description: 'Resumen de cumplimiento',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { data: { $ref: '#/components/schemas/ComplianceSummary' } },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      '/api/providers/{providerId}/reports/compliance.pdf': {
        get: {
          tags: ['Reports'],
          summary: 'Generar reporte PDF de cumplimiento',
          description: 'Genera y descarga un PDF profesional con métricas, hallazgos y cumplimiento documental',
          parameters: [
            {
              name: 'providerId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          responses: {
            200: {
              description: 'PDF binario',
              content: {
                'application/pdf': {
                  schema: { type: 'string', format: 'binary' },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { $ref: '#/components/responses/NotFound' },
            429: { $ref: '#/components/responses/RateLimit' },
          },
        },
      },
      '/api/providers/{providerId}/reports/compliance.xlsx': {
        get: {
          tags: ['Reports'],
          summary: 'Generar reporte Excel de cumplimiento',
          description: 'Genera y descarga un workbook Excel con 3 hojas: Resumen, Hallazgos, Metadatos',
          parameters: [
            {
              name: 'providerId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          responses: {
            200: {
              description: 'Excel binario',
              content: {
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
                  schema: { type: 'string', format: 'binary' },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { $ref: '#/components/responses/NotFound' },
            429: { $ref: '#/components/responses/RateLimit' },
          },
        },
      },
      '/api/providers/{providerId}/reports/summary': {
        get: {
          tags: ['Reports'],
          summary: 'Resumen JSON de cumplimiento',
          parameters: [
            {
              name: 'providerId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          responses: {
            200: {
              description: 'Datos del reporte en JSON',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { data: { type: 'object' } },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      '/api/documents/expiring': {
        get: {
          tags: ['Documents'],
          summary: 'Documentos próximos a vencer',
          parameters: [
            {
              name: 'days',
              in: 'query',
              schema: { type: 'integer', default: 30, minimum: 0, maximum: 365 },
              description: 'Días de anticipación (0-365)',
            },
          ],
          responses: {
            200: {
              description: 'Lista de documentos expirando',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/ProviderDocument' },
                      },
                      total: { type: 'integer' },
                    },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
          },
        },
      },
    },
  },
  apis: [], // paths defined inline above
});

export const swaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { background-color: #0052cc; }
    .swagger-ui .topbar .download-url-wrapper { display: none; }
    .swagger-ui .info .title { color: #0052cc; }
  `,
  customSiteTitle: 'Norma 3100 API - Documentación',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'list',
    filter: true,
    tryItOutEnabled: true,
  },
};
