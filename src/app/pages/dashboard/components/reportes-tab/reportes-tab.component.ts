import { Component, OnInit, signal, computed, inject, ChangeDetectorRef, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteService, Reporte } from '../../../../core/services/reporte.service';
import { User } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-reportes-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes-tab.component.html',
})
export class ReportesTabComponent implements OnInit {
  private reporteService = inject(ReporteService);
  private cdr = inject(ChangeDetectorRef);

  user = input<User | null>(null);
  isAdmin = input<boolean>(false);

  // Solicitar confirmación al componente padre
  requestConfirm = output<{
    titulo: string;
    mensaje: string;
    botonTexto?: string;
    botonClase?: string;
    accion: () => void;
  }>();

  reportes = signal<Reporte[]>([]);
  loadingReportes = signal<boolean>(true);
  searchReportes = signal<string>('');

  // Métricas
  totalReportes = computed(() => this.reportes().length);
  reportesRevisados = computed(() => this.reportes().filter((r) => r.revisado).length);
  reportesPendientes = computed(() => this.reportes().filter((r) => !r.revisado).length);

  // Modal Reporte
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

  ngOnInit(): void {
    this.cargarReportes();
  }

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

    const payload = {
      trabajo: this.nuevoReporte.trabajo.trim(),
      fechaInicio: this.nuevoReporte.fechaInicio,
      fechaTermino: this.nuevoReporte.fechaTermino,
      observaciones: this.nuevoReporte.observaciones?.trim() || '',
      comentarios: this.nuevoReporte.comentarios?.trim() || '',
    };

    this.reporteService.createReporte(payload).subscribe({
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
    this.requestConfirm.emit({
      titulo: 'Eliminar Reporte Diario',
      mensaje: '¿Estás seguro de que deseas eliminar este reporte de actividad? Esta acción no se puede deshacer.',
      botonTexto: 'Sí, eliminar',
      botonClase: 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30',
      accion: () => {
        this.reporteService.deleteReporte(idReportes).subscribe({
          next: (res) => {
            if (res.success) {
              this.reportes.update((prev) => prev.filter((r) => Number(r.idReportes) !== Number(idReportes)));
              this.cdr.detectChanges();
              this.cargarReportes();
            }
          },
          error: (err) => {
            alert(err.error?.message || 'Error al eliminar el reporte.');
          },
        });
      },
    });
  }

  private getCurrentDateTime(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }
}

