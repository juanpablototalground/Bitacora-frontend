import { Component, OnInit, signal, computed, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FolioMktService, FolioMkt, CreateFolioMktPayload, UpdateFolioMktPayload } from '../../../../core/services/folio-mkt.service';

export interface BadgeOption {
  label: string;
  badgeClass: string;
}

@Component({
  selector: 'app-folios-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './folios-tab.component.html',
  styleUrls: ['./folios-tab.component.css'],
})
export class FoliosTabComponent implements OnInit {
  private folioService = inject(FolioMktService);

  @Input() isAdmin: boolean = false;
  @Output() requestConfirm = new EventEmitter<{
    titulo: string;
    mensaje: string;
    botonTexto?: string;
    botonClase?: string;
    accion: () => void;
  }>();

  folios = signal<FolioMkt[]>([]);
  loading = signal<boolean>(false);
  searchTerm = signal<string>('');
  filtroArea = signal<string>('todos');

  // Modal para crear nuevo folio
  showCreateModal = signal<boolean>(false);
  createLoading = signal<boolean>(false);
  createError = signal<string>('');

  newFolio: CreateFolioMktPayload = {
    nombre: 'Angel',
    trabajo: '',
    folio: '',
    fecha: new Date().getDate().toString(),
    asignado: 'Carol',
    area: 'Diseño',
    prioridad: '',
  };

  // Edición rápida en modal
  showEditModal = signal<boolean>(false);
  selectedFolio = signal<FolioMkt | null>(null);
  editLoading = signal<boolean>(false);
  editError = signal<string>('');

  // Notificaciones Toast
  toastMessage = signal<string>('');

  // OPCIONES DE COLUMNA "NOMBRE" CON SUS COLORES EXACTOS
  nombresDisponibles: BadgeOption[] = [
    { label: 'EXTERNO', badgeClass: 'bg-[#990000] text-white font-bold' },
    { label: 'Pablo', badgeClass: 'bg-[#b6d7e8] text-[#1b4353] font-bold' },
    { label: 'Fer', badgeClass: 'bg-[#ffe599] text-[#78590b] font-bold' },
    { label: 'Angel', badgeClass: 'bg-[#00ff00] text-black font-extrabold shadow-[0_0_10px_rgba(0,255,0,0.4)]' },
    { label: 'Maricruz', badgeClass: 'bg-[#6a0dad] text-[#ffff00] font-bold' },
    { label: 'Paola', badgeClass: 'bg-[#e2e8f0] text-[#1e293b] font-bold' },
  ];

  // OPCIONES DE COLUMNA "ASIGNADO" CON SUS COLORES EXACTOS
  asignadosDisponibles: BadgeOption[] = [
    { label: 'Carol', badgeClass: 'bg-[#e9d5ff] text-[#581c87] font-bold' },
    { label: 'Alondra', badgeClass: 'bg-[#d946ef] text-white font-bold' },
    { label: 'Hugo', badgeClass: 'bg-[#004b99] text-[#ffcc00] font-bold' },
    { label: 'Jebus', badgeClass: 'bg-[#e2e8f0] text-[#1e293b] font-bold' },
    { label: 'Gera', badgeClass: 'bg-[#86efac] text-[#7f1d1d] font-bold' },
    { label: 'Gera / Jebus', badgeClass: 'bg-[#bae6fd] text-[#0369a1] font-bold' },
    { label: 'TODOS', badgeClass: 'bg-[#292524] text-white font-bold' },
  ];

  // OPCIONES DE COLUMNA "AREA" CON SUS COLORES EXACTOS
  areasDisponibles: BadgeOption[] = [
    { label: 'Diseño', badgeClass: 'bg-[#cce8cc] text-[#1b4332] font-bold' },
    { label: 'Audiovisuales', badgeClass: 'bg-[#990000] text-white font-bold' },
    { label: '3D', badgeClass: 'bg-[#581c87] text-white font-bold' },
  ];

  // Métricas
  totalFolios = computed(() => this.folios().length);
  foliosDiseno = computed(() => this.folios().filter((f) => f.area.toLowerCase().includes('diseño')).length);
  foliosAudiovisuales = computed(() => this.folios().filter((f) => f.area.toLowerCase().includes('audio') || f.area.toLowerCase().includes('3d')).length);

