// backend/routes/votos.ts
import express, { Request, Response } from "express";
import { db } from "../db";
import type { Voto } from "../types/voto";

const router = express.Router();

/**
 * POST /votos
 * Body:
 * {
 *   "votante_id": 1,
 *   "categoria_id": 2,
 *   "nominacion_id": 3
 * }
 */
router.post("/", (req: Request, res: Response) => {
  const { votante_id, categoria_id, nominacion_id } = req.body as {
    votante_id?: number;
    categoria_id?: number;
    nominacion_id?: number;
  };

  if (!votante_id || !categoria_id || !nominacion_id) {
    return res.status(400).json({ error: "Faltan datos en el body" });
  }

  const sqlCheck = `
    SELECT * FROM votos
    WHERE votante_id = ? AND categoria_id = ?
  `;

  db.get(
    sqlCheck,
    [votante_id, categoria_id],
    (err: any, row: any | undefined) => {
      if (err) return res.status(500).json({ error: err.message });

      if (row) {
        return res
          .status(400)
          .json({ error: "Este usuario ya ha votado en esta categoría" });
      }

      const sqlInsert = `
        INSERT INTO votos (votante_id, categoria_id, nominacion_id)
        VALUES (?, ?, ?)
      `;

      db.run(
        sqlInsert,
        [votante_id, categoria_id, nominacion_id],
        function (err2: any) {
          if (err2) return res.status(500).json({ error: err2.message });

          const nuevo: Voto = {
            id: this.lastID,
            votante_id,
            categoria_id,
            nominacion_id,
          };

          res.status(201).json(nuevo);
        }
      );
    }
  );
});

export default router;
