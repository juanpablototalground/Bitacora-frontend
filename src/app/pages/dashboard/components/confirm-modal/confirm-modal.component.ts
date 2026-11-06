import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div class="relative w-full max-w-md rounded-2xl border border-slate-700/80 bg-[#111722] p-6 sm:p-7 shadow-[0_0_60px_rgba(0,0,0,0.85)]">
          <div class="flex items-start gap-4">
            <div class="h-11 w-11 flex-shrink-0 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 text-xl font-bold">
              !
            </div>
            <div>
              <h3 class="text-base font-bold text-white tracking-wide">{{ title() }}</h3>
              <p class="mt-2 text-xs text-slate-300 leading-relaxed">{{ message() }}</p>
            </div>
          </div>

          <div class="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              (click)="onCancel()"
              class="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              (click)="onConfirm()"
              class="rounded-xl px-5 py-2 text-xs font-bold transition active:scale-95 cursor-pointer {{ buttonClass() }}"
            >
              {{ buttonText() }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmModalComponent {
  isOpen = input<boolean>(false);
  title = input<string>('Confirmación');
  message = input<string>('¿Estás seguro de realizar esta acción?');
  buttonText = input<string>('Confirmar');
  buttonClass = input<string>('bg-red-600 hover:bg-red-500 text-white shadow-red-600/30');

  confirmed = output<void>();
  cancelled = output<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}

