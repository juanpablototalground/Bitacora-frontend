import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService, CreateUsuarioPayload, UpdateUsuarioPayload } from '../../../../core/services/usuario.service';
import { User } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-personal-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './personal-tab.component.html',
  styleUrls: ['./personal-tab.component.css'],
})
export class PersonalTabComponent implements OnInit {
  private usuarioService = inject(UsuarioService);

  usuarios = signal<User[]>([]);
  loading = signal<boolean>(false);
  searchTerm = signal<string>('');
  filtroEstado = signal<'todos' | 'activos' | 'inactivos'>('todos');

  // Modal para ver detalle / editar
  showDetailModal = signal<boolean>(false);
  selectedUser = signal<User | null>(null);

  // Modal para crear nuevo empleado
  showCreateModal = signal<boolean>(false);

  // Formulario nuevo empleado
  newEmployee: CreateUsuarioPayload = {
    nombre: '',
    correo: '',
    contrasena: '',
    area: 'Sistemas / TI',
    isAdmin: false,
  };
  createLoading = signal<boolean>(false);
  createError = signal<string>('');

  // Formulario edición empleado
  editEmployee: UpdateUsuarioPayload = {};
  editPassword = signal<string>('');
  editLoading = signal<boolean>(false);
  editError = signal<string>('');
  editSuccess = signal<string>('');

  // Notificaciones rápidas
  toastMessage = signal<string>('');

  // Drag and Drop de tarjetas
  draggedIndex = signal<number | null>(null);
  dragOverIndex = signal<number | null>(null);

  // Opciones de áreas predefinidas
  areasPredefinidas: string[] = [
    'Sistemas / TI',
    'Diseño Gráfico',
    'Audiovisuales',
    'Marketing',
    'Ingeniería',
    'Administración',
  ];

  // Métricas
  totalPersonal = computed(() => this.usuarios().length);
  personalActivo = computed(() => this.usuarios().filter((u) => u.activo !== false).length);
  personalInactivo = computed(() => this.usuarios().filter((u) => u.activo === false).length);

