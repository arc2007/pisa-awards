// backend/routes/categorias.ts
import express, { Request, Response } from "express";
import { db } from "../db";
import type { Categoria } from "../types/categoria";
import type { CategoriaNominado } from "../types/nominado";
import type {
  CategoriaConNominados,
  CategoriaEstado,
  CategoriaNominadoRespuesta,
  TopNominadoResumen,
} from "../types/respuestas";

const router = express.Router();

/**
 * Helper: carga todas las nominaciones con sus usuarios.
 */
function cargarNominacionesConUsuarios(
  callback: (err: any, nominaciones: CategoriaNominadoRespuesta[]) => void
) {
  const sql = `
    SELECT
      n.id              AS nominacion_id,
      n.categoria_id    AS categoria_id,
      n.descripcion     AS descripcion,
      n.video_url       AS video_url,
      u.id              AS usuario_id,
      u.username        AS username,
      u.display_name    AS display_name,
      u.rol             AS rol
    FROM nominaciones n
    LEFT JOIN nominacion_usuarios nu ON nu.nominacion_id = n.id
    LEFT JOIN usuarios u ON u.id = nu.usuario_id
  `;

  db.all(sql, [], (err: any, rows: any[]) => {
    if (err) return callback(err, []);

    const map: Record<number, CategoriaNominadoRespuesta> = {};

    rows.forEach((r) => {
      let nom = map[r.nominacion_id];
      if (!nom) {
        nom = {
          id: r.nominacion_id,
          categoria_id: r.categoria_id,
          descripcion: r.descripcion,
          video_url: r.video_url,
          usuarios: [],
        } as CategoriaNominadoRespuesta;

        map[r.nominacion_id] = nom;
      }

      if (r.usuario_id) {
        nom.usuarios.push({
          id: r.usuario_id,
          username: r.username,
          display_name: r.display_name,
          rol: r.rol,
        });
      }
    });

    callback(null, Object.values(map));
  });
}

/**
 * GET /categorias
 * Devuelve categorías con sus nominaciones (cada una con usuarios asociados).
 */
router.get("/", (_req: Request, res: Response) => {
  db.all("SELECT * FROM categorias", [], (err: any, categoriasRows: any[]) => {
    if (err) return res.status(500).json({ error: err.message });

    const categorias: Categoria[] = categoriasRows.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      descripcion: c.descripcion,
      es_videos: !!c.es_videos,
    }));

    cargarNominacionesConUsuarios((err2, nominaciones) => {
      if (err2) return res.status(500).json({ error: err2.message });

      const resultado: CategoriaConNominados[] = categorias.map((c) => {
        const nominadosCat = nominaciones.filter(
          (n) => n.categoria_id === c.id
        );

        return {
          ...c,
          nominados: nominadosCat,
        };
      });

      res.json(resultado);
    });
  });
});

/**
 * GET /categorias/estado/:votanteId
 * Devuelve categorías con nominaciones, si ha votado y top 2 nominaciones.
 */
router.get("/estado/:votanteId", (req: Request, res: Response) => {
  const votanteId = Number(req.params.votanteId);

  db.all("SELECT * FROM categorias", [], (err: any, categoriasRows: any[]) => {
    if (err) return res.status(500).json({ error: err.message });

    const categorias: Categoria[] = categoriasRows.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      descripcion: c.descripcion,
      es_videos: !!c.es_videos,
    }));

    cargarNominacionesConUsuarios((err2, nominaciones) => {
      if (err2) return res.status(500).json({ error: err2.message });

      db.all("SELECT * FROM votos", [], (err3: any, votosRows: any[]) => {
        if (err3) return res.status(500).json({ error: err3.message });

        const resultado: CategoriaEstado[] = categorias.map((c) => {
          const nominadosCat = nominaciones.filter(
            (n) => n.categoria_id === c.id
          );

          const votosCategoria = votosRows.filter(
            (v: any) => v.categoria_id === c.id
          );

          const haVotado = votosCategoria.some(
            (v: any) => v.votante_id === votanteId
          );

          const conteo: TopNominadoResumen[] = nominadosCat
            .map((n) => {
              const count = votosCategoria.filter(
                (v: any) => v.nominacion_id === n.id
              ).length;

              return {
                nominacionId: n.id,
                descripcion: n.descripcion,
                usuarios: n.usuarios.map((u) => ({
                  id: u.id,
                  display_name: u.display_name,
                })),
                votos: count,
              };
            })
            .sort((a, b) => b.votos - a.votos);

          const topNominados = conteo.slice(0, 2);

          const categoriaEstado: CategoriaEstado = {
            ...c,
            nominados: nominadosCat,
            haVotado,
            topNominados,
          };

          return categoriaEstado;
        });

        res.json(resultado);
      });
    });
  });
});

/**
 * POST /categorias
 * (sin cambios, salvo que ahora las nominaciones están en otra tabla)
 */
router.post("/", (req: Request, res: Response) => {
  const { nombre, descripcion, es_videos } = req.body as {
    nombre?: string;
    descripcion?: string;
    es_videos?: boolean;
  };

  if (!nombre) {
    return res.status(400).json({ error: "nombre es obligatorio" });
  }

  db.run(
    `
    INSERT INTO categorias (nombre, descripcion, es_videos)
    VALUES (?, ?, ?)
    `,
    [nombre, descripcion || null, es_videos ? 1 : 0],
    function (err: any) {
      if (err) return res.status(500).json({ error: err.message });

      const nuevaCategoria: Categoria = {
        id: this.lastID,
        nombre,
        descripcion: descripcion || null,
        es_videos: !!es_videos,
      };

      res.status(201).json(nuevaCategoria);
    }
  );
});

/**
 * POST /categorias/:categoriaId/nominados
 * Crea una nueva nominación dentro de la categoría, con 1..N usuarios asociados.
 *
 * Body:
 * {
 *   "descripcion": "Clip del día X",
 *   "video_url": "https://...",
 *   "usuario_ids": [1, 2, 3]
 * }
 */
router.post("/:categoriaId/nominados", (req: Request, res: Response) => {
  const categoriaId = Number(req.params.categoriaId);
  const { descripcion, video_url, usuario_ids } = req.body as {
    descripcion?: string;
    video_url?: string;
    usuario_ids?: number[];
  };

  if (!descripcion || !usuario_ids || usuario_ids.length === 0) {
    return res.status(400).json({
      error:
        "descripcion y usuario_ids (al menos un usuario) son obligatorios",
    });
  }

  db.serialize(() => {
    db.run(
      `
      INSERT INTO nominaciones (categoria_id, descripcion, video_url)
      VALUES (?, ?, ?)
      `,
      [categoriaId, descripcion, video_url || null],
      function (err: any) {
        if (err) return res.status(500).json({ error: err.message });

        const nominacionId = this.lastID;

        const stmt = db.prepare(
          "INSERT INTO nominacion_usuarios (nominacion_id, usuario_id) VALUES (?, ?)"
        );

        usuario_ids.forEach((uid) => {
          stmt.run(nominacionId, uid);
        });

        stmt.finalize((err2: any) => {
          if (err2) return res.status(500).json({ error: err2.message });

          const nuevo: CategoriaNominado = {
            id: nominacionId,
            categoria_id: categoriaId,
            descripcion,
            video_url: video_url || null,
          };

          res.status(201).json({
            ...nuevo,
            usuario_ids,
          });
        });
      }
    );
  });
});

export default router;
