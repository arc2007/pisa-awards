// src/app/services/votos.services.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable, Subject, tap } from 'rxjs';

export interface VotoEvent {
  votanteId: number;
  categoriaId: number;
  nominacionId: number;
}

@Injectable({ providedIn: 'root' })
export class VotosService {
  private apiUrl = environment.apiUrl;

  private votoSubject = new Subject<VotoEvent>();
  voto$ = this.votoSubject.asObservable();

  constructor(private http: HttpClient) {}

  votar(votanteId: number, categoriaId: number, nominacionId: number): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/votos`, {
        votante_id: votanteId,
        categoria_id: categoriaId,
        nominacion_id: nominacionId,
      })
      .pipe(
        tap(() => {
          this.votoSubject.next({ votanteId, categoriaId, nominacionId });
        })
      );
  }
}
