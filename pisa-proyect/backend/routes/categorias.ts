// backend/routes/categorias.ts
import express, { Request, Response } from "express";
import { db } from "../db";

const router = express.Router();

/**
 * Helper: agrupa filas (nominación + usuario) en:
 * [{ id, descripcion, video_url, usuarios: [...] }, ...]
 */
function agruparNominaciones(rows: any[]) {
  const map: Record<number, any> = {};

  for (const r of rows) {
    if (!map[r.nominacion_id]) {
      map[r.nominacion_id] = {
        id: r.nominacion_id,
        descripcion: r.descripcion,
        video_url: r.video_url,
        usuarios: [],
      };
    }

    if (r.usuario_id) {
      map[r.nominacion_id].usuarios.push({
        id: r.usuario_id,
        username: r.username,
        display_name: r.display_name,
        rol: r.rol,
      });
    }
  }

  return Object.values(map);
}

/**
 * GET /categorias
 * Devuelve categorías con sus nominaciones (y usuarios ligados).
 */
router.get("/", (_req: Request, res: Response) => {
  const sqlCategorias = `
    SELECT id, nombre, descripcion, es_videos
    FROM categorias
    ORDER BY id
  `;

  db.all(sqlCategorias, [], (err, categorias) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!categorias || categorias.length === 0) return res.json([]);

    const sqlNominados = `
      SELECT
        c.id             AS categoria_id,
        n.id             AS nominacion_id,
        n.descripcion    AS descripcion,
        n.video_url      AS video_url,
        u.id             AS usuario_id,
        u.username       AS username,
        u.display_name   AS display_name,
        u.rol            AS rol
      FROM categorias c
      LEFT JOIN nominaciones n         ON n.categoria_id = c.id
      LEFT JOIN nominacion_usuarios nu ON nu.nominacion_id = n.id
      LEFT JOIN usuarios u             ON u.id = nu.usuario_id
      ORDER BY c.id, n.id, u.display_name
    `;

    db.all(sqlNominados, [], (err2, rows) => {
      if (err2) return res.status(500).json({ error: err2.message });

      // Agrupar por categoría
      const porCategoria: Record<number, any[]> = {};
      for (const r of rows as any[]) {
        if (!r.categoria_id || !r.nominacion_id) continue;
        if (!porCategoria[r.categoria_id]) porCategoria[r.categoria_id] = [];
        porCategoria[r.categoria_id].push(r);
      }

      const resultado = (categorias as any[]).map((c) => {
        const nominados = agruparNominaciones(porCategoria[c.id] || []);
        return {
          ...c,
          es_videos: !!c.es_videos,
          nominados,
        };
      });

      res.json(resultado);
    });
  });
});

/**
 * GET /categorias/estado/:votanteId
 * Devuelve para cada categoría:
 * - nominados SIEMPRE (para poder votar si no ha votado)
 * - haVotado
 * - topNominados (solo si ha votado)
 */
router.get("/estado/:votanteId", (req: Request, res: Response) => {
  const votanteId = Number(req.params.votanteId);

  const sqlCategorias = `
    SELECT id, nombre, descripcion, es_videos
    FROM categorias
    ORDER BY id
  `;

  db.all(sqlCategorias, [], (err, categorias) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!categorias || categorias.length === 0) return res.json([]);

    const resultado: any[] = [];
    let pendientes = categorias.length;

    categorias.forEach((cat: any) => {
      // 1) Nominaciones + usuarios ligados
      const sqlNominados = `
        SELECT
          n.id             AS nominacion_id,
          n.descripcion    AS descripcion,
          n.video_url      AS video_url,
          u.id             AS usuario_id,
          u.username       AS username,
          u.display_name   AS display_name,
          u.rol            AS rol
        FROM nominaciones n
        LEFT JOIN nominacion_usuarios nu ON nu.nominacion_id = n.id
        LEFT JOIN usuarios u             ON u.id = nu.usuario_id
        WHERE n.categoria_id = ?
        ORDER BY n.id, u.display_name
      `;

      db.all(sqlNominados, [cat.id], (errNom, rowsNom) => {
        if (errNom) return res.status(500).json({ error: errNom.message });

        const nominados = agruparNominaciones(rowsNom as any[]);

        // 2) Ha votado?
        const sqlHaVotado = `
          SELECT 1 FROM votos
          WHERE votante_id = ? AND categoria_id = ?
          LIMIT 1
        `;

        db.get(sqlHaVotado, [votanteId, cat.id], (errV, voto) => {
          if (errV) return res.status(500).json({ error: errV.message });

          const haVotado = !!voto;

          if (!haVotado) {
            resultado.push({
              ...cat,
              es_videos: !!cat.es_videos,
              haVotado: false,
              nominados,
              topNominados: [],
            });

            pendientes--;
            if (pendientes === 0) {
              return res.json(resultado.sort((a, b) => a.id - b.id));
            }
            return;
          }

          // 3) Top 2 si ha votado
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

          db.all(sqlTop, [cat.id], (errTop, top) => {
            if (errTop) return res.status(500).json({ error: errTop.message });

            resultado.push({
              ...cat,
              es_videos: !!cat.es_videos,
              haVotado: true,
              nominados,
              topNominados: top,
            });

            pendientes--;
            if (pendientes === 0) {
              return res.json(resultado.sort((a, b) => a.id - b.id));
            }
          });
        });
      });
    });
  });
});

