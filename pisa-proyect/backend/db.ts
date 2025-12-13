// backend/db.ts
import sqlite3 from "sqlite3";
import path from "path";

const dbPath = path.join(__dirname, "premios.db");
export const db = new sqlite3.Database(dbPath);

export function initDb() {
  db.serialize(() => {
    // (Opcional pero recomendado) activar FK en SQLite
    db.run(`PRAGMA foreign_keys = ON;`);

    // Usuarios
    db.run(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        rol TEXT NOT NULL DEFAULT 'interno', -- 'admin' | 'interno' | 'externo'
        password TEXT NOT NULL               -- texto plano (para el juego vale)
      )
    `);

    // Categorías
    db.run(`
      CREATE TABLE IF NOT EXISTS categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        es_videos INTEGER DEFAULT 0
      )
    `);

    /*
      NUEVO MODELO:
      - nominaciones: lo que se vota dentro de una categoría (evento / clip / persona)
      - nominacion_usuarios: qué usuarios están ligados a esa nominación (1 o varios)
    */

    // Nominaciones (lo que se vota dentro de una categoría)
    db.run(`
      CREATE TABLE IF NOT EXISTS nominaciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        categoria_id INTEGER NOT NULL,
        descripcion TEXT NOT NULL,
        video_url TEXT,
        FOREIGN KEY (categoria_id) REFERENCES categorias(id)
      )
    `);

    // Usuarios ligados a una nominación (1 o varios)
    db.run(`
      CREATE TABLE IF NOT EXISTS nominacion_usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nominacion_id INTEGER NOT NULL,
        usuario_id INTEGER NOT NULL,
        FOREIGN KEY (nominacion_id) REFERENCES nominaciones(id),
        FOREIGN KEY (usuario_id)    REFERENCES usuarios(id)
      )
    `);

    // Evita duplicados (misma nominación ↔ mismo usuario)
    db.run(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_nominacion_usuarios
      ON nominacion_usuarios(nominacion_id, usuario_id)
    `);

    // Votos: usuario vota una nominación en una categoría
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

    // Evita que un usuario vote 2 veces en la misma categoría
    db.run(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_votos_votante_categoria
      ON votos(votante_id, categoria_id)
    `);

    // (Opcional) Índices de rendimiento
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

    // Si vienes del modelo anterior y la tabla existe, ya no tiene sentido:
    // db.run(`DROP TABLE IF EXISTS categoria_nominados`);
  });
}
