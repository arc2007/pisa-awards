import express, { type Request, type Response } from "express";
import { db } from "../db";

const router = express.Router();

const dbError = (res: Response, err: any) =>
  res.status(500).json({ error: err?.message ?? String(err) });

/**
 * POST /votos
 * Body:
 * {
 *   "votante_id": number,
 *   "categoria_id": number,
 *   "nominacion_id": number
 * }
 *
 * Inserta o ACTUALIZA un voto (UPsert por votante_id + categoria_id).
 * Esto permite "editar" el voto sin exponer conteos.
 */
router.post("/", (req: Request, res: Response) => {
  const { votante_id, categoria_id, nominacion_id } = req.body as {
    votante_id?: number;
    categoria_id?: number;
    nominacion_id?: number;
  };

  if (!votante_id || !categoria_id || !nominacion_id) {
    return res.status(400).json({
      error: "votante_id, categoria_id y nominacion_id son obligatorios",
    });
  }

  // 1) ¿Ya existe voto del usuario en esa categoría?
  const sqlExiste = `
    SELECT id
    FROM votos
    WHERE votante_id = ? AND categoria_id = ?
    LIMIT 1
  `;

  db.get(sqlExiste, [votante_id, categoria_id], (err: any, row: any) => {
    if (err) return dbError(res, err);

    // 2) Si existe -> UPDATE
    if (row?.id) {
      const sqlUpdate = `
        UPDATE votos
        SET nominacion_id = ?
        WHERE id = ?
      `;

      db.run(sqlUpdate, [nominacion_id, row.id], function (err2: any) {
        if (err2) return dbError(res, err2);

        return res.status(200).json({
          id: row.id,
          votante_id,
          categoria_id,
          nominacion_id,
          updated: true,
        });
      });

      return;
    }

    // 3) Si no existe -> INSERT
    const sqlInsert = `
      INSERT INTO votos (votante_id, categoria_id, nominacion_id)
      VALUES (?, ?, ?)
    `;

    db.run(sqlInsert, [votante_id, categoria_id, nominacion_id], function (err3: any) {
      if (err3) return dbError(res, err3);

      return res.status(201).json({
        id: this.lastID,
        votante_id,
        categoria_id,
        nominacion_id,
        updated: false,
      });
    });
  });
});

/**
 * GET /votos/mios/:votanteId
 * Devuelve SOLO los votos del usuario (sin conteos).
 * Útil si el front quiere refrescar rápidamente.
 */
router.get("/mios/:votanteId", (req: Request, res: Response) => {
  const votanteId = Number(req.params.votanteId);
  if (!votanteId) return res.status(400).json({ error: "votanteId inválido" });

  const sql = `
    SELECT id, votante_id, categoria_id, nominacion_id
    FROM votos
    WHERE votante_id = ?
    ORDER BY categoria_id
  `;

  db.all(sql, [votanteId], (err: any, rows: any[]) => {
    if (err) return dbError(res, err);
    return res.json(rows ?? []);
  });
});

export default router;
