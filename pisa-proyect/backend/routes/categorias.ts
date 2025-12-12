import express, { Request, Response } from "express";
import { db } from "../db";

const router = express.Router();

/**
 * GET /categorias/estado/:votanteId
 * Devuelve:
 * - si ha votado
 * - top nominados SOLO si ha votado
 */
router.get("/estado/:votanteId", (req: Request, res: Response) => {
  const votanteId = Number(req.params.votanteId);

  const sqlCategorias = `
    SELECT id, nombre, descripcion
    FROM categorias
  `;

  db.all(sqlCategorias, [], (err, categorias) => {
    if (err) return res.status(500).json({ error: err.message });

    const resultado: any[] = [];

    let pendientes = categorias.length;

    categorias.forEach((cat: any) => {
      const sqlHaVotado = `
        SELECT 1 FROM votos
        WHERE votante_id = ? AND categoria_id = ?
        LIMIT 1
      `;

      db.get(sqlHaVotado, [votanteId, cat.id], (err, voto) => {
        if (err) return res.status(500).json({ error: err.message });

        const haVotado = !!voto;

        if (!haVotado) {
          resultado.push({
            ...cat,
            haVotado: false,
            topNominados: [],
          });
          if (--pendientes === 0) res.json(resultado);
          return;
        }

        const sqlTop = `
          SELECT 
            n.id,
            n.descripcion,
            COUNT(v.id) as votos
          FROM votos v
          JOIN nominaciones n ON n.id = v.nominacion_id
          WHERE v.categoria_id = ?
          GROUP BY n.id
          ORDER BY votos DESC
          LIMIT 2
        `;

        db.all(sqlTop, [cat.id], (err, top) => {
          if (err) return res.status(500).json({ error: err.message });

          resultado.push({
            ...cat,
            haVotado: true,
            topNominados: top,
          });

          if (--pendientes === 0) res.json(resultado);
        });
      });
    });
  });
});

/**
 * NUEVO
 * GET /categorias/:categoriaId/top
 * Devuelve top 2 nominaciones (seguridad extra)
 */
router.get("/:categoriaId/top", (req: Request, res: Response) => {
  const categoriaId = Number(req.params.categoriaId);

  const sql = `
    SELECT 
      n.id,
      n.descripcion,
      COUNT(v.id) as votos
    FROM votos v
    JOIN nominaciones n ON n.id = v.nominacion_id
    WHERE v.categoria_id = ?
    GROUP BY n.id
    ORDER BY votos DESC
    LIMIT 2
  `;

  db.all(sql, [categoriaId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

export default router;
