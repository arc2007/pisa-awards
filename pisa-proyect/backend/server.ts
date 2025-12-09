// backend/server.ts
import express from "express";
import cors from "cors";
import { initDb } from "./db";
import authRoutes from "./routes/auth";

// IMPORTS CORRECTOS (default import)
import usuariosRoutes from "./routes/usuarios";
import categoriasRoutes from "./routes/categorias";
import votosRoutes from "./routes/votos";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "http://localhost:4200",
  })
);
app.use(express.json());

initDb();

app.use(authRoutes);                
app.use("/usuarios", usuariosRoutes);
app.use("/categorias", categoriasRoutes);
app.use("/votos", votosRoutes);

app.get("/", (_req, res) => {
  res.json({ message: "Backend de premios funcionando 🚀" });
});

app.listen(PORT, () => {
  console.log(`✅ Backend escuchando en http://localhost:${PORT}`);
});
