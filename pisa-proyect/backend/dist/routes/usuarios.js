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
 * GET /usuarios
 * Devuelve usuarios sin contraseña (para admin / debug).
 */
router.get("/", (_req, res) => {
    const sql = "SELECT id, username, display_name, rol FROM usuarios";
    db_1.db.all(sql, [], (err, filas) => {
        if (err)
            return dbError(res, err);
        return res.json(filas);
    });
});
/**
 * POST /usuarios
 * Body:
 * {
 *   "username": "pepe",
 *   "display_name": "Pepe",
 *   "rol": "admin" | "interno" | "externo" (opcional, por defecto 'interno'),
 *   "password": "manzana324"
 * }
 */
router.post("/", (req, res) => {
    const { username, display_name, rol, password } = req.body;
    if (!username || !display_name || !password) {
        return res
            .status(400)
            .json({ error: "username, display_name y password son obligatorios" });
    }
    const rolFinal = rol || "interno";
    const sql = "INSERT INTO usuarios (username, display_name, rol, password) VALUES (?, ?, ?, ?)";
    db_1.db.run(sql, [username, display_name, rolFinal, password], function (err) {
        if (err)
            return dbError(res, err);
        const nuevo = {
            id: this.lastID,
            username,
            display_name,
            rol: rolFinal,
            // NO devolvemos password
        };
        return res.status(201).json(nuevo);
    });
});
/**
 * GET /usuarios/:id
 * Devuelve un usuario sin contraseña.
 */
router.get("/:id", (req, res) => {
    const id = Number(req.params.id);
    const sql = "SELECT id, username, display_name, rol FROM usuarios WHERE id = ?";
    db_1.db.get(sql, [id], (err, fila) => {
        if (err)
            return dbError(res, err);
        if (!fila)
            return res.status(404).json({ error: "Usuario no encontrado" });
        return res.json(fila);
    });
});
exports.default = router;
