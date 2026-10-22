# GENLOGS S.A.C. — Frontend

> **Sistema de gestión comercial para GENLOGS S.A.C.**  
> Frontend desarrollado en **React 19 + TypeScript + Vite**, consumiendo una API REST (Spring Boot) desplegada en Render.

---

## 📋 Tabla de contenidos

1. [Presentación del proyecto](#-presentación-del-proyecto)
2. [Funcionalidades y módulos](#-funcionalidades-y-módulos)
3. [Arquitectura del sistema](#-arquitectura-del-sistema)
4. [Tecnologías y dependencias](#-tecnologías-y-dependencias)
5. [Base de datos (modelo lógico)](#-base-de-datos-modelo-lógico)
6. [Integraciones y servicios externos](#-integraciones-y-servicios-externos)
7. [Requisitos previos](#-requisitos-previos)
8. [Instalación y ejecución local](#-instalación-y-ejecución-local)
9. [Variables de entorno y configuración](#-variables-de-entorno-y-configuración)
10. [API y endpoints](#-api-y-endpoints)
11. [Seguridad y permisos](#-seguridad-y-permisos)
12. [Pruebas y calidad](#-pruebas-y-calidad)
13. [Despliegue](#-despliegue)
14. [Estructura del repositorio](#-estructura-del-repositorio)
15. [Limitaciones y mejoras pendientes](#-limitaciones-y-mejoras-pendientes)
16. [Contribución y mantenimiento](#-contribución-y-mantenimiento)
---

## 🎯 Presentación del proyecto

| Aspecto | Detalle |
|---------|---------|
| **Nombre** | GENLOGS S.A.C. — Frontend |
| **Organización** | GENLOGS S.A.C. |
| **Tipo** | SPA (Single Page Application) administrativa |
| **Backend** | Spring Boot (Java) — API REST en `https://genlogs-backend-bkuv.onrender.com/api` |
| **Despliegue frontend** | Vite + Vercel/Netlify (configurable) |
| **Autenticación** | JWT (access + refresh token) almacenado en `localStorage`/`sessionStorage` |

### Problema que resuelve
Centralizar la operación comercial de GENLOGS S.A.C.: cotizaciones, órdenes de compra, facturación, catálogos de repuestos/servicios, gestión de clientes/proveedores y reportes ejecutivos, reemplazando planillas dispersas por un sistema trazable, con roles y auditoría.

### Objetivos principales
- **Trazabilidad** completa desde cotización → orden de compra → factura.
- **Autocompletado** de datos fiscales (RUC/DNI) vía proveedor externo (Factiliza).
- **Dashboard** operativo con KPIs en tiempo real.
- **Reportes** descargables (PDF/Excel) con vista previa.
- **Catálogos** de repuestos y servicios con imágenes, documentos y características técnicas.

### Alcance funcional
| Área | Cobertura |
|------|-----------|
| Cotizaciones | CRUD, estados, duplicado, envío por email, PDF, adjuntos, estadísticas |
| Órdenes de compra | Listado, filtros por estado, vínculo a cotización, documento adjunto |
| Facturación | Listado, estados, envío a SUNAT (delegado al backend), PDF |
| Clientes/Proveedores | CRUD, autocompletado RUC/DNI, contactos, distritos, sectores económicos |
| Empresas mineras | CRUD, minerales asociados, geolocalización |
| Repuestos | Catálogo con imágenes, fichas técnicas, documentos, categorías, marcas |
| Servicios | Catálogo con categorías, unidades de medida |
| Reportes | 5 tipos, PDF/Excel, vista previa, rangos de fecha rápidos |
| Dashboard | KPIs, gráficos, cotizaciones vs facturadas, mejores clientes, alertas |
| Administración | Usuarios (solo admin), roles, sectores económicos, unidades de medida, categorías |

### Tipos de usuarios
| Rol | Permisos clave |
|-----|----------------|
| **ADMINISTRADOR** | Acceso total + gestión de usuarios |
| **VENDEDOR / OPERATIVO** | Cotizaciones, órdenes, clientes, catálogos, dashboard |
| **ADMINISTRATIVO** | Facturación, reportes, catálogos de solo lectura |

---

## 🧩 Funcionalidades y módulos

### 1. Dashboard (`/dashboard`)
- **KPIs**: cotizaciones pendientes, órdenes en proceso, facturación mensual, variación vs mes anterior.
- **Gráficos**: cotizaciones por mes (barras), actividad diaria (línea), cotizado vs facturado (combinado), estados de cotización (donut).
- **Alertas**: cotizaciones por vencer, facturas vencidas, órdenes sin atención.
- **Mejores clientes** (top 5 por facturación).
- **Actualización manual** (`RefreshCw`) y skeleton loaders.

### 2. Cotizaciones (`/cotizaciones`, `/cotizaciones/nueva`, `/cotizaciones/:id`)
| Función | Detalle |
|---------|---------|
| **Listado** | Paginado, filtros por estado/moneda/cliente, ordenación (`fechaCotizacion` DESC), tabs por estado |
| **Creación** | Formulario reactivo (RHF + Zod), autocompletado cliente (RUC/DNI), ítems (producto/servicio), margen, IGV automático |
| **Detalle** | Timeline de seguimiento, adjuntos (Cloudinary), duplicar, cambiar estado, enviar email, descargar PDF |
| **Estados** | `BORRADOR → ENVIADA → EN_NEGOCIACION → APROBADA/RECHAZADA/VENCIDA/ANULADA` |
| **Estadísticas** | Endpoint `/cotizaciones/estadisticas` para dashboard |

### 3. Órdenes de compra (`/ordenes-compra`)
- Listado paginado, filtro por estado (`RECIBIDA`, `EN_ATENCION`, `ATENDIDA`, `ANULADA`).
- Vínculo a cotización origen, total en moneda original, descarga de archivo adjunto.

### 4. Facturación (`/facturacion`)
- Listado con filtros por tipo comprobante y estado.
- Envío a SUNAT (delegado al backend), anulación, descarga PDF.
- Totales, IGV, saldo pendiente.

### 5. Clientes (`/clientes`, `/clientes/:id`)
| Función | Detalle |
|---------|---------|
| **Listado** | Búsqueda por documento/razón social, paginación, tabla con acciones |
| **Creación/Edición** | Panel lateral, autocompletado RUC/DNI (Factiliza), selector de distrito (catálogo), sector económico |
| **Contactos** | CRUD embebido en detalle de cliente |
| **Empresas mineras** | Relación 1:N, CRUD propio en `/empresas-mineras` |

### 6. Proveedores (`/proveedores`)
- Mismo patrón que Clientes (RUC obligatorio, autocompletado SUNAT).

### 7. Empresas mineras (`/empresas-mineras`)
- CRUD con minerales asociados (muchos a muchos), geolocalización (lat/long/altitud), capacidad de producción.

### 8. Catálogo Repuestos (`/catalogo-repuestos`)
| Función | Detalle |
|---------|---------|
| **Grid responsive** | 2/3/4/6 columnas según breakpoint |
| **Filtros** | Búsqueda nombre/código, categoría (selector jerárquico), marca |
| **Ordenación** | Por `codigoProducto` ASC (global, no por página) |
| **Tarjeta** | Imagen principal, código, nombre, marca, categoría, badges (Inactivo/Oculto) |
| **CRUD** | Nuevo/Editar con imágenes (Cloudinary), documentos, características técnicas, categorías, marcas, unidades de medida |

### 9. Catálogo Servicios (`/catalogo-servicios`)
- Mismo patrón que repuestos (sin imágenes), categorías y unidades de medida.

### 10. Reportes (`/reportes`)
| Tipo | Descripción |
|-------|-------------|
| `COTIZACIONES` | Listado con totales, estados, montos |
| `ORDENES_COMPRA` | Órdenes por periodo, totales por cliente |
| `FACTURACION` | Comprobantes emitidos, IGV, totales |
| `SERVICIOS` | Servicios facturados por periodo |
| `PRODUCTOS` | Productos vendidos, stock, márgenes |
| **Formatos** | PDF / Excel (`.xlsx`) |
| **Vista previa** | Tabla paginada con datos reales antes de descargar |
| **Rangos rápidos** | Últimos 30 días, mes actual, trimestre, año |

### 11. Usuarios (`/usuarios` — solo ADMIN)
- Listado, creación, edición, roles (`ADMINISTRADOR`, `VENDEDOR`, `ADMINISTRATIVO`).
---

## 🏗️ Arquitectura del sistema

```mermaid
graph TD
    Browser[Navegador] --> Vite[Vite Dev Server / Build]
    Vite --> React[React 19 SPA]
    React --> Router[React Router v7]
    Router --> Layouts[AppLayout + AuthLayout]
    Layouts --> Pages[Feature Pages]
    Pages --> Hooks[Custom Hooks + TanStack Query]
    Hooks --> API[API Layer (axios)]
    API --> Backend[(Backend Spring Boot :443/api)]
    Backend --> DB[(PostgreSQL)]
    Backend --> External[Factiliza / Cloudinary / SUNAT]
```

### Separación de responsabilidades
| Capa | Responsabilidad | Ubicación |
|------|----------------|-----------|
| **Presentación** | Componentes UI, páginas, formularios | `src/features/*/components`, `src/features/*/pages` |
| **Estado servidor** | TanStack Query (caché, invalidación, prefetch) | `src/hooks/use*.ts`, `src/features/*/hooks` |
| **Estado cliente** | Zustand (auth), React Hook Form (formularios) | `src/features/auth/store`, `src/lib/validators` |
| **Comunicación** | Axios interceptors (JWT, refresh, 401/403) | `src/api/axiosClient.ts` |
| **Tipado** | Contratos compartidos frontend/backend | `src/types/*.types.ts` |
| **Estilos** | Tailwind CSS v4 + shadcn/ui + Radix + Lucide | `src/components/ui`, `vite.config.ts` |

### Flujo de datos típico (ej. listar cotizaciones)
```
CotizacionesListPage
  → useCotizaciones(filtros)  [TanStack Query]
    → cotizacionesApi.listarCotizaciones(filtros)
      → axiosClient.get('/cotizaciones', { params })
        → Interceptor añade Authorization: Bearer <token>
        → Backend Spring Boot
          → JPA Repository → PostgreSQL
          → Respuesta JSON → TanStack Query cache → UI
```

---

## 🛠️ Tecnologías y dependencias

| Categoría | Tecnología | Versión | Propósito |
|-----------|------------|---------|-----------|
| **Core** | React | 19.3.0 | UI declarativa |
| | TypeScript | ~6.0.2 | Tipado estático |
| | Vite | 8.3.0 | Bundler + HMR |
| **Routing** | React Router DOM | 7.18.4 | SPA routing, loaders, guards |
| **Estado servidor** | TanStack Query | 5.104.0 | Caché, dedup, invalidación |
| **Estado cliente** | Zustand | 5.0.15 | Auth store (sessionStorage) |
| **Formularios** | React Hook Form | 7.89.0 | Validación, control |
| | Zod | 4.6.5 | Esquemas de validación |
| | @hookform/resolvers | 5.9.1 | Puente RHF ↔ Zod |
| **UI** | Tailwind CSS | 4.3.3 | Utility-first CSS |
| | @base-ui/react | 1.8.0 | Primitivas accesibles |
| | @radix-ui/react-slot | 1.3.3 | Composition primitiva |
| | lucide-react | 1.48.0 | Iconografía |
| | recharts | 3.10.1 | Gráficos dashboard |
| | react-leaflet | 5.0.0 | Mapas (empresas mineras) |
| **HTTP** | Axios | 1.20.0 | Cliente HTTP + interceptors |
| **Utilidades** | clsx / tailwind-merge / cn | - | Classnames condicionales |
| | use-debounce | 10.1.1 | Debounce hooks |
| **Calidad** | ESLint | 10.10.0 | Linting |
| | TypeScript ESLint | 8.69.0 | Type-aware linting |
| | React Compiler | - | Optimizaciones (parcial) |

> **Nota**: `shadcn` (4.21.0) aparece en `package.json` pero no se usa directamente; los componentes UI propios (`src/components/ui`) siguen el patrón shadcn.