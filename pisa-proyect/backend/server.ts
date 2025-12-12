// backend/server.ts
import express from "express";
import cors from "cors";
import { initDb } from "./db";

import authRoutes from "./routes/auth";
import usuariosRoutes from "./routes/usuarios";
import categoriasRoutes from "./routes/categorias";
import votosRoutes from "./routes/votos";

const app = express();
const PORT = process.env.PORT || 3000;

// CORS: permite peticiones desde el front en http://localhost:4200
app.use(
  cors({
    origin: "http://localhost:4200",
  })
);
// Si quieres, para desarrollo puedes usar simplemente:
// app.use(cors());

app.use(express.json());

initDb();

// 👇 Aquí montamos el router de auth con prefijo /auth
app.use("/auth", authRoutes);          // => POST /auth/login
app.use("/usuarios", usuariosRoutes);
app.use("/categorias", categoriasRoutes);
app.use("/votos", votosRoutes);

app.get("/", (_req, res) => {
  res.json({ message: "Backend de premios funcionando 🚀" });
});

app.listen(PORT, () => {
  console.log(`✅ Backend escuchando en http://localhost:${PORT}`);
});
