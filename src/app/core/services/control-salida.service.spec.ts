import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ControlSalidaService, ControlSalida } from './control-salida.service';

describe('ControlSalidaService', () => {
  let service: ControlSalidaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ControlSalidaService],
    });
    service = TestBed.inject(ControlSalidaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe obtener la lista de controles de salida', () => {
    const dummySalidas: ControlSalida[] = [
      {
        id: 1,
        idUser: 1,
        Fecha: '2026-11-05',
        Lugar: 'Oficina Central',
        FechaEntrada: '2026-11-05 09:00:00',
        FechaSalida: '2026-11-05 18:00:00',
        Revisado: false,
        Comentarios: 'Salida a soporte técnico',
      },
    ];

    service.getSalidas().subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.data.length).toBe(1);
      expect(res.data[0].Lugar).toBe('Oficina Central');
    });

    const req = httpMock.expectOne('http://localhost:8001/api/v1/control-salidas');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: dummySalidas });
  });

  it('debe registrar un nuevo control de salida', () => {
    const nuevoRegistro = {
      Fecha: '2026-11-05',
      Lugar: 'Planta de Producción',
      FechaEntrada: '2026-11-05 08:30:00',
      FechaSalida: '2026-11-05 17:30:00',
      Comentarios: 'Instalación de red',
    };

    service.createSalida(nuevoRegistro).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.data.id).toBe(10);
      expect(res.data.Lugar).toBe('Planta de Producción');
    });

    const req = httpMock.expectOne('http://localhost:8001/api/v1/control-salidas');
    expect(req.request.method).toBe('POST');
    req.flush({
      success: true,
      message: 'Registro de salida guardado exitosamente',
      data: { id: 10, idUser: 1, ...nuevoRegistro, Revisado: false },
    });
  });

  it('debe alternar el estado revisado (toggle)', () => {
    service.toggleRevisado(10).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.data.Revisado).toBe(true);
    });

    const req = httpMock.expectOne('http://localhost:8001/api/v1/control-salidas/10/toggle-revisado');
    expect(req.request.method).toBe('PATCH');
    req.flush({
      success: true,
      message: 'Estado de revisión actualizado',
      data: {
        id: 10,
        idUser: 1,
        Fecha: '2026-11-05',
        Lugar: 'Oficina Central',
        FechaEntrada: '2026-11-05 09:00:00',
        FechaSalida: '2026-11-05 18:00:00',
        Revisado: true,
        Comentarios: '',
      },
    });
  });
});
