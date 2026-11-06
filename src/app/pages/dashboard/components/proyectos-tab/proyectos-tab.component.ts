import { Component, OnInit, signal, computed, inject, ChangeDetectorRef, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProyectoService, Proyecto } from '../../../../core/services/proyecto.service';

@Component({
  selector: 'app-proyectos-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proyectos-tab.component.html',
})
export class ProyectosTabComponent implements OnInit {
  private proyectoService = inject(ProyectoService);
  private cdr = inject(ChangeDetectorRef);

  requestConfirm = output<{
    titulo: string;
    mensaje: string;
    botonTexto?: string;
    botonClase?: string;
    accion: () => void;
  }>();

  proyectos = signal<Proyecto[]>([]);
  loadingProyectos = signal<boolean>(true);
  searchProyectos = signal<string>('');
  filtroEstadoProyecto = signal<'todos' | 'Pendiente' | 'Completado'>('todos');

  totalProyectos = computed(() => this.proyectos().length);
  proyectosPendientes = computed(() =>
    this.proyectos().filter((p) => p.estadoProyecto?.toLowerCase() === 'pendiente').length
  );
  proyectosCompletados = computed(() =>
    this.proyectos().filter((p) => p.estadoProyecto?.toLowerCase() === 'completado').length
  );

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

  filteredProyectos = computed(() => {
    const query = this.searchProyectos().toLowerCase().trim();
    const filtro = this.filtroEstadoProyecto().toLowerCase();

    return this.proyectos().filter((p) => {
      if (filtro !== 'todos' && p.estadoProyecto?.toLowerCase() !== filtro) {
        return false;
      }
      if (!query) return true;

      const nombre = p.Nombreproyecto?.toLowerCase() || '';
      const descripcion = p.descripcion?.toLowerCase() || '';
      const observaciones = p.observaciones?.toLowerCase() || '';
      const repo = p.enlaceRepositorio?.toLowerCase() || '';

      return (
        nombre.includes(query) ||
        descripcion.includes(query) ||
        observaciones.includes(query) ||
        repo.includes(query)
      );
    });
  });

  ngOnInit(): void {
    this.cargarProyectos();
  }

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
      descripcion: proyecto.descripcion || '',
      estadoProyecto: (proyecto.estadoProyecto === 'Completado' ? 'Completado' : 'Pendiente') as 'Pendiente' | 'Completado',
      enlaceRepositorio: proyecto.enlaceRepositorio || '',
      observaciones: proyecto.observaciones || '',
    };
    this.showProyectoModal.set(true);
  }

  cerrarProyectoModal(): void {
    this.showProyectoModal.set(false);
    this.editingProyectoId.set(null);
  }

  guardarProyecto(): void {
    if (!this.nuevoProyecto.Nombreproyecto.trim()) {
      this.proyectoModalError.set('Por favor ingresa el nombre del proyecto.');
      return;
    }

    this.submittingProyecto.set(true);
    this.proyectoModalError.set(null);

    const idEditando = this.editingProyectoId();

    if (idEditando) {
      this.proyectoService.actualizarProyecto(idEditando, this.nuevoProyecto).subscribe({
        next: (res) => {
          this.submittingProyecto.set(false);
          if (res.success && res.data) {
            this.proyectos.update((prev) =>
              prev.map((item) => (item.idProyectos === idEditando ? res.data : item))
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
    this.requestConfirm.emit({
      titulo: 'Eliminar Proyecto IT',
      mensaje: '¿Estás seguro de que deseas eliminar este proyecto de IT? Esta acción no se puede revertir.',
      botonTexto: 'Sí, eliminar',
      botonClase: 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30',
      accion: () => {
        this.proyectoService.eliminarProyecto(idProyectos).subscribe({
          next: (res) => {
            if (res.success) {
              this.proyectos.update((prev) => prev.filter((p) => Number(p.idProyectos) !== Number(idProyectos)));
              this.cdr.detectChanges();
              this.cargarProyectos();
            }
          },
          error: (err) => {
            alert(err.error?.message || 'Error al eliminar el proyecto.');
          },
        });
      },
    });
  }
}

