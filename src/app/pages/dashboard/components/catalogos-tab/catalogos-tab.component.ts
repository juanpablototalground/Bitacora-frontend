import { Component, OnInit, signal, computed, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogoService, CatalogoActividad, CreateCatalogoPayload, UpdateCatalogoPayload } from '../../../../core/services/catalogo.service';

export interface EstadoOption {
  value: string;
  badgeClass: string;
}

@Component({
  selector: 'app-catalogos-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalogos-tab.component.html',
  styleUrls: ['./catalogos-tab.component.css'],
})
export class CatalogosTabComponent implements OnInit {
  private catalogoService = inject(CatalogoService);

  @Input() isAdmin: boolean = false;
  @Output() requestConfirm = new EventEmitter<{
    titulo: string;
    mensaje: string;
    botonTexto?: string;
    botonClase?: string;
    accion: () => void;
  }>();

  actividades = signal<CatalogoActividad[]>([]);
  loading = signal<boolean>(false);
  searchTerm = signal<string>('');
  filtroEstado = signal<string>('todos');

  // Modal para crear nueva actividad
  showCreateModal = signal<boolean>(false);
  createLoading = signal<boolean>(false);
  createError = signal<string>('');

  newActividad: CreateCatalogoPayload = {
    actividad: '',
    tarea: '',
    estado: 'Sin empezar',
    fechaInicio: '',
    fechaEntrega: '',
    asignado: '',
    observaciones: '',
    visto: false,
  };

  // Modal de edición completa
  showEditModal = signal<boolean>(false);
  selectedActividad = signal<CatalogoActividad | null>(null);
  editLoading = signal<boolean>(false);
  editError = signal<string>('');

  // Toast
  toastMessage = signal<string>('');

  // OPCIONES DE ESTADO Y SUS COLORES CORPORATIVOS SEGÚN EXCEL
  estadosDisponibles: EstadoOption[] = [
    { value: 'Sin empezar', badgeClass: 'bg-[#ffeedb] text-[#995200] font-bold border border-[#ffb366]' },
    { value: 'En curso', badgeClass: 'bg-[#dcfce7] text-[#166534] font-bold border border-[#86efac]' },
    { value: 'Omitida', badgeClass: 'bg-[#6b21a8] text-white font-bold border border-[#9333ea]' },
    { value: 'Completada', badgeClass: 'bg-[#15803d] text-white font-extrabold border border-[#22c55e]' },
  ];

  // Métricas
  totalActividades = computed(() => this.actividades().length);
  completadas = computed(() => this.actividades().filter((a) => a.estado.toLowerCase() === 'completada').length);
  enCurso = computed(() => this.actividades().filter((a) => a.estado.toLowerCase() === 'en curso').length);
  sinEmpezar = computed(() => this.actividades().filter((a) => a.estado.toLowerCase() === 'sin empezar').length);
  omitidas = computed(() => this.actividades().filter((a) => a.estado.toLowerCase() === 'omitida').length);

