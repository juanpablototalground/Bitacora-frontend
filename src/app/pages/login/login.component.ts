import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  correo = '';
  contrasena = '';
  showPassword = false;
  rememberMe = false;
  submitting = false;
  errorMessage = signal<string | null>(null);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (!this.correo || !this.contrasena) {
      this.errorMessage.set('Por favor completa todos los campos requeridos.');
      return;
    }

    this.submitting = true;
    this.errorMessage.set(null);

    this.authService.login({ correo: this.correo, contrasena: this.contrasena }).subscribe({
      next: (res) => {
        this.submitting = false;
        if (res.success) {
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage.set(res.message || 'No fue posible iniciar sesión.');
        }
      },
      error: (err) => {
        this.submitting = false;
        if (err.status === 401) {
          this.errorMessage.set('Credenciales incorrectas. Verifica tu correo y contraseña.');
        } else if (err.status === 429) {
          this.errorMessage.set('Demasiados intentos fallidos. Inténtalo más tarde.');
        } else if (err.error?.message) {
          this.errorMessage.set(err.error.message);
        } else {
          this.errorMessage.set('No fue posible conectar con el backend de Laravel.');
        }
      },
    });
  }
}