  // Lista filtrada
  filteredUsuarios = computed(() => {
    let list = this.usuarios();
    const term = this.searchTerm().toLowerCase().trim();
    const estado = this.filtroEstado();

    if (estado === 'activos') {
      list = list.filter((u) => u.activo !== false);
    } else if (estado === 'inactivos') {
      list = list.filter((u) => u.activo === false);
    }

    if (!term) return list;

    return list.filter(
      (u) =>
        u.nombre.toLowerCase().includes(term) ||
        u.correo.toLowerCase().includes(term) ||
        u.area.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.loading.set(true);
    this.usuarioService.getUsuarios().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const ordenGuardado = localStorage.getItem('personal_cards_order');
          if (ordenGuardado) {
            try {
              const ids: number[] = JSON.parse(ordenGuardado);
              const map = new Map<number, User>(res.data.map((u) => [u.id, u]));
              const ordenados: User[] = [];
              ids.forEach((id) => {
                const u = map.get(id);
                if (u) {
                  ordenados.push(u);
                  map.delete(id);
                }
              });
              // Agregar los que falten
              map.forEach((u) => ordenados.push(u));
              this.usuarios.set(ordenados);
            } catch {
              this.usuarios.set(res.data);
            }
          } else {
            this.usuarios.set(res.data);
          }
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  // Métodos de arrastrar y soltar (Drag and Drop interactivo)
  onDragStart(event: DragEvent, index: number): void {
    this.draggedIndex.set(index);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', index.toString());
    }
  }

  onDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    if (this.dragOverIndex() !== index) {
      this.dragOverIndex.set(index);
    }
  }

  onDragLeave(index: number): void {
    if (this.dragOverIndex() === index) {
      this.dragOverIndex.set(null);
    }
  }

  onDrop(event: DragEvent, targetIndex: number): void {
    event.preventDefault();
    const sourceIndex = this.draggedIndex();
    this.draggedIndex.set(null);
    this.dragOverIndex.set(null);

    if (sourceIndex === null || sourceIndex === targetIndex) return;

    const currentFiltered = [...this.filteredUsuarios()];
    const [movedUser] = currentFiltered.splice(sourceIndex, 1);
    currentFiltered.splice(targetIndex, 0, movedUser);

    // Si no hay filtros aplicados, actualizamos directamente la lista principal
    if (!this.searchTerm().trim() && this.filtroEstado() === 'todos') {
      this.usuarios.set(currentFiltered);
      const ids = currentFiltered.map((u) => u.id);
      localStorage.setItem('personal_cards_order', JSON.stringify(ids));
      this.mostrarToast(`Posición actualizada: ${movedUser.nombre}`);
    } else {
      // Reordenar en la lista completa para reflejar el cambio
      const fullList = [...this.usuarios()];
      const fromFull = fullList.findIndex((u) => u.id === movedUser.id);
      const targetUser = this.filteredUsuarios()[targetIndex];
      const toFull = fullList.findIndex((u) => u.id === targetUser.id);

      if (fromFull !== -1 && toFull !== -1) {
        const [item] = fullList.splice(fromFull, 1);
        fullList.splice(toFull, 0, item);
        this.usuarios.set(fullList);
        const ids = fullList.map((u) => u.id);
        localStorage.setItem('personal_cards_order', JSON.stringify(ids));
        this.mostrarToast(`Posición actualizada: ${movedUser.nombre}`);
      }
    }
  }

  onDragEnd(): void {
    this.draggedIndex.set(null);
    this.dragOverIndex.set(null);
  }

  abrirCrearModal(): void {
    this.newEmployee = {
      nombre: '',
      correo: '',
      contrasena: '',
      area: 'Sistemas / TI',
      isAdmin: false,
    };
    this.createError.set('');
    this.showCreateModal.set(true);
  }

  cerrarCrearModal(): void {
    this.showCreateModal.set(false);
  }

  guardarNuevoEmpleado(): void {
    if (!this.newEmployee.nombre.trim() || !this.newEmployee.correo.trim() || !this.newEmployee.contrasena) {
      this.createError.set('Por favor completa todos los campos obligatorios.');
      return;
    }

    this.createLoading.set(true);
    this.createError.set('');

    this.usuarioService.crearUsuario(this.newEmployee).subscribe({
      next: (res) => {
        this.createLoading.set(false);
        if (res.success && res.data) {
          this.usuarios.update((prev) => [res.data, ...prev]);
          this.cerrarCrearModal();
          this.mostrarToast('Empleado registrado exitosamente');
        }
      },
      error: (err) => {
        this.createLoading.set(false);
        const msg = err.error?.message || err.error?.errors?.correo?.[0] || 'Error al registrar empleado';
        this.createError.set(msg);
      },
    });
  }

  abrirDetalle(user: User): void {
    this.selectedUser.set(user);
    this.editEmployee = {
      nombre: user.nombre,
      correo: user.correo,
      area: user.area,
      isAdmin: !!user.isAdmin,
      activo: user.activo !== false,
    };
    this.editPassword.set('');
    this.editError.set('');
    this.editSuccess.set('');
    this.showDetailModal.set(true);
  }

  cerrarDetalleModal(): void {
    this.showDetailModal.set(false);
    this.selectedUser.set(null);
  }

  guardarCambiosEmpleado(): void {
    const user = this.selectedUser();
    if (!user) return;

    this.editLoading.set(true);
    this.editError.set('');
    this.editSuccess.set('');

    const payload: UpdateUsuarioPayload = {
      nombre: this.editEmployee.nombre,
      correo: this.editEmployee.correo,
      area: this.editEmployee.area,
      isAdmin: this.editEmployee.isAdmin,
    };

    if (this.editPassword().trim()) {
      payload.contrasena = this.editPassword().trim();
    }

    this.usuarioService.actualizarUsuario(user.id, payload).subscribe({
      next: (res) => {
        this.editLoading.set(false);
        if (res.success && res.data) {
          this.usuarios.update((prev) =>
            prev.map((u) => (u.id === user.id ? res.data : u))
          );
          this.selectedUser.set(res.data);
          this.editSuccess.set('Datos actualizados correctamente');
          this.mostrarToast('Empleado actualizado exitosamente');
        }
      },
      error: (err) => {
        this.editLoading.set(false);
        const msg = err.error?.message || 'Error al actualizar empleado';
        this.editError.set(msg);
      },
    });
  }

  darDeBajaEmpleado(): void {
    const user = this.selectedUser();
    if (!user) return;

    this.editLoading.set(true);
    this.usuarioService.darDeBaja(user.id).subscribe({
      next: (res) => {
        this.editLoading.set(false);
        if (res.success && res.data) {
          this.usuarios.update((prev) =>
            prev.map((u) => (u.id === user.id ? res.data : u))
          );
          this.selectedUser.set(res.data);
          this.editEmployee.activo = false;
          this.mostrarToast('Empleado dado de baja exitosamente');
        }
      },
      error: (err) => {
        this.editLoading.set(false);
        this.editError.set(err.error?.message || 'Error al dar de baja');
      },
    });
  }

  toggleActivoEmpleado(): void {
    const user = this.selectedUser();
    if (!user) return;

    this.editLoading.set(true);
    this.usuarioService.toggleActivo(user.id).subscribe({
      next: (res) => {
        this.editLoading.set(false);
        if (res.success && res.data) {
          this.usuarios.update((prev) =>
            prev.map((u) => (u.id === user.id ? res.data : u))
          );
          this.selectedUser.set(res.data);
          this.editEmployee.activo = res.data.activo !== false;
          const msg = res.data.activo ? 'Empleado reactivado con éxito' : 'Empleado dado de baja';
          this.mostrarToast(msg);
        }
      },
      error: (err) => {
        this.editLoading.set(false);
        this.editError.set(err.error?.message || 'Error al cambiar estado');
      },
    });
  }

  mostrarToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set('');
    }, 3500);
  }
}
