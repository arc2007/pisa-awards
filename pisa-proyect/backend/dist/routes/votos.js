"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const router = express_1.default.Router();
const dbError = (res, err) => res.status(500).json({ error: err?.message ?? String(err) });
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
router.post("/", (req, res) => {
    const { votante_id, categoria_id, nominacion_id } = req.body;
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
    db_1.db.get(sqlExiste, [votante_id, categoria_id], (err, row) => {
        if (err)
            return dbError(res, err);
        // 2) Si existe -> UPDATE
        if (row?.id) {
            const sqlUpdate = `
        UPDATE votos
        SET nominacion_id = ?
        WHERE id = ?
      `;
            db_1.db.run(sqlUpdate, [nominacion_id, row.id], function (err2) {
                if (err2)
                    return dbError(res, err2);
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
        db_1.db.run(sqlInsert, [votante_id, categoria_id, nominacion_id], function (err3) {
            if (err3)
                return dbError(res, err3);
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
router.get("/mios/:votanteId", (req, res) => {
    const votanteId = Number(req.params.votanteId);
    if (!votanteId)
        return res.status(400).json({ error: "votanteId inválido" });
    const sql = `
    SELECT id, votante_id, categoria_id, nominacion_id
    FROM votos
    WHERE votante_id = ?
    ORDER BY categoria_id
  `;
    db_1.db.all(sql, [votanteId], (err, rows) => {
        if (err)
            return dbError(res, err);
        return res.json(rows ?? []);
    });
});
exports.default = router;
