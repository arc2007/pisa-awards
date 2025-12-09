// backend/routes/usuarios.ts
import express, { Request, Response } from "express";
import { db } from "../db";
import type { RolUsuario, Usuario } from "../types/usuario";

const router = express.Router();

/**
 * GET /usuarios
 * Devuelve usuarios sin contraseña (para admin / debug).
 */
router.get("/", (_req: Request, res: Response) => {
  db.all(
    "SELECT id, username, display_name, rol FROM usuarios",
    [],
    (err: any, filas: Usuario[]) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(filas);
    }
  );
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
router.post("/", (req: Request, res: Response) => {
  const { username, display_name, rol, password } = req.body as {
    username?: string;
    display_name?: string;
    rol?: RolUsuario;
    password?: string;
  };

  if (!username || !display_name || !password) {
    return res.status(400).json({
      error: "username, display_name y password son obligatorios",
    });
  }

  const rolFinal: RolUsuario = (rol as RolUsuario) || "interno";

  db.run(
    `INSERT INTO usuarios (username, display_name, rol, password) VALUES (?, ?, ?, ?)`,
    [username, display_name, rolFinal, password],
    function (err: any) {
      if (err) return res.status(500).json({ error: err.message });

      const nuevo: Usuario = {
        id: this.lastID,
        username,
        display_name,
        rol: rolFinal,
        // NO devolvemos password
      };

      res.status(201).json(nuevo);
    }
  );
});

/**
 * GET /usuarios/:id
 * Devuelve un usuario sin contraseña.
 */
router.get("/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);

  db.get(
    "SELECT id, username, display_name, rol FROM usuarios WHERE id = ?",
    [id],
    (err: any, fila: Usuario | undefined) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!fila) return res.status(404).json({ error: "Usuario no encontrado" });
      res.json(fila);
    }
  );
});

export default router;
