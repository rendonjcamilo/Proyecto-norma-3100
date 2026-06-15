import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { RethusService, TipoDocumento } from '../services/RethusService.js';

const TIPOS_VALIDOS: TipoDocumento[] = ['CC', 'CE', 'PA', 'SC', 'TI', 'RC', 'MS'];

export function createRethusRouter(): Router {
  const router = Router();
  const rethusService = new RethusService();

  /**
   * GET /api/rethus/consultar?tipoDoc=CC&numDoc=12345678
   * Consulta inscripción de un profesional en el RETHUS
   */
  router.get('/rethus/consultar', authMiddleware, async (req: Request, res: Response) => {
    const { tipoDoc = 'CC', numDoc } = req.query;

    if (!numDoc || typeof numDoc !== 'string' || !/^[A-Z0-9]{4,15}$/i.test(numDoc)) {
      return res.status(400).json({ error: 'Número de documento inválido (4-15 caracteres alfanuméricos)' });
    }

    const tipo = (typeof tipoDoc === 'string' ? tipoDoc.toUpperCase() : 'CC') as TipoDocumento;
    if (!TIPOS_VALIDOS.includes(tipo)) {
      return res.status(400).json({ error: `Tipo de documento inválido. Valores: ${TIPOS_VALIDOS.join(', ')}` });
    }

    const result = await rethusService.consultar(tipo, numDoc.trim());
    return res.json(result);
  });

  return router;
}
