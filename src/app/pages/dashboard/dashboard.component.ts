import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ControlSalidaService, ControlSalida } from '../../core/services/control-salida.service';
import { ReporteService, Reporte } from '../../core/services/reporte.service';
import { ProyectoService, Proyecto } from '../../core/services/proyecto.service';

export interface LugarOption {
  label: string;
  badgeClass: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private salidaService = inject(ControlSalidaService);
  private reporteService = inject(ReporteService);
  private proyectoService = inject(ProyectoService);
  private router = inject(Router);

  user = this.authService.currentUser;
  
  // Pestaña activa: 'salidas' | 'reportes' | 'proyectos'
  activeTab = signal<'salidas' | 'reportes' | 'proyectos'>('reportes');

  // Control Salidas State
  salidas = signal<ControlSalida[]>([]);
  loadingSalidas = signal<boolean>(true);
  searchSalidas = signal<string>('');

  // Reportes Diarios State
  reportes = signal<Reporte[]>([]);
  loadingReportes = signal<boolean>(true);
  searchReportes = signal<string>('');

  // Proyectos IT State
  proyectos = signal<Proyecto[]>([]);
  loadingProyectos = signal<boolean>(true);
  searchProyectos = signal<string>('');
  filtroEstadoProyecto = signal<'todos' | 'Pendiente' | 'Completado'>('todos');
  
  // Rol de Administrador y Permiso IT
  isAdmin = computed(() => !!this.user()?.isAdmin);
  isSistemas = computed(() => {
    const area = this.user()?.area?.toLowerCase() || '';
    return area.includes('sistema') || area.includes('ti') || area.includes('it');
  });
  canAccessProyectos = computed(() => this.isAdmin() || this.isSistemas());

  currentMonthName = 'NOVIEMBRE';
  currentYear = 2026;

