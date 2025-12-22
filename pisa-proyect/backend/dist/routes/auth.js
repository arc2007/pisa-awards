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
 * POST /login
 * Body:
 * {
 *   "username": "rey",
 *   "password": "rey123"
 * }
 */
router.post("/login", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res
            .status(400)
            .json({ error: "username y password son obligatorios" });
    }
    const sql = `
    SELECT id, username, display_name, rol, password
    FROM usuarios
    WHERE username = ?
  `;
    db_1.db.get(sql, [username], (err, row) => {
        if (err)
            return dbError(res, err);
        if (!row) {
            return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
        }
        // Comprobamos contraseña en texto plano (para este proyecto vale)
        if (row.password !== password) {
            return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
        }
        const usuario = {
            id: row.id,
            username: row.username,
            display_name: row.display_name,
            rol: row.rol,
        };
        return res.json({ usuario });
    });
});
exports.default = router;
