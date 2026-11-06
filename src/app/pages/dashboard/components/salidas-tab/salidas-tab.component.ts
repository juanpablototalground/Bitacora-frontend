import { Component, OnInit, signal, computed, inject, ChangeDetectorRef, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ControlSalidaService, ControlSalida } from '../../../../core/services/control-salida.service';
import { LugarOption } from '../../dashboard.component';

@Component({
  selector: 'app-salidas-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './salidas-tab.component.html',
})
export class SalidasTabComponent implements OnInit {
  private salidaService = inject(ControlSalidaService);
  private cdr = inject(ChangeDetectorRef);

  isAdmin = input<boolean>(false);
  lugaresDisponibles = input<LugarOption[]>([]);
  currentMonthName = input<string>('');
  currentYear = input<number>(new Date().getFullYear());

  requestConfirm = output<{
    titulo: string;
    mensaje: string;
    botonTexto?: string;
    botonClase?: string;
    accion: () => void;
  }>();

  salidas = signal<ControlSalida[]>([]);
  loadingSalidas = signal<boolean>(true);
  searchSalidas = signal<string>('');

  totalSalidas = computed(() => this.salidas().length);
  salidasRevisadas = computed(() => this.salidas().filter((s) => s.Revisado).length);
  salidasPendientes = computed(() => this.salidas().filter((s) => !s.Revisado).length);

  showSalidaModal = signal<boolean>(false);
  submittingSalida = signal<boolean>(false);
  salidaModalError = signal<string | null>(null);
  salidaAunFuera = signal<boolean>(true);
  nuevaSalida = {
    Fecha: this.getCurrentDate(),
    Lugar: 'Entrada',
    FechaSalida: this.getCurrentDateTime(),
    FechaEntrada: null as string | null,
    Comentarios: '',
  };

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

  ngOnInit(): void {
    this.cargarSalidas();
  }

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
    this.salidaAunFuera.set(true);
    this.nuevaSalida = {
      Fecha: this.getCurrentDate(),
      Lugar: 'Entrada',
      FechaSalida: this.getCurrentDateTime(),
      FechaEntrada: null,
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

    const payload = {
      ...this.nuevaSalida,
      Comentarios: this.nuevaSalida.Comentarios?.trim() || '',
      FechaEntrada: this.salidaAunFuera() ? null : this.nuevaSalida.FechaEntrada,
    };

    this.salidaService.createSalida(payload).subscribe({
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

  marcarRegresoSalida(salida: ControlSalida): void {
    this.requestConfirm.emit({
      titulo: 'Marcar Hora de Regreso',
      mensaje: `¿Confirmas que has regresado de "${salida.Lugar}"? Se guardará automáticamente la fecha y hora actual.`,
      botonTexto: 'Confirmar Regreso',
      botonClase: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30',
      accion: () => {
        this.salidaService.marcarRegreso(salida.id).subscribe({
          next: (res) => {
            if (res.success && res.data) {
              this.salidas.update((prev) =>
                prev.map((s) => (s.id === salida.id ? res.data : s))
              );
            }
          },
          error: (err) => {
            alert(err.error?.message || 'Error al marcar el regreso.');
          },
        });
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
    this.requestConfirm.emit({
      titulo: 'Eliminar Registro de Salida',
      mensaje: '¿Estás seguro de que deseas eliminar este registro de control de salida?',
      botonTexto: 'Sí, eliminar',
      botonClase: 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30',
      accion: () => {
        this.salidaService.deleteSalida(id).subscribe({
          next: (res) => {
            if (res.success) {
              this.salidas.update((prev) => prev.filter((s) => Number(s.id) !== Number(id)));
              this.cdr.detectChanges();
              this.cargarSalidas();
            }
          },
          error: (err) => {
            alert(err.error?.message || 'Error al eliminar el registro.');
          },
        });
      },
    });
  }

  getLugarBadgeClass(lugar: string): string {
    const found = this.lugaresDisponibles().find(
      (item) => item.label.toLowerCase() === lugar?.toLowerCase()
    );
    return found ? found.badgeClass : 'bg-slate-700/50 text-slate-300 border border-slate-600/40';
  }

  private getCurrentDate(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }

  private getCurrentDateTime(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }
}

