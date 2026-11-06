import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReporteService, Reporte } from './reporte.service';

describe('ReporteService', () => {
  let service: ReporteService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReporteService],
    });
    service = TestBed.inject(ReporteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe obtener la lista de reportes diarios', () => {
    const dummyReportes: Reporte[] = [
      {
        idReportes: 1,
        idUser: 1,
        trabajo: 'Mantenimiento preventivo de servidores',
        fechaInicio: '2026-11-05',
        fechaTermino: '2026-11-05',
        revisado: false,
        observaciones: 'Sin novedades',
        comentarios: 'Todo completado en orden',
      },
    ];

    service.getReportes().subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.data.length).toBe(1);
      expect(res.data[0].trabajo).toContain('Mantenimiento');
    });

    const req = httpMock.expectOne('http://localhost:8001/api/v1/reportes');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: dummyReportes, isAdmin: false });
  });

  it('debe registrar un nuevo reporte diario', () => {
    const nuevoReporte = {
      trabajo: 'Revisión de backups de base de datos',
      fechaInicio: '2026-11-05',
      fechaTermino: '2026-11-05',
      observaciones: 'Ninguna',
      comentarios: 'Copia completada con éxito',
    };

    service.createReporte(nuevoReporte).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.data.idReportes).toBe(5);
      expect(res.data.trabajo).toBe('Revisión de backups de base de datos');
    });

    const req = httpMock.expectOne('http://localhost:8001/api/v1/reportes');
    expect(req.request.method).toBe('POST');
    req.flush({
      success: true,
      message: 'Reporte registrado exitosamente',
      data: { idReportes: 5, idUser: 1, ...nuevoReporte, revisado: false },
    });
  });

  it('debe alternar el estado revisado de un reporte', () => {
    service.toggleRevisado(5).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.data.revisado).toBe(true);
    });

    const req = httpMock.expectOne('http://localhost:8001/api/v1/reportes/5/toggle-revisado');
    expect(req.request.method).toBe('PATCH');
    req.flush({
      success: true,
      message: 'Estado de revisión actualizado',
      data: {
        idReportes: 5,
        idUser: 1,
        trabajo: 'Mantenimiento preventivo',
        fechaInicio: '2026-11-05',
        fechaTermino: '2026-11-05',
        revisado: true,
        observaciones: '',
        comentarios: '',
      },
    });
  });
});