  // Lista filtrada
  filteredFolios = computed(() => {
    let list = this.folios();
    const term = this.searchTerm().toLowerCase().trim();
    const area = this.filtroArea();

    if (area !== 'todos') {
      list = list.filter((f) => f.area.toLowerCase() === area.toLowerCase());
    }

    if (!term) return list;

    return list.filter(
      (f) =>
        f.nombre.toLowerCase().includes(term) ||
        f.trabajo.toLowerCase().includes(term) ||
        (f.folio || '').toLowerCase().includes(term) ||
        f.asignado.toLowerCase().includes(term) ||
        f.area.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.cargarFolios();
  }

  cargarFolios(): void {
    this.loading.set(true);
    this.folioService.getFolios().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.folios.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  // Estilos de badges reactivos según texto
  getNombreBadgeClass(nombre: string): string {
    const match = this.nombresDisponibles.find(
      (n) => n.label.toLowerCase() === (nombre || '').toLowerCase()
    );
    return match ? match.badgeClass : 'bg-slate-800 text-slate-300 font-bold';
  }

  getAsignadoBadgeClass(asignado: string): string {
    const match = this.asignadosDisponibles.find(
      (a) => a.label.toLowerCase() === (asignado || '').toLowerCase()
    );
    return match ? match.badgeClass : 'bg-slate-800 text-slate-300 font-bold';
  }

  getAreaBadgeClass(area: string): string {
    const match = this.areasDisponibles.find(
      (ar) => ar.label.toLowerCase() === (area || '').toLowerCase()
    );
    return match ? match.badgeClass : 'bg-slate-800 text-slate-300 font-bold';
  }

  // Creación
  abrirCrearModal(): void {
    this.newFolio = {
      nombre: 'Angel',
      trabajo: '',
      folio: '',
      fecha: new Date().getDate().toString(),
      asignado: 'Carol',
      area: 'Diseño',
      prioridad: '',
    };
    this.createError.set('');
    this.showCreateModal.set(true);
  }

  cerrarCrearModal(): void {
    this.showCreateModal.set(false);
  }

  guardarNuevoFolio(): void {
    if (!this.newFolio.trabajo.trim()) {
      this.createError.set('Por favor escribe la descripción del trabajo.');
      return;
    }

    this.createLoading.set(true);
    this.createError.set('');

    this.folioService.crearFolio(this.newFolio).subscribe({
      next: (res) => {
        this.createLoading.set(false);
        if (res.success && res.data) {
          this.folios.update((prev) => [res.data, ...prev]);
          this.cerrarCrearModal();
          this.mostrarToast('Folio MKT creado exitosamente');
        }
      },
      error: (err) => {
        this.createLoading.set(false);
        this.createError.set(err.error?.message || 'Error al guardar folio');
      },
    });
  }

  // Edición directa en la fila (Dropdown instantáneo)
  actualizarCampoDirecto(folio: FolioMkt, campo: 'nombre' | 'asignado' | 'area', nuevoValor: string): void {
    if (folio[campo] === nuevoValor) return;

    const valorAnterior = folio[campo];
    (folio as any)[campo] = nuevoValor;

    const payload: UpdateFolioMktPayload = {};
    payload[campo] = nuevoValor;

    this.folioService.actualizarFolio(folio.id, payload).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.folios.update((prev) =>
            prev.map((f) => (f.id === folio.id ? res.data : f))
          );
          this.mostrarToast(`Actualizado: ${nuevoValor}`);
        }
      },
      error: () => {
        (folio as any)[campo] = valorAnterior;
        this.mostrarToast('Error al actualizar');
      },
    });
  }

  // Modal para edición completa
  abrirEditarModal(folio: FolioMkt): void {
    this.selectedFolio.set({ ...folio });
    this.editError.set('');
    this.showEditModal.set(true);
  }

  cerrarEditarModal(): void {
    this.showEditModal.set(false);
    this.selectedFolio.set(null);
  }

  guardarEdicionFolio(): void {
    const fol = this.selectedFolio();
    if (!fol) return;

    this.editLoading.set(true);
    this.editError.set('');

    const payload: UpdateFolioMktPayload = {
      nombre: fol.nombre,
      trabajo: fol.trabajo,
      folio: fol.folio,
      fecha: fol.fecha,
      asignado: fol.asignado,
      area: fol.area,
      prioridad: fol.prioridad,
    };

    this.folioService.actualizarFolio(fol.id, payload).subscribe({
      next: (res) => {
        this.editLoading.set(false);
        if (res.success && res.data) {
          this.folios.update((prev) =>
            prev.map((f) => (f.id === fol.id ? res.data : f))
          );
          this.cerrarEditarModal();
          this.mostrarToast('Folio actualizado correctamente');
        }
      },
      error: (err) => {
        this.editLoading.set(false);
        this.editError.set(err.error?.message || 'Error al actualizar folio');
      },
    });
  }

  // Eliminación con confirmación modal
  eliminarFolio(folio: FolioMkt): void {
    this.requestConfirm.emit({
      titulo: 'Eliminar Folio MKT',
      mensaje: `¿Estás seguro de eliminar el folio #${folio.folio || folio.id} (${folio.trabajo})? Esta acción no se puede deshacer.`,
      botonTexto: 'Eliminar Folio',
      botonClase: 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30',
      accion: () => {
        this.folios.update((prev) => prev.filter((f) => f.id !== folio.id));
        this.folioService.eliminarFolio(folio.id).subscribe({
          next: () => {
            this.mostrarToast('Folio eliminado');
          },
          error: () => {
            this.cargarFolios();
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
