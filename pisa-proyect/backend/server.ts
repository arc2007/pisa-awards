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

// Fly inyecta PORT; local puedes usar 3000
const PORT = Number(process.env.PORT) || 8080;
// Importante en Fly: escuchar en 0.0.0.0
const HOST = "0.0.0.0";

app.set("trust proxy", 1); // útil detrás del proxy de Fly (opcional)

// --- Middlewares ---
app.use(express.json());

// CORS:
// En producción, si sirves Angular desde el mismo dominio, normalmente no necesitas CORS.
const isProd = process.env.NODE_ENV === "production";
if (!isProd) {
  app.use(
    cors({
      origin: "http://localhost:4200",
      credentials: true,
    })
  );
}

// --- DB init ---
initDb();

// --- API routes (prefijo /api para no chocar con rutas del Angular) ---
app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/votos", votosRoutes);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// --- Frontend estático (Angular) ---
// En el Docker build copiaremos el dist del Angular aquí:
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));

// Si piden una ruta de API que no existe -> 404 JSON
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

// Para refrescos en rutas tipo /algo del Angular
app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, HOST, () => {
  console.log(`✅ Backend escuchando en http://${HOST}:${PORT}`);
});
