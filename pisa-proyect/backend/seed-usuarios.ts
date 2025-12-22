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

/**
 * Nominación de una categoría.
 * - descripcion: texto que saldrá en el front (persona o evento).
 * - usernames: usernames de los implicados en la nominación (1..N).
 * - video_url: solo para la categoría de vídeos si quieres.
 */
interface NominacionSeed {
  categoriaNumero: number;   // 1..15
  descripcion: string;
  usernames: string[];       // 0..N (puede estar vacío si no mapeamos a nadie)
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

// 3) NOMINACIONES (una fila por opción del PDF, con 1..N usernames)
const nominaciones: NominacionSeed[] = [
  // 1) Mejor creador de memes
  { categoriaNumero: 1, descripcion: "Daniel García",     usernames: ["nigy"] },
  { categoriaNumero: 1, descripcion: "Andrés Fernández",  usernames: ["andres"] },
  { categoriaNumero: 1, descripcion: "Mario Elvira",      usernames: ["rubita"] },
  { categoriaNumero: 1, descripcion: "Joaquín González",  usernames: ["juaco"] },

  // 2) Gymbro del año
  { categoriaNumero: 2, descripcion: "Santiago Botas",    usernames: ["botas"] },
  { categoriaNumero: 2, descripcion: "Andrés Fernández",  usernames: ["andres"] },
  { categoriaNumero: 2, descripcion: "Pablo Cabezas",     usernames: ["cabezas"] },
  { categoriaNumero: 2, descripcion: "Gonzalo Vargas",    usernames: ["vargas"] },

  // 3) Most valuable obrero
  { categoriaNumero: 3, descripcion: "Álvaro Olivares",   usernames: ["olivares"] },
  { categoriaNumero: 3, descripcion: "Joaquín González",  usernames: ["juaco"] },
  { categoriaNumero: 3, descripcion: "Jorge Cojo",        usernames: ["cojo"] },
  { categoriaNumero: 3, descripcion: "Miguel Ángel",      usernames: ["migu"] },

  // 4) Mayor liado
  { categoriaNumero: 4, descripcion: "Andrés Fernández",  usernames: ["andres"] },
  { categoriaNumero: 4, descripcion: "Joaquín González",  usernames: ["juaco"] },
  { categoriaNumero: 4, descripcion: "Daniel García",     usernames: ["nigy"] },
  { categoriaNumero: 4, descripcion: "Santiago Botas",    usernames: ["botas"] },

  // 5) Más putero
  { categoriaNumero: 5, descripcion: "Daniel García",     usernames: ["nigy"] },
  { categoriaNumero: 5, descripcion: "Pablo Cabezas",     usernames: ["cabezas"] },
  { categoriaNumero: 5, descripcion: "Santiago Botas",    usernames: ["botas"] },
  { categoriaNumero: 5, descripcion: "Alberto Rey",       usernames: ["rey"] },

  // 6) Mayor hustler
  { categoriaNumero: 6, descripcion: "Rodrigo Navarro",   usernames: ["rorro"] },
  { categoriaNumero: 6, descripcion: "Pablo Cabezas",     usernames: ["cabezas"] },
  { categoriaNumero: 6, descripcion: "Andrés Fernández",  usernames: ["andres"] },
  { categoriaNumero: 6, descripcion: "Santiago Botas",    usernames: ["botas"] },

  // 7) Mayor masonada (eventos)
  {
    categoriaNumero: 7,
    descripcion: "Botas perdiendo los 3 trofeos nada más ganarlos",
    usernames: ["botas"],
  },
  {
    categoriaNumero: 7,
    descripcion: "Botas pilla 2 taxis para buscar a Juaco por el barrio y al dar con él se mete hostión en su cara y J pasa de él",
    usernames: ["botas", "juaco"],
  },
  {
    categoriaNumero: 7,
    descripcion: "Migu quedándose sobao en la puerta del MSG y siendo despertado por unos munipas",
    usernames: ["migu"],
  },
  {
    categoriaNumero: 7,
    descripcion: "Mario rompiéndose dedo del pie por ir en bici mamao e intentar cambiar de canción",
    usernames: ["rubita"],
  },

  // 8) Most improved player
  { categoriaNumero: 8, descripcion: "Santiago Botas",    usernames: ["botas"] },
  { categoriaNumero: 8, descripcion: "Gonzalo Vega",      usernames: ["vega"] },
  { categoriaNumero: 8, descripcion: "Andrés Fernández",  usernames: ["andres"] },
  { categoriaNumero: 8, descripcion: "Jorge Cojo",        usernames: ["cojo"] },

  // 9) Most funny player
  { categoriaNumero: 9, descripcion: "Joaquín González",  usernames: ["juaco"] },
  { categoriaNumero: 9, descripcion: "Mario Elvira",      usernames: ["rubita"] },
  { categoriaNumero: 9, descripcion: "Andrés Fernández",  usernames: ["andres"] },
  { categoriaNumero: 9, descripcion: "Santiago Botas",    usernames: ["botas"] },

  // 10) Mayor druida (eventos)
  {
    categoriaNumero: 10,
    descripcion: "Gramo de farla y cri un martes laborable en piwi cubo laburando al día siguiente",
    usernames: ["cubo"],
  },
  {
    categoriaNumero: 10,
    descripcion: "El Cuerdo truca batido de protes a El Loco",
    usernames: [],
  },
  {
    categoriaNumero: 10,
    descripcion: "Migu Andy dando popperazos con pipazos con una manzana en una esquina del chapan",
    usernames: ["migu", "andres"],
  },

  // 11) Mejor pisarranas de reparto
  { categoriaNumero: 11, descripcion: "Redon",            usernames: ["redon"] },
  { categoriaNumero: 11, descripcion: "Igna",             usernames: ["igna"] },
  { categoriaNumero: 11, descripcion: "Torres",           usernames: ["torres"] },
  { categoriaNumero: 11, descripcion: "Santi",            usernames: ["santi"] },

  // 12) Mayor performance del año (eventos)
  {
    categoriaNumero: 12,
    descripcion: "J y Botas un jueves de montesa + tuk se cuelan en la fiesta del periódico El Español",
    usernames: ["juaco", "botas"],
  },
  {
    categoriaNumero: 12,
    descripcion: "Botas después de la ruta de la cirrosis le quita un neceser a un pibe que rompe una ventana para robarlo y lo devuelve",
    usernames: ["botas"],
  },
  {
    categoriaNumero: 12,
    descripcion: "Juaco llamando a Daria a las 4am post tuk",
    usernames: ["juaco"],
  },

  // 13) Mejor clip del año (vídeos)
  { categoriaNumero: 13, descripcion: "Help me en Sitges",       usernames: ["andres"],        video_url: null },
  { categoriaNumero: 13, descripcion: "Juaco bailando con niñas", usernames: ["juaco"], video_url: null },
  { categoriaNumero: 13, descripcion: "Juaco yappin",            usernames: ["juaco"], video_url: null },

  // 14) Mayor blackout (eventos)
  {
    categoriaNumero: 14,
    descripcion: "Ex de Botas y novia de Peki pintando coche de Dieguin y bañera en el pekifest",
    usernames: ["botas","cabezas"],
  },
  {
    categoriaNumero: 14,
    descripcion: "Andy post cuidar de fentanyl entra en blackout coge moto y se rompe gemelo sin saber como",
    usernames: ["andres"],
  },
  {
    categoriaNumero: 14,
    descripcion: "Migu un jueves casi tira mesa de DJ, es echado y luego se intenta ligar a la de los tickets",
    usernames: ["migu"],
  },

  // 15) Mejor borracho
  { categoriaNumero: 15, descripcion: "Álvaro Olivares",  usernames: ["olivares"] },
  { categoriaNumero: 15, descripcion: "Santiago Botas",   usernames: ["botas"] },
  { categoriaNumero: 15, descripcion: "Jorge Cojo",       usernames: ["cojo"] },
  { categoriaNumero: 15, descripcion: "Joaquín González", usernames: ["juaco"] },
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
          if (err) console.error("Error insertando usuario", u.username, err.message);
          else console.log("Usuario insertado/ignorado:", u.username);
        });
      });
      stmt.finalize((err) => (err ? reject(err) : resolve()));
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
            if (err) console.error("Error insertando categoria", c.numero, c.nombre, err.message);
            else console.log("Categoría insertada/ignorada:", c.numero, c.nombre);
          }
        );
      });
      stmt.finalize((err) => (err ? reject(err) : resolve()));
    });
  });
}

