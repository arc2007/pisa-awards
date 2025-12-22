"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/server.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const db_1 = require("./db");
const auth_1 = __importDefault(require("./routes/auth"));
const usuarios_1 = __importDefault(require("./routes/usuarios"));
const categorias_1 = __importDefault(require("./routes/categorias"));
const votos_1 = __importDefault(require("./routes/votos"));
const app = (0, express_1.default)();
// Fly inyecta PORT; local puedes usar 3000
const PORT = Number(process.env.PORT) || 8080;
// Importante en Fly: escuchar en 0.0.0.0
const HOST = "0.0.0.0";
app.set("trust proxy", 1); // útil detrás del proxy de Fly (opcional)
// --- Middlewares ---
app.use(express_1.default.json());
// CORS:
// En producción, si sirves Angular desde el mismo dominio, normalmente no necesitas CORS.
const isProd = process.env.NODE_ENV === "production";
if (!isProd) {
    app.use((0, cors_1.default)({
        origin: "http://localhost:4200",
        credentials: true,
    }));
}
// --- DB init ---
(0, db_1.initDb)();
// --- API routes (prefijo /api para no chocar con rutas del Angular) ---
app.use("/api/auth", auth_1.default);
app.use("/api/usuarios", usuarios_1.default);
app.use("/api/categorias", categorias_1.default);
app.use("/api/votos", votos_1.default);
app.get("/api/health", (_req, res) => res.json({ ok: true }));
// --- Frontend estático (Angular) ---
// En el Docker build copiaremos el dist del Angular aquí:
const publicDir = path_1.default.join(__dirname, "public");
app.use(express_1.default.static(publicDir));
// Si piden una ruta de API que no existe -> 404 JSON
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));
// Para refrescos en rutas tipo /algo del Angular
app.get("*", (_req, res) => {
    res.sendFile(path_1.default.join(publicDir, "index.html"));
});
app.listen(PORT, HOST, () => {
    console.log(`✅ Backend escuchando en http://${HOST}:${PORT}`);
});
