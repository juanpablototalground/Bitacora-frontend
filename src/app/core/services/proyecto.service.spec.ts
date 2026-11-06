import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProyectoService, Proyecto } from './proyecto.service';

describe('ProyectoService (Proyectos IT)', () => {
  let service: ProyectoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProyectoService],
    });
    service = TestBed.inject(ProyectoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe listar los proyectos IT', () => {
    const dummyProyectos: Proyecto[] = [
      {
        idProyectos: 1,
        Nombreproyecto: 'Migración a Angular 19',
        descripcion: 'Actualizar las librerías frontend',
        estadoProyecto: 'Pendiente',
        enlaceRepositorio: 'https://github.com/empresa/proyecto',
        observaciones: 'En revisión de dependencias',
      },
    ];

    service.getProyectos().subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.data.length).toBe(1);
      expect(res.data[0].Nombreproyecto).toBe('Migración a Angular 19');
    });

    const req = httpMock.expectOne('http://localhost:8001/api/v1/proyectos');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: dummyProyectos });
  });

  it('debe crear un nuevo proyecto IT', () => {
    const nuevoProyecto = {
      Nombreproyecto: 'Implementación de VPN WireGuard',
      descripcion: 'Configurar túneles seguros para usuarios remotos',
      estadoProyecto: 'Pendiente',
      enlaceRepositorio: 'https://github.com/empresa/vpn',
      observaciones: 'Fase de prueba con 5 usuarios',
    };

    service.crearProyecto(nuevoProyecto).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.data.idProyectos).toBe(3);
      expect(res.data.Nombreproyecto).toBe('Implementación de VPN WireGuard');
    });

    const req = httpMock.expectOne('http://localhost:8001/api/v1/proyectos');
    expect(req.request.method).toBe('POST');
    req.flush({
      success: true,
      message: 'Proyecto creado exitosamente',
      data: { idProyectos: 3, ...nuevoProyecto },
    });
  });

  it('debe actualizar el estado de un proyecto IT', () => {
    service.actualizarProyecto(3, { estadoProyecto: 'Completado' }).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.data.estadoProyecto).toBe('Completado');
    });

    const req = httpMock.expectOne('http://localhost:8001/api/v1/proyectos/3');
    expect(req.request.method).toBe('PUT');
    req.flush({
      success: true,
      message: 'Proyecto actualizado exitosamente',
      data: {
        idProyectos: 3,
        Nombreproyecto: 'Implementación de VPN WireGuard',
        descripcion: 'Configurar túneles seguros',
        estadoProyecto: 'Completado',
        enlaceRepositorio: 'https://github.com/empresa/vpn',
      },
    });
  });
});

