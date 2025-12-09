// backend/seed-data.ts
import { db, initDb } from "./db";
import type { RolUsuario } from "./types/usuario";

interface UserSeed {
  username: string;
  display_name: string;
  rol: RolUsuario;
  password: string;
}

interface CategoriaSeed {
  numero: number; // 1..15
  nombre: string;
  descripcion?: string | null;
  es_videos?: boolean;
}

interface NominacionSeed {
  categoriaNumero: number;   // 1..15
  username: string;          // username del usuario nominado
  video_url?: string | null; // solo para la categoría de vídeos (13)
}

// 1) USUARIOS
const usuarios: UserSeed[] = [
  { username: "rey",      display_name: "Alberto Rey",      rol: "admin",   password: "rey123" },
  { username: "olivares", display_name: "Álvaro Olivares",  rol: "interno", password: "olivares456" },
  { username: "andres",   display_name: "Andrés Fernández", rol: "interno", password: "andres789" },
  { username: "botas",    display_name: "Santiago Botas",   rol: "interno", password: "botas321" },
  { username: "cabezas",  display_name: "Pablo Cabezas",    rol: "interno", password: "cabezas654" },
  { username: "cojo",     display_name: "Jorge Cojo",       rol: "interno", password: "cojo987" },
  { username: "cubo",     display_name: "Cubo",             rol: "interno", password: "cubo159" },
  // mapeos que has pedido:
  { username: "nigy",     display_name: "Daniel García",    rol: "interno", password: "nigy753" },
  { username: "juaco",    display_name: "Joaquín González", rol: "interno", password: "juaco147" },
  { username: "lacasta",  display_name: "Lacasta",          rol: "interno", password: "lacasta258" },
  { username: "rubita",   display_name: "Mario Elvira",     rol: "interno", password: "rubita369" },
  { username: "migu",     display_name: "Miguel Ángel",     rol: "interno", password: "migu246" },
  { username: "monereo",  display_name: "Monereo",          rol: "interno", password: "monereo135" },
  { username: "vargas",   display_name: "Gonzalo Vargas",   rol: "interno", password: "vargas468" },
  { username: "vega",     display_name: "Gonzalo Vega",     rol: "interno", password: "vega579" },
  { username: "mariano",  display_name: "Mariano",          rol: "interno", password: "mariano802" },
  { username: "rorro",    display_name: "Rodrigo Navarro",  rol: "interno", password: "rorro913" },

  // Externos – Pisarranas de reparto (categoría 11)
  { username: "redon",    display_name: "Redon",            rol: "externo", password: "redon111" },
  { username: "igna",     display_name: "Igna",             rol: "externo", password: "igna222" },
  { username: "torres",   display_name: "Torres",           rol: "externo", password: "torres333" },
  { username: "santi",    display_name: "Santi",            rol: "externo", password: "santi444" },
];

// 2) CATEGORÍAS (nombres exactos del PDF)
const categorias: CategoriaSeed[] = [
  { numero: 1,  nombre: "Mejor creador de memes" },
  { numero: 2,  nombre: "Gymbro del año" },
  { numero: 3,  nombre: "Most valuable obrero" },
  { numero: 4,  nombre: "Mayor liado" },
  { numero: 5,  nombre: "Más putero" },
  { numero: 6,  nombre: "Mayor hustler" },
  { numero: 7,  nombre: "Mayor masonada" },
  { numero: 8,  nombre: "Most improved player" },
  { numero: 9,  nombre: "Most funny player" },
  { numero: 10, nombre: "Mayor druida" },
  { numero: 11, nombre: "Mejor pisarranas de reparto" },
  { numero: 12, nombre: "Mayor performance del año" },
  { numero: 13, nombre: "Mejor clip del año", es_videos: true },
  { numero: 14, nombre: "Mayor blackout" },
  { numero: 15, nombre: "Mejor borracho" },
];

