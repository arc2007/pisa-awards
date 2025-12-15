import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class VotosService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * El back hace UPSERT (si ya votaste esa categoría, actualiza).
   */
  votar(
    votante_id: number,
    categoria_id: number,
    nominacion_id: number
  ): Observable<{
    id: number;
    votante_id: number;
    categoria_id: number;
    nominacion_id: number;
    updated: boolean;
  }> {
    return this.http.post<{
      id: number;
      votante_id: number;
      categoria_id: number;
      nominacion_id: number;
      updated: boolean;
    }>(`${this.apiUrl}/votos`, {
      votante_id,
      categoria_id,
      nominacion_id,
    });
  }
}
