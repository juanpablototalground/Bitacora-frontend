import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api.config';

export interface FolioMkt {
  id: number;
  nombre: string;
  trabajo: string;
  folio?: string;
  fecha?: string;
  asignado: string;
  area: string;
  prioridad?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FolioMktResponse {
  success: boolean;
  message?: string;
  data: FolioMkt[];
}

export interface SingleFolioMktResponse {
  success: boolean;
  message?: string;
  data: FolioMkt;
}

export interface CreateFolioMktPayload {
  nombre: string;
  trabajo: string;
  folio?: string;
  fecha?: string;
  asignado: string;
  area: string;
  prioridad?: string;
}

export interface UpdateFolioMktPayload {
  nombre?: string;
  trabajo?: string;
  folio?: string;
  fecha?: string;
  asignado?: string;
  area?: string;
  prioridad?: string;
}

@Injectable({
  providedIn: 'root',
})
export class FolioMktService {
  private readonly apiUrl = `${API_BASE_URL}/folios-mkt`;

  constructor(private http: HttpClient) {}

  getFolios(): Observable<FolioMktResponse> {
    return this.http.get<FolioMktResponse>(this.apiUrl);
  }

  crearFolio(payload: CreateFolioMktPayload): Observable<SingleFolioMktResponse> {
    return this.http.post<SingleFolioMktResponse>(this.apiUrl, payload);
  }

  actualizarFolio(id: number, payload: UpdateFolioMktPayload): Observable<SingleFolioMktResponse> {
    return this.http.put<SingleFolioMktResponse>(`${this.apiUrl}/${id}`, payload);
  }

  eliminarFolio(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }
}
