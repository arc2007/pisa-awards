// backend/server.ts
import express from "express";
import cors from "cors";
import path from "path";
import { initDb } from "./db";

import authRoutes from "./routes/auth";
import usuariosRoutes from "./routes/usuarios";
import categoriasRoutes from "./routes/categorias";
import votosRoutes from "./routes/votos";

const app = express();

// Fly inyecta PORT. En local usa 3000.
const PORT = Number(process.env.PORT) || 3000;
// En Fly hay que escuchar en 0.0.0.0
const HOST = "0.0.0.0";

const isProd = process.env.NODE_ENV === "production";

// -------- Middlewares --------
app.use(express.json());

// Si vas a servir Angular desde el MISMO dominio (recomendado),
// en producción no necesitas CORS.
// En local sí (Angular en localhost:4200).
if (!isProd) {
  app.use(
    cors({
      origin: "http://localhost:4200",
      credentials: true,
    })
  );
}

// -------- DB init --------
initDb();

// -------- API Routes --------
// Ojo: tus archivos siguen en backend/routes/*.ts tal cual.
// Solo que aquí los montamos con prefijo /api para no chocar con rutas Angular.
app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/votos", votosRoutes);

// Healthcheck
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// -------- Frontend (Angular build) --------
// Este directorio lo llenaremos con el build de Angular en el siguiente paso.
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));

// Fallback SPA: cualquier ruta que NO sea /api -> index.html
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Not found" });
  }
  return res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, HOST, () => {
  console.log(`✅ Server escuchando en http://${HOST}:${PORT}`);
});
