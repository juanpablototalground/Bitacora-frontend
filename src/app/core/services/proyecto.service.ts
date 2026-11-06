import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api.config';

export interface Proyecto {
  idProyectos: number;
  Nombreproyecto: string;
  descripcion: string;
  estadoProyecto: 'Pendiente' | 'Completado' | string;
  enlaceRepositorio: string;
  observaciones?: string;
}

export interface ProyectoListResponse {
  success: boolean;
  data: Proyecto[];
  message?: string;
}

export interface SingleProyectoResponse {
  success: boolean;
  data: Proyecto;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProyectoService {
  private readonly apiUrl = `${API_BASE_URL}/proyectos`;

  constructor(private http: HttpClient) {}

  getProyectos(filters?: { search?: string; estado?: string }): Observable<ProyectoListResponse> {
    let params = new HttpParams();
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.estado) params = params.set('estado', filters.estado);

    return this.http.get<ProyectoListResponse>(this.apiUrl, { params });
  }

  crearProyecto(payload: {
    Nombreproyecto: string;
    descripcion: string;
    estadoProyecto: string;
    enlaceRepositorio: string;
    observaciones?: string;
  }): Observable<SingleProyectoResponse> {
    return this.http.post<SingleProyectoResponse>(this.apiUrl, payload);
  }

  actualizarProyecto(
    id: number,
    payload: {
      Nombreproyecto?: string;
      descripcion?: string;
      estadoProyecto?: string;
      enlaceRepositorio?: string;
      observaciones?: string;
    }
  ): Observable<SingleProyectoResponse> {
    return this.http.put<SingleProyectoResponse>(`${this.apiUrl}/${id}`, payload);
  }

  cambiarEstado(id: number, nuevoEstado: 'Pendiente' | 'Completado'): Observable<SingleProyectoResponse> {
    return this.http.patch<SingleProyectoResponse>(`${this.apiUrl}/${id}`, {
      estadoProyecto: nuevoEstado,
    });
  }

  eliminarProyecto(id: number): Observable<{ success: boolean; message?: string }> {
    return this.http.delete<{ success: boolean; message?: string }>(`${this.apiUrl}/${id}`);
  }
}

