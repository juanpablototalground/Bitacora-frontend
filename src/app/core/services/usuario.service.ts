import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import { User } from './auth.service';

export interface UsuarioResponse {
  success: boolean;
  message?: string;
  data: User[];
}

export interface SingleUsuarioResponse {
  success: boolean;
  message?: string;
  data: User;
}

export interface CreateUsuarioPayload {
  nombre: string;
  correo: string;
  contrasena: string;
  area: string;
  isAdmin?: boolean;
}

export interface UpdateUsuarioPayload {
  nombre?: string;
  correo?: string;
  contrasena?: string;
  area?: string;
  isAdmin?: boolean;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private readonly apiUrl = `${API_BASE_URL}/usuarios`;

  constructor(private http: HttpClient) {}

  getUsuarios(): Observable<UsuarioResponse> {
    return this.http.get<UsuarioResponse>(this.apiUrl);
  }

  crearUsuario(payload: CreateUsuarioPayload): Observable<SingleUsuarioResponse> {
    return this.http.post<SingleUsuarioResponse>(this.apiUrl, payload);
  }

  actualizarUsuario(id: number, payload: UpdateUsuarioPayload): Observable<SingleUsuarioResponse> {
    return this.http.put<SingleUsuarioResponse>(`${this.apiUrl}/${id}`, payload);
  }

  darDeBaja(id: number): Observable<SingleUsuarioResponse> {
    return this.http.delete<SingleUsuarioResponse>(`${this.apiUrl}/${id}`);
  }

  toggleActivo(id: number): Observable<SingleUsuarioResponse> {
    return this.http.patch<SingleUsuarioResponse>(`${this.apiUrl}/${id}/toggle-activo`, {});
  }
}
