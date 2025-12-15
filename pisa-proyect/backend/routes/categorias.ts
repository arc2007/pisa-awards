import express, { type Request, type Response } from "express";
import { db } from "../db";

const router = express.Router();

const dbError = (res: Response, err: any) =>
  res.status(500).json({ error: err?.message ?? String(err) });

const asBool = (v: any) => !!v;

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
 * Devuelve rol de un usuario (o null si no existe)
 */
function getRolUsuario(
  usuarioId: number,
  cb: (err: any, rol: string | null) => void
) {
  if (!usuarioId) return cb(null, null);

  const sql = `SELECT rol FROM usuarios WHERE id = ? LIMIT 1`;
  db.get(sql, [usuarioId], (err: any, row: any) => {
    if (err) return cb(err, null);
    return cb(null, row?.rol ?? null);
  });
}

/**
 * GET /categorias
 * Devuelve categorías con sus nominaciones (y usuarios ligados).
 * (Sin resultados de votos)
 */
router.get("/", (_req: Request, res: Response) => {
  const sqlCategorias = `
    SELECT id, nombre, descripcion, es_videos
    FROM categorias
    ORDER BY id
  `;

  db.all(sqlCategorias, [], (err: any, categorias: any[]) => {
    if (err) return dbError(res, err);
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

    db.all(sqlNominados, [], (err2: any, rows: any[]) => {
      if (err2) return dbError(res, err2);

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
          es_videos: asBool(c.es_videos),
          nominados,
        };
      });

      return res.json(resultado);
    });
  });
});

/**
 * GET /categorias/estado/:votanteId
 *
 * Usuario normal:
 * - nominados
 * - haVotado
 * - miVotoNominacionId
 *
 * Admin:
 * - además resultados (conteo por nominación) en "resultados"
 *
 * Como no hay JWT, se usa ?requesterId=<idUsuarioLogueado>
 * Si no viene requesterId, se asume el propio votanteId.
 */
router.get("/estado/:votanteId", (req: Request, res: Response) => {
  const votanteId = Number(req.params.votanteId);
  const requesterId = Number((req.query.requesterId as string) ?? votanteId);

  if (!votanteId) return res.status(400).json({ error: "votanteId inválido" });

  getRolUsuario(requesterId, (errRol, rol) => {
    if (errRol) return dbError(res, errRol);

    const isAdmin = rol === "admin";

    const sqlCategorias = `
      SELECT id, nombre, descripcion, es_videos
      FROM categorias
      ORDER BY id
    `;

    db.all(sqlCategorias, [], (err: any, categorias: any[]) => {
      if (err) return dbError(res, err);
      if (!categorias || categorias.length === 0) return res.json([]);

      const resultado: any[] = [];
      let pendientes = categorias.length;

      categorias.forEach((cat: any) => {
        // 1) Nominaciones + usuarios ligados (siempre)
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

        db.all(sqlNominados, [cat.id], (errNom: any, rowsNom: any[]) => {
          if (errNom) return dbError(res, errNom);

          const nominados = agruparNominaciones(rowsNom as any[]);

          // 2) Mi voto (si existe)
          const sqlMiVoto = `
            SELECT nominacion_id
            FROM votos
            WHERE votante_id = ? AND categoria_id = ?
            LIMIT 1
          `;

          db.get(sqlMiVoto, [votanteId, cat.id], (errV: any, votoRow: any) => {
            if (errV) return dbError(res, errV);

            const haVotado = !!votoRow;
            const miVotoNominacionId = votoRow?.nominacion_id ?? null;

            // Usuario normal => NO resultados
            if (!isAdmin) {
              resultado.push({
                ...cat,
                es_videos: asBool(cat.es_videos),
                haVotado,
                miVotoNominacionId,
                nominados,
              });

              pendientes--;
              if (pendientes === 0) {
                return res.json(resultado.sort((a, b) => a.id - b.id));
              }
              return;
            }

            // Admin => resultados (conteo por nominación)
            const sqlResultados = `
              SELECT
                n.id,
                n.descripcion,
                COUNT(v.id) AS votos
              FROM nominaciones n
              LEFT JOIN votos v ON v.nominacion_id = n.id
              WHERE n.categoria_id = ?
              GROUP BY n.id
              ORDER BY votos DESC, n.id ASC
            `;

            db.all(sqlResultados, [cat.id], (errR: any, rowsR: any[]) => {
              if (errR) return dbError(res, errR);

              resultado.push({
                ...cat,
                es_videos: asBool(cat.es_videos),
                haVotado,
                miVotoNominacionId,
                nominados,
                resultados: rowsR ?? [],
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
});

/**
 * GET /categorias/:categoriaId/top
 * Solo admin. Requiere ?requesterId=<idAdmin>
 * (Si ya usas "resultados" en /estado, este endpoint es opcional.)
 */
router.get("/:categoriaId/top", (req: Request, res: Response) => {
  const categoriaId = Number(req.params.categoriaId);
  const requesterId = Number(req.query.requesterId as string);

  if (!categoriaId) return res.status(400).json({ error: "categoriaId inválido" });
  if (!requesterId) return res.status(400).json({ error: "requesterId es obligatorio" });

  getRolUsuario(requesterId, (errRol, rol) => {
    if (errRol) return dbError(res, errRol);
    if (rol !== "admin") return res.status(403).json({ error: "No autorizado" });

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

    db.all(sql, [categoriaId], (err: any, rows: any[]) => {
      if (err) return dbError(res, err);
      return res.json(rows ?? []);
    });
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

  const sql = `
    INSERT INTO categorias (nombre, descripcion, es_videos)
    VALUES (?, ?, ?)
  `;

  db.run(
    sql,
    [nombre, descripcion ?? null, es_videos ? 1 : 0],
    function (err: any) {
      if (err) return dbError(res, err);

      return res.status(201).json({
        id: this.lastID,
        nombre,
        descripcion: descripcion ?? null,
        es_videos: asBool(es_videos),
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

  const sqlInsert = `
    INSERT INTO nominaciones (categoria_id, descripcion, video_url)
    VALUES (?, ?, ?)
  `;

  db.run(sqlInsert, [categoriaId, descripcion, video_url ?? null], function (err: any) {
    if (err) return dbError(res, err);

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
      stmt.run([nominacionId, uid], (err2: any) => {
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
  });
});

export default router;
