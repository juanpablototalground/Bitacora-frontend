import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ReportesTabComponent } from './components/reportes-tab/reportes-tab.component';
import { SalidasTabComponent } from './components/salidas-tab/salidas-tab.component';
import { ProyectosTabComponent } from './components/proyectos-tab/proyectos-tab.component';
import { ConfirmModalComponent } from './components/confirm-modal/confirm-modal.component';

export interface LugarOption {
  label: string;
  badgeClass: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReportesTabComponent,
    SalidasTabComponent,
    ProyectosTabComponent,
    ConfirmModalComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  user = this.authService.currentUser;

  // Pestaña activa por defecto: 'salidas' primero, luego 'reportes' y al final 'proyectos'
  activeTab = signal<'salidas' | 'reportes' | 'proyectos'>('salidas');

  // Roles y Permisos
  isAdmin = computed(() => !!this.user()?.isAdmin);
  canAccessProyectos = computed(() => {
    const u = this.user();
    if (!u) return false;
    if (u.isAdmin) return true;
    const area = (u.area || '').toLowerCase();
    return area.includes('sistemas') || area.includes('ti') || area.includes('it');
  });

  // Modal genérico de confirmación centralizado
  showConfirmModal = signal<boolean>(false);
  confirmTitle = signal<string>('Confirmación');
  confirmMessage = signal<string>('¿Estás seguro de realizar esta acción?');
  confirmButtonText = signal<string>('Confirmar');
  confirmButtonClass = signal<string>('bg-red-600 hover:bg-red-500 text-white shadow-red-600/30');
  private confirmAction: (() => void) | null = null;

  // Catálogo de Lugares exacto a la lista corporativa de Total Ground
  lugaresDisponibles: LugarOption[] = [
    { label: 'Entrada', badgeClass: 'bg-red-500 text-white font-bold' },
    { label: 'Baño', badgeClass: 'bg-[#5c2e0b] text-[#ffd8b3] font-bold' },
    { label: 'V1', badgeClass: 'bg-[#cfc2b2] text-[#3d332a] font-bold' },
    { label: 'V5', badgeClass: 'bg-[#fca5a5] text-[#7f1d1d] font-bold' },
    { label: 'MKT', badgeClass: 'bg-[#bbf7d0] text-[#14532d] font-bold' },
    { label: 'Externos', badgeClass: 'bg-[#bae6fd] text-[#0369a1] font-bold' },
    { label: 'Ingenieria', badgeClass: 'bg-[#fef08a] text-[#713f12] font-bold' },
    { label: 'Otro', badgeClass: 'bg-[#e9d5ff] text-[#581c87] font-bold' },
    { label: 'Sala Juntas', badgeClass: 'bg-[#e2e8f0] text-[#1e293b] font-bold' },
    { label: 'Contabilidad', badgeClass: 'bg-[#990000] text-white font-bold' },
  ];

  currentYear = new Date().getFullYear();
  currentMonthName = new Intl.DateTimeFormat('es-MX', { month: 'long' })
    .format(new Date())
    .toUpperCase();

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    // Seguridad: Revalidar perfil con el servidor para evitar manipulación en localStorage
    this.authService.fetchProfile().subscribe();
  }

  setTab(tab: 'salidas' | 'reportes' | 'proyectos'): void {
    if (tab === 'proyectos' && !this.canAccessProyectos()) {
      this.abrirModalConfirmacion({
        titulo: 'Acceso Restringido',
        mensaje: 'Solo el Administrador y personal de Sistemas / TI pueden ver este apartado.',
        botonTexto: 'Entendido',
        botonClase: 'bg-slate-700 hover:bg-slate-600 text-white',
        accion: () => {},
      });
      return;
    }
    this.activeTab.set(tab);
  }

  abrirModalConfirmacion(opciones: {
    titulo: string;
    mensaje: string;
    botonTexto?: string;
    botonClase?: string;
    accion: () => void;
  }): void {
    this.confirmTitle.set(opciones.titulo);
    this.confirmMessage.set(opciones.mensaje);
    this.confirmButtonText.set(opciones.botonTexto || 'Confirmar');
    this.confirmButtonClass.set(
      opciones.botonClase || 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
    );
    this.confirmAction = opciones.accion;
    this.showConfirmModal.set(true);
  }

  cerrarConfirmModal(): void {
    this.showConfirmModal.set(false);
    this.confirmAction = null;
  }

  ejecutarConfirmModal(): void {
    if (this.confirmAction) {
      this.confirmAction();
    }
    this.cerrarConfirmModal();
  }

  logout(): void {
    this.abrirModalConfirmacion({
      titulo: 'Cerrar Sesión',
      mensaje: '¿Estás seguro de que deseas salir del sistema de Bitácora?',
      botonTexto: 'Cerrar Sesión',
      botonClase: 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30',
      accion: () => {
        // Ejecutar logout en backend e indistintamente limpiar y redirigir
        this.authService.logout().subscribe({
          next: () => {
            this.router.navigate(['/login']);
          },
          error: () => {
            this.authService.clearSession();
            this.router.navigate(['/login']);
          },
        });
      },
    });
  }
}