// 3) NOMINACIONES (por username)
const nominaciones: NominacionSeed[] = [
  // 1) Mejor creador de memes
  { categoriaNumero: 1, username: "nigy" },    // Daniel García
  { categoriaNumero: 1, username: "andres" },
  { categoriaNumero: 1, username: "rubita" },  // Mario Elvira
  { categoriaNumero: 1, username: "juaco" },

  // 2) Gymbro del año
  { categoriaNumero: 2, username: "botas" },
  { categoriaNumero: 2, username: "andres" },
  { categoriaNumero: 2, username: "cabezas" },
  { categoriaNumero: 2, username: "vargas" },

  // 3) Most valuable obrero
  { categoriaNumero: 3, username: "olivares" },
  { categoriaNumero: 3, username: "juaco" },
  { categoriaNumero: 3, username: "cojo" },
  { categoriaNumero: 3, username: "migu" },    // Miguel Ángel

  // 4) Mayor liado
  { categoriaNumero: 4, username: "andres" },
  { categoriaNumero: 4, username: "juaco" },
  { categoriaNumero: 4, username: "nigy" },
  { categoriaNumero: 4, username: "botas" },

  // 5) Más putero
  { categoriaNumero: 5, username: "nigy" },
  { categoriaNumero: 5, username: "cabezas" },
  { categoriaNumero: 5, username: "botas" },
  { categoriaNumero: 5, username: "rey" },

  // 6) Mayor hustler
  { categoriaNumero: 6, username: "rorro" },   // Rodrigo Navarro
  { categoriaNumero: 6, username: "cabezas" },
  { categoriaNumero: 6, username: "andres" },
  { categoriaNumero: 6, username: "botas" },

  // 7) Mayor masonada (eventos)
  { categoriaNumero: 7, username: "masonada1" },
  { categoriaNumero: 7, username: "masonada2" },
  { categoriaNumero: 7, username: "masonada3" },
  { categoriaNumero: 7, username: "masonada4" },

  // 8) Most improved player
  { categoriaNumero: 8, username: "botas" },
  { categoriaNumero: 8, username: "vega" },
  { categoriaNumero: 8, username: "andres" },
  { categoriaNumero: 8, username: "cojo" },

  // 9) Most funny player
  { categoriaNumero: 9, username: "juaco" },
  { categoriaNumero: 9, username: "rubita" },
  { categoriaNumero: 9, username: "andres" },
  { categoriaNumero: 9, username: "botas" },

  // 10) Mayor druida (eventos)
  { categoriaNumero: 10, username: "druida1" },
  { categoriaNumero: 10, username: "druida2" },
  { categoriaNumero: 10, username: "druida3" },

  // 11) Mejor pisarranas de reparto
  { categoriaNumero: 11, username: "redon" },
  { categoriaNumero: 11, username: "igna" },
  { categoriaNumero: 11, username: "torres" },
  { categoriaNumero: 11, username: "santi" },

  // 12) Mayor performance del año
  { categoriaNumero: 12, username: "performance1" },
  { categoriaNumero: 12, username: "performance2" },
  { categoriaNumero: 12, username: "performance3" },

  // 13) Mejor clip del año (vídeos)
  // TODO: cuando tengas URLs reales, ponlas en video_url
  { categoriaNumero: 13, username: "clip1", video_url: null },
  { categoriaNumero: 13, username: "clip2", video_url: null },
  { categoriaNumero: 13, username: "clip3", video_url: null },

  // 14) Mayor blackout
  { categoriaNumero: 14, username: "blackout1" },
  { categoriaNumero: 14, username: "blackout2" },
  { categoriaNumero: 14, username: "blackout3" },

  // 15) Mejor borracho
  { categoriaNumero: 15, username: "olivares" },
  { categoriaNumero: 15, username: "botas" },
  { categoriaNumero: 15, username: "cojo" },
  { categoriaNumero: 15, username: "juaco" },
];

// --------- LÓGICA DE SEED ---------

function seedUsuarios(): Promise<void> {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT OR IGNORE INTO usuarios (username, display_name, rol, password)
      VALUES (?, ?, ?, ?)
    `;
    db.serialize(() => {
      const stmt = db.prepare(sql);
      usuarios.forEach((u) => {
        stmt.run([u.username, u.display_name, u.rol, u.password], (err) => {
          if (err) {
            console.error("Error insertando usuario", u.username, err.message);
          } else {
            console.log("Usuario insertado/ignorado:", u.username);
          }
        });
      });
      stmt.finalize((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });
}

function seedCategorias(): Promise<void> {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT OR IGNORE INTO categorias (id, nombre, descripcion, es_videos)
      VALUES (?, ?, ?, ?)
    `;
    db.serialize(() => {
      const stmt = db.prepare(sql);
      categorias.forEach((c) => {
        stmt.run(
          [c.numero, c.nombre, c.descripcion || null, c.es_videos ? 1 : 0],
          (err) => {
            if (err) {
              console.error("Error insertando categoria", c.numero, c.nombre, err.message);
            } else {
              console.log("Categoría insertada/ignorada:", c.numero, c.nombre);
            }
          }
        );
      });
      stmt.finalize((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });
}

function seedNominaciones(): Promise<void> {
  return new Promise((resolve, reject) => {
    const sqlUsuarioId = `SELECT id FROM usuarios WHERE username = ?`;
    const sqlInsertNom = `
      INSERT OR IGNORE INTO categoria_nominados (categoria_id, usuario_id, video_url)
      VALUES (?, ?, ?)
    `;

    db.serialize(() => {
      const stmtInsert = db.prepare(sqlInsertNom);
      let pendientes = nominaciones.length;

      if (pendientes === 0) return resolve();

      nominaciones.forEach((n) => {
        db.get(sqlUsuarioId, [n.username], (err, row) => {
          if (err) {
            console.error("Error buscando usuario para nominación", n, err.message);
          } else if (!row) {
            console.error("No se encontró usuario para nominación", n.username);
          } else {
            const categoriaId = n.categoriaNumero; // usamos el número como id directamente
            stmtInsert.run(
              [categoriaId, row.id, n.video_url || null],
              (err2) => {
                if (err2) {
                  console.error(
                    "Error insertando nominación",
                    n,
                    err2.message
                  );
                } else {
                  console.log(
                    "Nominación insertada/ignorada:",
                    `cat ${categoriaId} -> ${n.username}`
                  );
                }
              }
            );
          }

          pendientes--;
          if (pendientes === 0) {
            stmtInsert.finalize((err3) => {
              if (err3) return reject(err3);
              resolve();
            });
          }
        });
      });
    });
  });
}

async function runSeed() {
  try {
    initDb();
    console.log("🔹 Sembrando usuarios...");
    await seedUsuarios();
    console.log("🔹 Sembrando categorías...");
    await seedCategorias();
    console.log("🔹 Sembrando nominaciones...");
    await seedNominaciones();
    console.log("✅ Seed completado");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error en seed:", err);
    process.exit(1);
  }
}

runSeed();
