import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  nombre = '';
  correo = '';
  contrasena = '';
  confirmContrasena = '';
  area = '';
  showPassword = false;
  showConfirmPassword = false;
  submitting = false;
  errorMessage = signal<string | null>(null);

  // Departamentos y áreas operativas
  areasDisponibles: string[] = [
    'Sistemas / TI',
    'Producción',
    'Almacén de materia prima',
    'Almacén de producto terminado',
    'Logística',
    'Electrónica',
    'Dirección Comercial / Ventas',
    'Administración',
    'Proyectos Especiales',
    'Recepción / Calidad',
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    if (!this.nombre.trim() || !this.correo.trim() || !this.contrasena || !this.area) {
      this.errorMessage.set('Por favor completa todos los campos obligatorios (*).');
      return;
    }

    if (this.contrasena.length < 6) {
      this.errorMessage.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (this.contrasena !== this.confirmContrasena) {
      this.errorMessage.set('Las contraseñas no coinciden. Verifica nuevamente.');
      return;
    }

    this.submitting = true;
    this.errorMessage.set(null);

    this.authService
      .register({
        nombre: this.nombre.trim(),
        correo: this.correo.trim(),
        contrasena: this.contrasena,
        area: this.area,
        isAdmin: false,
      })
      .subscribe({
        next: (res) => {
          this.submitting = false;
          if (res.success) {
            this.router.navigate(['/dashboard']);
          } else {
            this.errorMessage.set(res.message || 'No se pudo completar el registro.');
          }
        },
        error: (err) => {
          this.submitting = false;
          if (err.status === 422 && err.error?.errors) {
            const errors = err.error.errors;
            const firstError = Object.values(errors)[0] as string[];
            this.errorMessage.set(firstError?.[0] || 'Datos inválidos. Revisa el formulario.');
          } else if (err.error?.message) {
            this.errorMessage.set(err.error.message);
          } else {
            this.errorMessage.set('Error al conectar con el servidor.');
          }
        },
      });
  }
}