/**
 * GET /categorias/:categoriaId/top
 * Devuelve top 2 nominaciones de una categoría.
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

/**
 * POST /categorias
 * Body: { nombre: string, descripcion?: string, es_videos?: boolean }
 */
router.post("/", (req: Request, res: Response) => {
  const { nombre, descripcion, es_videos } = req.body as {
    nombre?: string;
    descripcion?: string | null;
    es_videos?: boolean;
  };

  if (!nombre) {
    return res.status(400).json({ error: "nombre es obligatorio" });
  }

  db.run(
    `
      INSERT INTO categorias (nombre, descripcion, es_videos)
      VALUES (?, ?, ?)
    `,
    [nombre, descripcion ?? null, es_videos ? 1 : 0],
    function (err: any) {
      if (err) return res.status(500).json({ error: err.message });

      res.status(201).json({
        id: this.lastID,
        nombre,
        descripcion: descripcion ?? null,
        es_videos: !!es_videos,
      });
    }
  );
});

/**
 * POST /categorias/:categoriaId/nominaciones
 * Crea una nominación en esa categoría y la liga a 0..N usuarios.
 *
 * Body:
 * {
 *   "descripcion": "Juaco y Botas en Sitges",
 *   "video_url": null,
 *   "usuario_ids": [9, 4]
 * }
 *
 * usuario_ids es opcional (puede ir vacío o no ir).
 */
router.post("/:categoriaId/nominaciones", (req: Request, res: Response) => {
  const categoriaId = Number(req.params.categoriaId);

  const { descripcion, video_url, usuario_ids } = req.body as {
    descripcion?: string;
    video_url?: string | null;
    usuario_ids?: number[];
  };

  if (!descripcion) {
    return res.status(400).json({ error: "descripcion es obligatoria" });
  }

  db.run(
    `
      INSERT INTO nominaciones (categoria_id, descripcion, video_url)
      VALUES (?, ?, ?)
    `,
    [categoriaId, descripcion, video_url ?? null],
    function (err: any) {
      if (err) return res.status(500).json({ error: err.message });

      const nominacionId = this.lastID;

      const ids = Array.isArray(usuario_ids) ? usuario_ids : [];
      if (ids.length === 0) {
        return res.status(201).json({
          id: nominacionId,
          categoria_id: categoriaId,
          descripcion,
          video_url: video_url ?? null,
          usuarios: [],
        });
      }

      const stmt = db.prepare(`
        INSERT OR IGNORE INTO nominacion_usuarios (nominacion_id, usuario_id)
        VALUES (?, ?)
      `);

      let pendientes = ids.length;

      ids.forEach((uid) => {
        stmt.run([nominacionId, uid], (err2) => {
          if (err2) console.error("Error ligando usuario a nominación", err2.message);
          pendientes--;
          if (pendientes === 0) {
            stmt.finalize(() => {
              return res.status(201).json({
                id: nominacionId,
                categoria_id: categoriaId,
                descripcion,
                video_url: video_url ?? null,
                usuario_ids: ids,
              });
            });
          }
        });
      });
    }
  );
});

export default router;
