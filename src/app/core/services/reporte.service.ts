import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api.config';

export interface UsuarioReporte {
  id: number;
  nombre: string;
  correo: string;
  area: string;
  isAdmin: boolean;
}

export interface Reporte {
  idReportes: number;
  idUser: number;
  trabajo: string;
  fechaInicio: string;
  fechaTermino: string;
  revisado: boolean;
  observaciones: string;
  comentarios: string;
  usuario?: UsuarioReporte;
}

export interface ReporteListResponse {
  success: boolean;
  data: Reporte[];
  isAdmin: boolean;
  message?: string;
}

export interface SingleReporteResponse {
  success: boolean;
  data: Reporte;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReporteService {
  private readonly apiUrl = `${API_BASE_URL}/reportes`;

  constructor(private http: HttpClient) {}

  getReportes(filters?: { search?: string; idUser?: number }): Observable<ReporteListResponse> {
    let params = new HttpParams();
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.idUser) params = params.set('idUser', filters.idUser.toString());

    return this.http.get<ReporteListResponse>(this.apiUrl, { params });
  }

  createReporte(payload: {
    trabajo: string;
    fechaInicio: string;
    fechaTermino: string;
    observaciones?: string;
    comentarios?: string;
  }): Observable<SingleReporteResponse> {
    return this.http.post<SingleReporteResponse>(this.apiUrl, payload);
  }

  toggleRevisado(idReportes: number): Observable<SingleReporteResponse> {
    return this.http.patch<SingleReporteResponse>(`${this.apiUrl}/${idReportes}/toggle-revisado`, {});
  }

  deleteReporte(idReportes: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${idReportes}`);
  }
}

