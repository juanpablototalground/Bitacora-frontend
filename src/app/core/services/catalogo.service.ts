import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api.config';

export interface CatalogoActividad {
  id: number;
  actividad: string;
  tarea: string;
  estado: 'Sin empezar' | 'En curso' | 'Omitida' | 'Completada' | string;
  fechaInicio: string;
  fechaEntrega: string;
  asignado: string;
  observaciones: string;
  visto: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CatalogoResponse {
  success: boolean;
  message?: string;
  data: CatalogoActividad[];
}

export interface SingleCatalogoResponse {
  success: boolean;
  message?: string;
  data: CatalogoActividad;
}

export interface CreateCatalogoPayload {
  actividad: string;
  tarea?: string;
  estado?: string;
  fechaInicio?: string;
  fechaEntrega?: string;
  asignado?: string;
  observaciones?: string;
  visto?: boolean;
}

export interface UpdateCatalogoPayload {
  actividad?: string;
  tarea?: string;
  estado?: string;
  fechaInicio?: string;
  fechaEntrega?: string;
  asignado?: string;
  observaciones?: string;
  visto?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CatalogoService {
  private readonly apiUrl = `${API_BASE_URL}/catalogo-actividades`;

  constructor(private http: HttpClient) {}

  getActividades(): Observable<CatalogoResponse> {
    return this.http.get<CatalogoResponse>(this.apiUrl);
  }

  crearActividad(payload: CreateCatalogoPayload): Observable<SingleCatalogoResponse> {
    return this.http.post<SingleCatalogoResponse>(this.apiUrl, payload);
  }

  actualizarActividad(id: number, payload: UpdateCatalogoPayload): Observable<SingleCatalogoResponse> {
    return this.http.put<SingleCatalogoResponse>(`${this.apiUrl}/${id}`, payload);
  }

  toggleVisto(id: number): Observable<SingleCatalogoResponse> {
    return this.http.patch<SingleCatalogoResponse>(`${this.apiUrl}/${id}/toggle-visto`, {});
  }

  eliminarActividad(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }
}
