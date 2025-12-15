import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface CategoriaEstado {
  id: number;
  nombre: string;
  descripcion: string | null;
  es_videos: boolean;

  nominados: Array<{
    id: number;
    descripcion: string;
    video_url: string | null;
    usuarios: Array<{
      id: number;
      username: string;
      display_name: string;
      rol: string;
    }>;
  }>;

  haVotado: boolean;
  miVotoNominacionId: number | null;

  // SOLO si requester es admin, el back lo incluye
  resultados?: Array<{
    id: number;
    descripcion: string;
    votos: number;
  }>;
}

@Injectable({ providedIn: 'root' })
export class CategoriasService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private auth: AuthService) { }

  /**
   * Para el usuario normal: devuelve nominados + haVotado + miVotoNominacionId.
   * Para admin: además devuelve resultados[].
   *
   * Mandamos requesterId siempre para que el back decida.
   */
  getCategoriasEstado(votanteId: number): Observable<any[]> {
    const requesterId = this.auth.getCurrentUserId();

    let params = new HttpParams();
    if (requesterId) params = params.set('requesterId', String(requesterId));

    return this.http.get<any[]>(`${this.apiUrl}/categorias/estado/${votanteId}`, { params });
  }

  /**
   * Endpoint top: SOLO admin (el back exige requesterId admin).
   */
  getTopCategoria(categoriaId: number): Observable<any[]> {
    const requesterId = this.auth.getCurrentUserId();

    let params = new HttpParams();
    if (requesterId) params = params.set('requesterId', String(requesterId));

    return this.http.get<any[]>(
      `${this.apiUrl}/categorias/${categoriaId}/top`,
      { params }
    );
  }
}
