"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.initDb = initDb;
// backend/db.ts
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dataDir = process.env.SQLITE_DIR || path_1.default.join(process.cwd(), "data");
if (!fs_1.default.existsSync(dataDir))
    fs_1.default.mkdirSync(dataDir, { recursive: true });
const dbPath = path_1.default.join(dataDir, "premios.db");
exports.db = new sqlite3_1.default.Database(dbPath);
function initDb() {
    exports.db.serialize(() => {
        exports.db.run(`PRAGMA foreign_keys = ON;`);
        exports.db.run(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        rol TEXT NOT NULL DEFAULT 'interno',
        password TEXT NOT NULL
      )
    `);
        exports.db.run(`
      CREATE TABLE IF NOT EXISTS categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        es_videos INTEGER DEFAULT 0
      )
    `);
        exports.db.run(`
      CREATE TABLE IF NOT EXISTS nominaciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        categoria_id INTEGER NOT NULL,
        descripcion TEXT NOT NULL,
        video_url TEXT,
        FOREIGN KEY (categoria_id) REFERENCES categorias(id)
      )
    `);
        exports.db.run(`
      CREATE TABLE IF NOT EXISTS nominacion_usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nominacion_id INTEGER NOT NULL,
        usuario_id INTEGER NOT NULL,
        FOREIGN KEY (nominacion_id) REFERENCES nominaciones(id),
        FOREIGN KEY (usuario_id)    REFERENCES usuarios(id)
      )
    `);
        exports.db.run(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_nominacion_usuarios
      ON nominacion_usuarios(nominacion_id, usuario_id)
    `);
        exports.db.run(`
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
        exports.db.run(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_votos_votante_categoria
      ON votos(votante_id, categoria_id)
    `);
        exports.db.run(`
      CREATE INDEX IF NOT EXISTS ix_nominaciones_categoria
      ON nominaciones(categoria_id)
    `);
        exports.db.run(`
      CREATE INDEX IF NOT EXISTS ix_votos_categoria
      ON votos(categoria_id)
    `);
        exports.db.run(`
      CREATE INDEX IF NOT EXISTS ix_votos_nominacion
      ON votos(nominacion_id)
    `);
    });
}
