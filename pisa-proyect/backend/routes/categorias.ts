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
 * GET /categorias
 * Devuelve categorías con sus nominados.
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

    const sqlNominados = `
      SELECT cn.id, cn.categoria_id, cn.usuario_id, cn.video_url,
             u.username, u.display_name, u.rol
      FROM categoria_nominados cn
      JOIN usuarios u ON u.id = cn.usuario_id
    `;

    db.all(sqlNominados, [], (err2: any, nominadosRows: any[]) => {
      if (err2) return res.status(500).json({ error: err2.message });

      const nominados: CategoriaNominadoRespuesta[] = nominadosRows.map((n) => ({
        id: n.id,
        categoria_id: n.categoria_id,
        usuario_id: n.usuario_id,
        video_url: n.video_url,
        usuario: {
          id: n.usuario_id,
          username: n.username,
          display_name: n.display_name,
          rol: n.rol,
        },
      }));

      const resultado: CategoriaConNominados[] = categorias.map((c) => {
        const nominadosCat = nominados.filter(
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
 * Devuelve categorías con nominados, si ha votado y top 2.
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

    const sqlNominados = `
      SELECT cn.id, cn.categoria_id, cn.usuario_id, cn.video_url,
             u.username, u.display_name, u.rol
      FROM categoria_nominados cn
      JOIN usuarios u ON u.id = cn.usuario_id
    `;

    db.all(sqlNominados, [], (err2: any, nominadosRows: any[]) => {
      if (err2) return res.status(500).json({ error: err2.message });

      const nominados: CategoriaNominadoRespuesta[] = nominadosRows.map((n) => ({
        id: n.id,
        categoria_id: n.categoria_id,
        usuario_id: n.usuario_id,
        video_url: n.video_url,
        usuario: {
          id: n.usuario_id,
          username: n.username,
          display_name: n.display_name,
          rol: n.rol,
        },
      }));

      db.all("SELECT * FROM votos", [], (err3: any, votosRows: any[]) => {
        if (err3) return res.status(500).json({ error: err3.message });

        const resultado: CategoriaEstado[] = categorias.map((c) => {
          const nominadosCat = nominados.filter(
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
                (v: any) => v.nominado_usuario_id === n.usuario.id
              ).length;

              return {
                nominadoUsuarioId: n.usuario.id,
                display_name: n.usuario.display_name,
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
 */
router.post("/:categoriaId/nominados", (req: Request, res: Response) => {
  const categoriaId = Number(req.params.categoriaId);
  const { usuario_id, video_url } = req.body as {
    usuario_id?: number;
    video_url?: string;
  };

  if (!usuario_id) {
    return res.status(400).json({ error: "usuario_id es obligatorio" });
  }

  db.run(
    `
    INSERT INTO categoria_nominados (categoria_id, usuario_id, video_url)
    VALUES (?, ?, ?)
    `,
    [categoriaId, usuario_id, video_url || null],
    function (err: any) {
      if (err) return res.status(500).json({ error: err.message });

      const nuevo: CategoriaNominado = {
        id: this.lastID,
        categoria_id: categoriaId,
        usuario_id,
        video_url: video_url || null,
      };

      res.status(201).json(nuevo);
    }
  );
});

export default router;