/**
 * Seed de nominaciones con el nuevo modelo (idempotente):
 * - INSERT OR IGNORE en `nominaciones`
 * - Obtener id real con SELECT
 * - INSERT OR IGNORE en `nominacion_usuarios`
 *
 * Recomendación: tener este índice único en db.ts:
 *   CREATE UNIQUE INDEX IF NOT EXISTS ux_nominaciones_cat_desc
 *   ON nominaciones(categoria_id, descripcion);
 */
function seedNominaciones(): Promise<void> {
  return new Promise((resolve, reject) => {
    const sqlUsuarioId = `SELECT id FROM usuarios WHERE username = ?`;

    const sqlInsertNom = `
      INSERT OR IGNORE INTO nominaciones (categoria_id, descripcion, video_url)
      VALUES (?, ?, ?)
    `;

    const sqlGetNomId = `
      SELECT id FROM nominaciones
      WHERE categoria_id = ? AND descripcion = ?
      LIMIT 1
    `;

    const sqlInsertNomUsuario = `
      INSERT OR IGNORE INTO nominacion_usuarios (nominacion_id, usuario_id)
      VALUES (?, ?)
    `;

    if (nominaciones.length === 0) return resolve();

    let pendientesNominaciones = nominaciones.length;

    const doneNominacion = () => {
      pendientesNominaciones--;
      if (pendientesNominaciones === 0) resolve();
    };

    db.serialize(() => {
      nominaciones.forEach((n) => {
        db.run(
          sqlInsertNom,
          [n.categoriaNumero, n.descripcion, n.video_url ?? null],
          (errNom: any) => {
            if (errNom) {
              console.error("Error insertando nominación", n, errNom.message);
              return doneNominacion();
            }

            db.get(
              sqlGetNomId,
              [n.categoriaNumero, n.descripcion],
              (errGet: any, rowNom: any) => {
                if (errGet || !rowNom) {
                  console.error(
                    "Error obteniendo id de nominación",
                    n,
                    errGet?.message ?? "No encontrada"
                  );
                  return doneNominacion();
                }

                const nominacionId = rowNom.id;
                console.log(
                  "Nominación OK:",
                  `cat ${n.categoriaNumero} -> ${n.descripcion} (id=${nominacionId})`
                );

                if (!n.usernames || n.usernames.length === 0) {
                  return doneNominacion();
                }

                let pendientesUsuarios = n.usernames.length;

                const doneUsuario = () => {
                  pendientesUsuarios--;
                  if (pendientesUsuarios === 0) doneNominacion();
                };

                n.usernames.forEach((username) => {
                  db.get(sqlUsuarioId, [username], (errUser: any, rowUser: any) => {
                    if (errUser) {
                      console.error("Error buscando usuario", username, errUser.message);
                      return doneUsuario();
                    }
                    if (!rowUser) {
                      console.error("No se encontró usuario", username);
                      return doneUsuario();
                    }

                    db.run(
                      sqlInsertNomUsuario,
                      [nominacionId, rowUser.id],
                      (errLink: any) => {
                        if (errLink) {
                          console.error(
                            "Error insertando nominacion_usuarios",
                            { nominacionId, username },
                            errLink.message
                          );
                        } else {
                          console.log(`Ligado: nom ${nominacionId} <- ${username}`);
                        }
                        doneUsuario();
                      }
                    );
                  });
                });
              }
            );
          }
        );
      });
    });
  });
}

async function runSeed() {
  try {
    initDb();

    // Si quieres “reset total” cada vez, descomenta esto:
    // await new Promise<void>((res, rej) => db.serialize(() => {
    //   db.run("DELETE FROM votos", (e) => e ? rej(e) : null);
    //   db.run("DELETE FROM nominacion_usuarios", (e) => e ? rej(e) : null);
    //   db.run("DELETE FROM nominaciones", (e) => e ? rej(e) : null);
    //   res();
    // }));

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
