import express, { Request, Response } from "express";
import { db } from "../db";

const router = express.Router();

/**
 * POST /votos
 */
router.post("/", (req: Request, res: Response) => {
  const { votante_id, categoria_id, nominacion_id } = req.body;

  if (!votante_id || !categoria_id || !nominacion_id) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  const sqlCheck = `
    SELECT 1 FROM votos
    WHERE votante_id = ? AND categoria_id = ?
  `;

  db.get(sqlCheck, [votante_id, categoria_id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) {
      return res.status(400).json({ error: "Ya has votado esta categoría" });
    }

    const sqlInsert = `
      INSERT INTO votos (votante_id, categoria_id, nominacion_id)
      VALUES (?, ?, ?)
    `;

    db.run(sqlInsert, [votante_id, categoria_id, nominacion_id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true, id: this.lastID });
    });
  });
});

export default router;