  // Lista filtrada
  filteredActividades = computed(() => {
    let list = this.actividades();
    const term = this.searchTerm().toLowerCase().trim();
    const est = this.filtroEstado();

    if (est !== 'todos') {
      list = list.filter((a) => a.estado.toLowerCase() === est.toLowerCase());
    }

    if (!term) return list;

    return list.filter(
      (a) =>
        a.actividad.toLowerCase().includes(term) ||
        (a.tarea || '').toLowerCase().includes(term) ||
        (a.asignado || '').toLowerCase().includes(term) ||
        (a.observaciones || '').toLowerCase().includes(term) ||
        a.estado.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.cargarActividades();
  }

  cargarActividades(): void {
    this.loading.set(true);
    this.catalogoService.getActividades().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.actividades.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  getEstadoBadgeClass(estado: string): string {
    const match = this.estadosDisponibles.find(
      (e) => e.value.toLowerCase() === (estado || '').toLowerCase()
    );
    return match ? match.badgeClass : 'bg-slate-800 text-slate-300 font-bold border border-white/10';
  }

  // Creación
  abrirCrearModal(): void {
    this.newActividad = {
      actividad: '',
      tarea: '',
      estado: 'Sin empezar',
      fechaInicio: '',
      fechaEntrega: '',
      asignado: '',
      observaciones: '',
      visto: false,
    };
    this.createError.set('');
    this.showCreateModal.set(true);
  }

  cerrarCrearModal(): void {
    this.showCreateModal.set(false);
  }

  guardarNuevaActividad(): void {
    if (!this.newActividad.actividad.trim()) {
      this.createError.set('Por favor escribe el nombre de la actividad.');
      return;
    }

    this.createLoading.set(true);
    this.createError.set('');

    this.catalogoService.crearActividad(this.newActividad).subscribe({
      next: (res) => {
        this.createLoading.set(false);
        if (res.success && res.data) {
          this.actividades.update((prev) => [...prev, res.data]);
          this.cerrarCrearModal();
          this.mostrarToast('Actividad agregada al catálogo');
        }
      },
      error: (err) => {
        this.createLoading.set(false);
        this.createError.set(err.error?.message || 'Error al guardar actividad');
      },
    });
  }

  // Cambio interactivo directo de Estado en la tabla
  actualizarEstadoDirecto(act: CatalogoActividad, nuevoEstado: string): void {
    if (act.estado === nuevoEstado) return;

    const anterior = act.estado;
    act.estado = nuevoEstado;

    this.catalogoService.actualizarActividad(act.id, { estado: nuevoEstado }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.actividades.update((prev) =>
            prev.map((a) => (a.id === act.id ? res.data : a))
          );
          this.mostrarToast(`Estado: ${nuevoEstado}`);
        }
      },
      error: () => {
        act.estado = anterior;
        this.mostrarToast('Error al actualizar estado');
      },
    });
  }

  // Toggle Visto (Checkbox)
  toggleVisto(act: CatalogoActividad): void {
    const anterior = act.visto;
    act.visto = !anterior;

    this.catalogoService.toggleVisto(act.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.actividades.update((prev) =>
            prev.map((a) => (a.id === act.id ? res.data : a))
          );
          this.mostrarToast(res.data.visto ? 'Marcado como visto' : 'Desmarcado');
        }
      },
      error: () => {
        act.visto = anterior;
        this.mostrarToast('Error al alternar visto');
      },
    });
  }

  // Modal para edición completa
  abrirEditarModal(act: CatalogoActividad): void {
    this.selectedActividad.set({ ...act });
    this.editError.set('');
    this.showEditModal.set(true);
  }

  cerrarEditarModal(): void {
    this.showEditModal.set(false);
    this.selectedActividad.set(null);
  }

  guardarEdicionActividad(): void {
    const act = this.selectedActividad();
    if (!act) return;

    this.editLoading.set(true);
    this.editError.set('');

    const payload: UpdateCatalogoPayload = {
      actividad: act.actividad,
      tarea: act.tarea,
      estado: act.estado,
      fechaInicio: act.fechaInicio,
      fechaEntrega: act.fechaEntrega,
      asignado: act.asignado,
      observaciones: act.observaciones,
      visto: act.visto,
    };

    this.catalogoService.actualizarActividad(act.id, payload).subscribe({
      next: (res) => {
        this.editLoading.set(false);
        if (res.success && res.data) {
          this.actividades.update((prev) =>
            prev.map((a) => (a.id === act.id ? res.data : a))
          );
          this.cerrarEditarModal();
          this.mostrarToast('Actividad actualizada');
        }
      },
      error: (err) => {
        this.editLoading.set(false);
        this.editError.set(err.error?.message || 'Error al actualizar');
      },
    });
  }

  // Eliminar actividad
  eliminarActividad(act: CatalogoActividad): void {
    this.requestConfirm.emit({
      titulo: 'Eliminar Actividad de Catálogo',
      mensaje: `¿Estás seguro de eliminar "${act.actividad}"?`,
      botonTexto: 'Eliminar',
      botonClase: 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30',
      accion: () => {
        this.actividades.update((prev) => prev.filter((a) => a.id !== act.id));
        this.catalogoService.eliminarActividad(act.id).subscribe({
          next: () => {
            this.mostrarToast('Actividad eliminada');
          },
          error: () => {
            this.cargarActividades();
          },
        });
      },
    });
  }

  mostrarToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set('');
    }, 3000);
  }
}