  // Lugares predefinidos según imagen
  lugaresDisponibles: LugarOption[] = [
    { label: 'Entrada', badgeClass: 'bg-red-500/15 text-red-400 border border-red-500/30' },
    { label: 'Baño', badgeClass: 'bg-amber-900/30 text-amber-500 border border-amber-800/40' },
    { label: 'V1', badgeClass: 'bg-stone-500/20 text-stone-300 border border-stone-500/30' },
    { label: 'V5', badgeClass: 'bg-rose-500/15 text-rose-300 border border-rose-500/30' },
    { label: 'MKT', badgeClass: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
    { label: 'Externos', badgeClass: 'bg-sky-500/15 text-sky-400 border border-sky-500/30' },
    { label: 'Ingenieria', badgeClass: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' },
    { label: 'Otro', badgeClass: 'bg-purple-500/15 text-purple-300 border border-purple-500/30' },
    { label: 'Sala Juntas', badgeClass: 'bg-slate-500/20 text-slate-300 border border-slate-500/30' },
    { label: 'Contabilidad', badgeClass: 'bg-red-900/40 text-red-300 border border-red-700/50' },
  ];

  // Modal Control Salida
  showSalidaModal = signal<boolean>(false);
  submittingSalida = signal<boolean>(false);
  salidaModalError = signal<string | null>(null);
  nuevaSalida = {
    Fecha: this.getCurrentDate(),
    Lugar: 'Entrada',
    FechaSalida: this.getCurrentDateTime(),
    FechaEntrada: this.getCurrentDateTime(),
    Comentarios: '',
  };

  // Modal Reporte Diario
  showReporteModal = signal<boolean>(false);
  submittingReporte = signal<boolean>(false);
  reporteModalError = signal<string | null>(null);
  nuevoReporte = {
    trabajo: '',
    fechaInicio: this.getCurrentDateTime(),
    fechaTermino: this.getCurrentDateTime(),
    observaciones: '',
    comentarios: '',
  };

  // Modal Proyecto IT
  showProyectoModal = signal<boolean>(false);
  editingProyectoId = signal<number | null>(null);
  submittingProyecto = signal<boolean>(false);
  proyectoModalError = signal<string | null>(null);
  nuevoProyecto = {
    Nombreproyecto: '',
    descripcion: '',
    estadoProyecto: 'Pendiente' as 'Pendiente' | 'Completado',
    enlaceRepositorio: '',
    observaciones: '',
  };

  // Filtros reactivos
  filteredSalidas = computed(() => {
    const query = this.searchSalidas().toLowerCase().trim();
    if (!query) return this.salidas();
    return this.salidas().filter((item) => {
      const nombre = item.usuario?.nombre?.toLowerCase() || '';
      const lugar = item.Lugar?.toLowerCase() || '';
      const area = item.usuario?.area?.toLowerCase() || '';
      const comentarios = item.Comentarios?.toLowerCase() || '';
      return (
        nombre.includes(query) ||
        lugar.includes(query) ||
        area.includes(query) ||
        comentarios.includes(query)
      );
    });
  });

  filteredReportes = computed(() => {
    const query = this.searchReportes().toLowerCase().trim();
    if (!query) return this.reportes();
    return this.reportes().filter((item) => {
      const trabajo = item.trabajo?.toLowerCase() || '';
      const nombre = item.usuario?.nombre?.toLowerCase() || '';
      const area = item.usuario?.area?.toLowerCase() || '';
      const observaciones = item.observaciones?.toLowerCase() || '';
      const comentarios = item.comentarios?.toLowerCase() || '';
      return (
        trabajo.includes(query) ||
        nombre.includes(query) ||
        area.includes(query) ||
        observaciones.includes(query) ||
        comentarios.includes(query)
      );
    });
  });

  filteredProyectos = computed(() => {
    const query = this.searchProyectos().toLowerCase().trim();
    const filtroEstado = this.filtroEstadoProyecto();

    return this.proyectos().filter((p) => {
      const matchesEstado =
        filtroEstado === 'todos' ||
        p.estadoProyecto?.toLowerCase() === filtroEstado.toLowerCase();

      if (!matchesEstado) return false;
      if (!query) return true;

      const nombre = p.Nombreproyecto?.toLowerCase() || '';
      const descripcion = p.descripcion?.toLowerCase() || '';
      const repo = p.enlaceRepositorio?.toLowerCase() || '';
      const observaciones = p.observaciones?.toLowerCase() || '';

      return (
        nombre.includes(query) ||
        descripcion.includes(query) ||
        repo.includes(query) ||
        observaciones.includes(query)
      );
    });
  });

  // Métricas
  totalReportes = computed(() => this.reportes().length);
  reportesRevisados = computed(() => this.reportes().filter((r) => r.revisado).length);
  reportesPendientes = computed(() => this.reportes().filter((r) => !r.revisado).length);

  totalSalidas = computed(() => this.salidas().length);
  salidasRevisadas = computed(() => this.salidas().filter((s) => s.Revisado).length);
  salidasPendientes = computed(() => this.salidas().filter((s) => !s.Revisado).length);

  totalProyectos = computed(() => this.proyectos().length);
  proyectosPendientes = computed(() =>
    this.proyectos().filter((p) => p.estadoProyecto?.toLowerCase() === 'pendiente').length
  );
  proyectosCompletados = computed(() =>
    this.proyectos().filter((p) => p.estadoProyecto?.toLowerCase() === 'completado').length
  );

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.cargarReportes();
    this.cargarSalidas();
    if (this.canAccessProyectos()) {
      this.cargarProyectos();
    }
  }

  setTab(tab: 'salidas' | 'reportes' | 'proyectos'): void {
    if (tab === 'proyectos' && !this.canAccessProyectos()) {
      alert('Acceso restringido: Solo el Administrador y personal de Sistemas / TI pueden ver este apartado.');
      return;
    }
    this.activeTab.set(tab);
    if (tab === 'proyectos' && this.proyectos().length === 0) {
      this.cargarProyectos();
    }
  }

  // Métodos Reportes Diarios
  cargarReportes(): void {
    this.loadingReportes.set(true);
    this.reporteService.getReportes().subscribe({
      next: (res) => {
        this.loadingReportes.set(false);
        if (res.success) {
          this.reportes.set(res.data);
        }
      },
      error: () => {
        this.loadingReportes.set(false);
      },
    });
  }

  abrirReporteModal(): void {
    this.reporteModalError.set(null);
    this.nuevoReporte = {
      trabajo: '',
      fechaInicio: this.getCurrentDateTime(),
      fechaTermino: this.getCurrentDateTime(),
      observaciones: '',
      comentarios: '',
    };
    this.showReporteModal.set(true);
  }

  cerrarReporteModal(): void {
    this.showReporteModal.set(false);
  }

  guardarReporte(): void {
    if (!this.nuevoReporte.trabajo.trim()) {
      this.reporteModalError.set('Por favor describe el trabajo o actividad realizada.');
      return;
    }

    this.submittingReporte.set(true);
    this.reporteModalError.set(null);

    this.reporteService.createReporte(this.nuevoReporte).subscribe({
      next: (res) => {
        this.submittingReporte.set(false);
        if (res.success && res.data) {
          this.reportes.update((prev) => [res.data, ...prev]);
          this.cerrarReporteModal();
        }
      },
      error: (err) => {
        this.submittingReporte.set(false);
        this.reporteModalError.set(err.error?.message || 'Error al guardar el reporte.');
      },
    });
  }

  toggleRevisadoReporte(reporte: Reporte): void {
    if (!this.isAdmin()) {
      alert('Solo el Administrador puede cambiar el estado de Visto.');
      return;
    }

    const originalState = reporte.revisado;
    reporte.revisado = !originalState;

    this.reporteService.toggleRevisado(reporte.idReportes).subscribe({
      error: () => {
        reporte.revisado = originalState;
      },
    });
  }

  eliminarReporte(idReportes: number): void {
    if (!confirm('¿Estás seguro de eliminar este reporte de actividad?')) return;

    this.reporteService.deleteReporte(idReportes).subscribe({
      next: (res) => {
        if (res.success) {
          this.reportes.update((prev) => prev.filter((r) => r.idReportes !== idReportes));
        }
      },
    });
  }

  // Métodos Control Salidas
  cargarSalidas(): void {
    this.loadingSalidas.set(true);
    this.salidaService.getSalidas().subscribe({
      next: (res) => {
        this.loadingSalidas.set(false);
        if (res.success) {
          this.salidas.set(res.data);
        }
      },
      error: () => {
        this.loadingSalidas.set(false);
      },
    });
  }

  abrirSalidaModal(): void {
    this.salidaModalError.set(null);
    this.nuevaSalida = {
      Fecha: this.getCurrentDate(),
      Lugar: 'Entrada',
      FechaSalida: this.getCurrentDateTime(),
      FechaEntrada: this.getCurrentDateTime(),
      Comentarios: '',
    };
    this.showSalidaModal.set(true);
  }

  cerrarSalidaModal(): void {
    this.showSalidaModal.set(false);
  }

  guardarSalida(): void {
    if (!this.nuevaSalida.Lugar) {
      this.salidaModalError.set('Por favor selecciona un lugar de la lista.');
      return;
    }

    this.submittingSalida.set(true);
    this.salidaModalError.set(null);

    this.salidaService.createSalida(this.nuevaSalida).subscribe({
      next: (res) => {
        this.submittingSalida.set(false);
        if (res.success && res.data) {
          this.salidas.update((prev) => [res.data, ...prev]);
          this.cerrarSalidaModal();
        }
      },
      error: (err) => {
        this.submittingSalida.set(false);
        this.salidaModalError.set(err.error?.message || 'Error al registrar la salida.');
      },
    });
  }

  toggleRevisadoSalida(salida: ControlSalida): void {
    if (!this.isAdmin()) {
      alert('Solo el Administrador puede cambiar el estado de Visto.');
      return;
    }

    const originalState = salida.Revisado;
    salida.Revisado = !originalState;

    this.salidaService.toggleRevisado(salida.id).subscribe({
      error: () => {
        salida.Revisado = originalState;
      },
    });
  }

  eliminarSalida(id: number): void {
    if (!confirm('¿Estás seguro de eliminar este registro de salida?')) return;

    this.salidaService.deleteSalida(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.salidas.update((prev) => prev.filter((s) => s.id !== id));
        }
      },
    });
  }

  // Métodos Proyectos IT
  cargarProyectos(): void {
    this.loadingProyectos.set(true);
    this.proyectoService.getProyectos().subscribe({
      next: (res) => {
        this.loadingProyectos.set(false);
        if (res.success) {
          this.proyectos.set(res.data);
        }
      },
      error: () => {
        this.loadingProyectos.set(false);
      },
    });
  }

  abrirCrearProyectoModal(): void {
    this.proyectoModalError.set(null);
    this.editingProyectoId.set(null);
    this.nuevoProyecto = {
      Nombreproyecto: '',
      descripcion: '',
      estadoProyecto: 'Pendiente',
      enlaceRepositorio: '',
      observaciones: '',
    };
    this.showProyectoModal.set(true);
  }

  abrirEditarProyectoModal(proyecto: Proyecto): void {
    this.proyectoModalError.set(null);
    this.editingProyectoId.set(proyecto.idProyectos);
    this.nuevoProyecto = {
      Nombreproyecto: proyecto.Nombreproyecto,
      descripcion: proyecto.descripcion,
      estadoProyecto: (proyecto.estadoProyecto?.toLowerCase() === 'completado' ? 'Completado' : 'Pendiente') as 'Pendiente' | 'Completado',
      enlaceRepositorio: proyecto.enlaceRepositorio,
      observaciones: proyecto.observaciones || '',
    };
    this.showProyectoModal.set(true);
  }

  cerrarProyectoModal(): void {
    this.showProyectoModal.set(false);
    this.editingProyectoId.set(null);
  }

  guardarProyecto(): void {
    if (!this.nuevoProyecto.Nombreproyecto.trim() || !this.nuevoProyecto.descripcion.trim()) {
      this.proyectoModalError.set('Nombre y Descripción son obligatorios.');
      return;
    }

    this.submittingProyecto.set(true);
    this.proyectoModalError.set(null);

    const editId = this.editingProyectoId();

    if (editId) {
      this.proyectoService.actualizarProyecto(editId, this.nuevoProyecto).subscribe({
        next: (res) => {
          this.submittingProyecto.set(false);
          if (res.success && res.data) {
            this.proyectos.update((prev) =>
              prev.map((p) => (p.idProyectos === editId ? res.data : p))
            );
            this.cerrarProyectoModal();
          }
        },
        error: (err) => {
          this.submittingProyecto.set(false);
          this.proyectoModalError.set(err.error?.message || 'Error al actualizar el proyecto.');
        },
      });
    } else {
      this.proyectoService.crearProyecto(this.nuevoProyecto).subscribe({
        next: (res) => {
          this.submittingProyecto.set(false);
          if (res.success && res.data) {
            this.proyectos.update((prev) => [res.data, ...prev]);
            this.cerrarProyectoModal();
          }
        },
        error: (err) => {
          this.submittingProyecto.set(false);
          this.proyectoModalError.set(err.error?.message || 'Error al crear el proyecto.');
        },
      });
    }
  }

  cambiarEstadoProyecto(proyecto: Proyecto, nuevoEstado: 'Pendiente' | 'Completado'): void {
    if (proyecto.estadoProyecto === nuevoEstado) return;

    const originalEstado = proyecto.estadoProyecto;
    proyecto.estadoProyecto = nuevoEstado;

    this.proyectoService.cambiarEstado(proyecto.idProyectos, nuevoEstado).subscribe({
      next: (res) => {
        if (!res.success) {
          proyecto.estadoProyecto = originalEstado;
        }
      },
      error: () => {
        proyecto.estadoProyecto = originalEstado;
      },
    });
  }

  eliminarProyecto(idProyectos: number): void {
    if (!confirm('¿Estás seguro de eliminar este proyecto de IT?')) return;

    this.proyectoService.eliminarProyecto(idProyectos).subscribe({
      next: (res) => {
        if (res.success) {
          this.proyectos.update((prev) => prev.filter((p) => p.idProyectos !== idProyectos));
        }
      },
    });
  }

  getLugarBadgeClass(lugar: string): string {
    const found = this.lugaresDisponibles.find(
      (item) => item.label.toLowerCase() === lugar?.toLowerCase()
    );
    return found ? found.badgeClass : 'bg-slate-800 text-slate-300 border border-slate-700';
  }

  private getCurrentDate(): string {
    const now = new Date();
    return now.toISOString().substring(0, 10);
  }

  private getCurrentDateTime(): string {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - offset).toISOString().slice(0, 16);
    return localISOTime;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => {
        this.authService.clearSession();
        this.router.navigate(['/login']);
      },
    });
  }
}
