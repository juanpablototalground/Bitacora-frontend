import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api.config';

export interface UsuarioSalida {
  id: number;
  nombre: string;
  correo: string;
  area: string;
}

export interface ControlSalida {
  id: number;
  idUser: number;
  Fecha: string;
  Lugar: string;
  FechaEntrada: string | null;
  FechaSalida: string;
  Revisado: boolean;
  Comentarios: string;
  usuario?: UsuarioSalida;
}

export interface ControlSalidaResponse {
  success: boolean;
  data: ControlSalida[];
  message?: string;
}

export interface SingleSalidaResponse {
  success: boolean;
  data: ControlSalida;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ControlSalidaService {
  private readonly apiUrl = `${API_BASE_URL}/control-salidas`;

  constructor(private http: HttpClient) {}

  getSalidas(filters?: { month?: number; year?: number; search?: string }): Observable<ControlSalidaResponse> {
    let params = new HttpParams();
    if (filters?.month) params = params.set('month', filters.month.toString());
    if (filters?.year) params = params.set('year', filters.year.toString());
    if (filters?.search) params = params.set('search', filters.search);

    return this.http.get<ControlSalidaResponse>(this.apiUrl, { params });
  }

  createSalida(payload: {
    Fecha: string;
    Lugar: string;
    FechaSalida: string;
    FechaEntrada?: string | null;
    Comentarios?: string;
    Revisado?: boolean;
  }): Observable<SingleSalidaResponse> {
    return this.http.post<SingleSalidaResponse>(this.apiUrl, payload);
  }

  marcarRegreso(id: number, payload?: { FechaEntrada?: string; Comentarios?: string }): Observable<SingleSalidaResponse> {
    return this.http.patch<SingleSalidaResponse>(`${this.apiUrl}/${id}/marcar-regreso`, payload || {});
  }

  toggleRevisado(id: number): Observable<SingleSalidaResponse> {
    return this.http.patch<SingleSalidaResponse>(`${this.apiUrl}/${id}/toggle-revisado`, {});
  }

  deleteSalida(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }
}

