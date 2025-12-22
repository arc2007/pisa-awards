// backend/db.ts
import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";

const dataDir = process.env.DB_DIR || path.join(__dirname); // local: carpeta backend/dist
const dbFile = process.env.DB_FILE || "premios.db";

// En Fly usaremos DB_DIR=/data (volumen persistente)
const dbPath = path.join(dataDir, dbFile);

// Asegura que el directorio existe (en /data existirá cuando montes el volumen)
try {
  fs.mkdirSync(dataDir, { recursive: true });
} catch {}

export const db = new sqlite3.Database(dbPath);

export function initDb() {
  db.serialize(() => {
    db.run(`PRAGMA foreign_keys = ON;`);

    db.run(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        rol TEXT NOT NULL DEFAULT 'interno',
        password TEXT NOT NULL
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
      CREATE TABLE IF NOT EXISTS nominaciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        categoria_id INTEGER NOT NULL,
        descripcion TEXT NOT NULL,
        video_url TEXT,
        FOREIGN KEY (categoria_id) REFERENCES categorias(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS nominacion_usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nominacion_id INTEGER NOT NULL,
        usuario_id INTEGER NOT NULL,
        FOREIGN KEY (nominacion_id) REFERENCES nominaciones(id),
        FOREIGN KEY (usuario_id)    REFERENCES usuarios(id)
      )
    `);

    db.run(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_nominacion_usuarios
      ON nominacion_usuarios(nominacion_id, usuario_id)
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS votos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        votante_id INTEGER NOT NULL,
        categoria_id INTEGER NOT NULL,
        nominacion_id INTEGER NOT NULL,
        FOREIGN KEY (votante_id)    REFERENCES usuarios(id),
        FOREIGN KEY (categoria_id)  REFERENCES categorias(id),
        FOREIGN KEY (nominacion_id) REFERENCES nominaciones(id)
      )
    `);

    db.run(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_votos_votante_categoria
      ON votos(votante_id, categoria_id)
    `);

    db.run(`
      CREATE INDEX IF NOT EXISTS ix_nominaciones_categoria
      ON nominaciones(categoria_id)
    `);
    db.run(`
      CREATE INDEX IF NOT EXISTS ix_votos_categoria
      ON votos(categoria_id)
    `);
    db.run(`
      CREATE INDEX IF NOT EXISTS ix_votos_nominacion
      ON votos(nominacion_id)
    `);
  });
}
