import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class VotosService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  votar(
    votante_id: number,
    categoria_id: number,
    nominacion_id: number
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/votos`, {
      votante_id,
      categoria_id,
      nominacion_id,
    });
  }
}
