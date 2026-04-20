import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

export function createLocationsRouter(pool: Pool): Router {
  const router = Router();

  router.get('/departments', async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await pool.query('SELECT id, name FROM departments ORDER BY name');
      res.json(result.rows);
    } catch (err) {
      console.error('Departments error:', err);
      res.status(500).json({ error: 'Failed to fetch departments', details: (err as Error).message });
    }
  });

  router.get('/municipalities', async (req: Request, res: Response): Promise<void> => {
    try {
      const { department } = req.query;
      if (!department) {
        res.status(400).json({ error: 'Department name required' });
        return;
      }
      const result = await pool.query(
        `SELECT m.id, m.name FROM municipalities m
         JOIN departments d ON m.department_id = d.id
         WHERE d.name = $1 ORDER BY m.name`,
        [department]
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch municipalities' });
    }
  });

  return router;
}
