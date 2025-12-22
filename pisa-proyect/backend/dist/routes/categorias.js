"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const router = express_1.default.Router();
const dbError = (res, err) => res.status(500).json({ error: err?.message ?? String(err) });
const asBool = (v) => !!v;
/**
 * Helper: agrupa filas (nominación + usuario) en:
 * [{ id, descripcion, video_url, usuarios: [...] }, ...]
 */
function agruparNominaciones(rows) {
    const map = {};
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
function getRolUsuario(usuarioId, cb) {
    if (!usuarioId)
        return cb(null, null);
    const sql = `SELECT rol FROM usuarios WHERE id = ? LIMIT 1`;
    db_1.db.get(sql, [usuarioId], (err, row) => {
        if (err)
            return cb(err, null);
        return cb(null, row?.rol ?? null);
    });
}
/**
 * GET /categorias
 * Devuelve categorías con sus nominaciones (y usuarios ligados).
 * (Sin resultados de votos)
 */
router.get("/", (_req, res) => {
    const sqlCategorias = `
    SELECT id, nombre, descripcion, es_videos
    FROM categorias
    ORDER BY id
  `;
    db_1.db.all(sqlCategorias, [], (err, categorias) => {
        if (err)
            return dbError(res, err);
        if (!categorias || categorias.length === 0)
            return res.json([]);
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
        db_1.db.all(sqlNominados, [], (err2, rows) => {
            if (err2)
                return dbError(res, err2);
            // Agrupar por categoría
            const porCategoria = {};
            for (const r of rows) {
                if (!r.categoria_id || !r.nominacion_id)
                    continue;
                if (!porCategoria[r.categoria_id])
                    porCategoria[r.categoria_id] = [];
                porCategoria[r.categoria_id].push(r);
            }
            const resultado = categorias.map((c) => {
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
router.get("/estado/:votanteId", (req, res) => {
    const votanteId = Number(req.params.votanteId);
    const requesterId = Number(req.query.requesterId ?? votanteId);
    if (!votanteId)
        return res.status(400).json({ error: "votanteId inválido" });
    getRolUsuario(requesterId, (errRol, rol) => {
        if (errRol)
            return dbError(res, errRol);
        const isAdmin = rol === "admin";
        const sqlCategorias = `
      SELECT id, nombre, descripcion, es_videos
      FROM categorias
      ORDER BY id
    `;
        db_1.db.all(sqlCategorias, [], (err, categorias) => {
            if (err)
                return dbError(res, err);
            if (!categorias || categorias.length === 0)
                return res.json([]);
            const resultado = [];
            let pendientes = categorias.length;
            categorias.forEach((cat) => {
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
                db_1.db.all(sqlNominados, [cat.id], (errNom, rowsNom) => {
                    if (errNom)
                        return dbError(res, errNom);
                    const nominados = agruparNominaciones(rowsNom);
                    // 2) Mi voto (si existe)
                    const sqlMiVoto = `
            SELECT nominacion_id
            FROM votos
            WHERE votante_id = ? AND categoria_id = ?
            LIMIT 1
          `;
                    db_1.db.get(sqlMiVoto, [votanteId, cat.id], (errV, votoRow) => {
                        if (errV)
                            return dbError(res, errV);
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
                        db_1.db.all(sqlResultados, [cat.id], (errR, rowsR) => {
                            if (errR)
                                return dbError(res, errR);
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
router.get("/:categoriaId/top", (req, res) => {
    const categoriaId = Number(req.params.categoriaId);
    const requesterId = Number(req.query.requesterId);
    if (!categoriaId)
        return res.status(400).json({ error: "categoriaId inválido" });
    if (!requesterId)
        return res.status(400).json({ error: "requesterId es obligatorio" });
    getRolUsuario(requesterId, (errRol, rol) => {
        if (errRol)
            return dbError(res, errRol);
        if (rol !== "admin")
            return res.status(403).json({ error: "No autorizado" });
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
        db_1.db.all(sql, [categoriaId], (err, rows) => {
            if (err)
                return dbError(res, err);
            return res.json(rows ?? []);
        });
    });
});
/**
 * POST /categorias
 * Body: { nombre: string, descripcion?: string, es_videos?: boolean }
 */
router.post("/", (req, res) => {
    const { nombre, descripcion, es_videos } = req.body;
    if (!nombre) {
        return res.status(400).json({ error: "nombre es obligatorio" });
    }
    const sql = `
    INSERT INTO categorias (nombre, descripcion, es_videos)
    VALUES (?, ?, ?)
  `;
    db_1.db.run(sql, [nombre, descripcion ?? null, es_videos ? 1 : 0], function (err) {
        if (err)
            return dbError(res, err);
        return res.status(201).json({
            id: this.lastID,
            nombre,
            descripcion: descripcion ?? null,
            es_videos: asBool(es_videos),
        });
    });
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
router.post("/:categoriaId/nominaciones", (req, res) => {
    const categoriaId = Number(req.params.categoriaId);
    const { descripcion, video_url, usuario_ids } = req.body;
    if (!descripcion) {
        return res.status(400).json({ error: "descripcion es obligatoria" });
    }
    const sqlInsert = `
    INSERT INTO nominaciones (categoria_id, descripcion, video_url)
    VALUES (?, ?, ?)
  `;
    db_1.db.run(sqlInsert, [categoriaId, descripcion, video_url ?? null], function (err) {
        if (err)
            return dbError(res, err);
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
        const stmt = db_1.db.prepare(`
      INSERT OR IGNORE INTO nominacion_usuarios (nominacion_id, usuario_id)
      VALUES (?, ?)
    `);
        let pendientes = ids.length;
        ids.forEach((uid) => {
            stmt.run([nominacionId, uid], (err2) => {
                if (err2)
                    console.error("Error ligando usuario a nominación", err2.message);
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
exports.default = router;
