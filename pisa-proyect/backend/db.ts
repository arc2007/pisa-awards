// backend/db.ts
import sqlite3 from "sqlite3";
import path from "path";

const dbPath = path.join(__dirname, "premios.db");
export const db = new sqlite3.Database(dbPath);

export function initDb() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        rol TEXT NOT NULL DEFAULT 'interno', -- 'admin' | 'interno' | 'externo'
        password TEXT NOT NULL               -- texto plano (para el juego vale)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        es_videos INTEGER DEFAULT 0
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS categoria_nominados (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        categoria_id INTEGER NOT NULL,
        usuario_id INTEGER NOT NULL,
        video_url TEXT,
        FOREIGN KEY (categoria_id) REFERENCES categorias(id),
        FOREIGN KEY (usuario_id)  REFERENCES usuarios(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS votos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        votante_id INTEGER NOT NULL,
        categoria_id INTEGER NOT NULL,
        nominado_usuario_id INTEGER NOT NULL,
        FOREIGN KEY (votante_id)          REFERENCES usuarios(id),
        FOREIGN KEY (categoria_id)        REFERENCES categorias(id),
        FOREIGN KEY (nominado_usuario_id) REFERENCES usuarios(id)
      )
    `);
  });
}
