// backend/routes/auth.ts
import express, { Request, Response } from "express";
import { db } from "../db";
import type { Usuario } from "../types/usuario";

const router = express.Router();

/**
 * POST /login
 * Body:
 * {
 *   "username": "rey",
 *   "password": "rey123"
 * }
 */
router.post("/login", (req: Request, res: Response) => {
  const { username, password } = req.body as {
    username?: string;
    password?: string;
  };

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

  db.get(sql, [username], (err: any, row: any | undefined) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!row) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }

    // Comprobamos contraseña en texto plano (para este proyecto vale)
    if (row.password !== password) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }

    const usuario: Usuario = {
      id: row.id,
      username: row.username,
      display_name: row.display_name,
      rol: row.rol,
      // password NO la devolvemos
    };

    // Aquí podrías generar un token JWT, pero de momento devolvemos solo el usuario
    return res.json({
      usuario,
    });
  });
});

export default router;
