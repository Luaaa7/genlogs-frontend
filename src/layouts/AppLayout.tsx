import { Fragment, useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Users,
  Truck,
  Package,
  Wrench,
  Receipt,
  Building2,
  BarChart3,
  UserCog,
  LogOut,
  Sun,
  Moon,
  Search,
} from 'lucide-react';
import logoGenlogs from '../assets/GENLOGS.png';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useTheme } from '@/hooks/useTheme';
import { GlobalSearchDialog } from '@/components/ui/GlobalSearchDialog';
import { cn } from '@/lib/utils/utils';

type NavItem = { label: string; path: string; icon: React.ElementType; soloAdmin?: boolean };
type NavGroup = { titulo: string; items: NavItem[] };

/** Una sola navegación para todo el sistema (antes había un nav superior y
 *  una barra lateral con módulos distintos). Agrupada por tipo de trabajo. */
const NAV_GROUPS: NavGroup[] = [
  {
    titulo: 'Operación',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Cotizaciones', path: '/cotizaciones', icon: FileText },
      { label: 'Órdenes de compra', path: '/ordenes-compra', icon: ShoppingCart },
      { label: 'Facturación', path: '/facturacion', icon: Receipt },
    ],
  },
  {
    titulo: 'Maestros',
    items: [
      { label: 'Clientes', path: '/clientes', icon: Users },
      { label: 'Proveedores', path: '/proveedores', icon: Truck },
      { label: 'Empresas mineras', path: '/empresas-mineras', icon: Building2 },
      { label: 'Repuestos', path: '/catalogo-repuestos', icon: Package },
      { label: 'Servicios', path: '/catalogo-servicios', icon: Wrench },
    ],
  },
  {
    titulo: 'Administración',
    items: [
      { label: 'Reportes', path: '/reportes', icon: BarChart3 },
      { label: 'Usuarios', path: '/usuarios', icon: UserCog, soloAdmin: true },
    ],
  },
];

// Los 4 accesos más usados van fijos en la barra inferior móvil; el resto
// vive detrás del quinto botón, "Menú", que abre el mismo menú lateral.
const BOTTOM_NAV: NavItem[] = [
  NAV_GROUPS[0].items[0],
  NAV_GROUPS[0].items[1],
  NAV_GROUPS[0].items[2],
  NAV_GROUPS[1].items[0],
];

/** Nombre de cada sección y de las subrutas, para la ruta (breadcrumb). */
const SECCIONES: Record<string, string> = Object.fromEntries(
  NAV_GROUPS.flatMap((g) => g.items.map((i) => [i.path.slice(1), i.label]))
);
const SUBRUTAS: Record<string, string> = { nueva: 'Nueva', nuevo: 'Nuevo', editar: 'Editar' };

function estaActivo(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

/** Entrada de los menús desplegables: salen de su botón (esquina superior
 *  derecha), opacidad + scale(0.95→1) en 150ms ease-out. Sin movimiento con
 *  prefers-reduced-motion. */
const MENU_ENTRADA =
  'origin-top-right animate-in fade-in-0 zoom-in-95 duration-150 ease-out motion-reduce:animate-none';

function inicialesDe(nombre: string | null) {
  if (!nombre) return '?';
  const partes = nombre.trim().split(/\s+/);
  const primeras = partes.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '');
  return primeras.join('') || nombre[0]?.toUpperCase() || '?';
}

/** Contenido del menú lateral: se usa igual en la barra fija de escritorio y
 *  en el drawer móvil, para que el estado "seleccionado" sea idéntico. */
function NavLateral({ esAdmin, onNavigate }: { esAdmin: boolean; onNavigate?: () => void }) {
  const { pathname } = useLocation();

  return (
    <nav aria-label="Módulos" className="flex flex-col px-3 pb-6">
      {NAV_GROUPS.map((grupo) => {
        const items = grupo.items.filter((item) => !item.soloAdmin || esAdmin);
        if (items.length === 0) return null;
        return (
          <div key={grupo.titulo}>
            <p className="mx-2.5 mt-5 mb-1.5 text-xs font-medium text-sidebar-muted">{grupo.titulo}</p>
            <ul className="flex flex-col gap-0.5">
              {items.map((item) => {
                const activo = estaActivo(pathname, item.path);
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={onNavigate}
                      aria-current={activo ? 'page' : undefined}
                      className={cn(
                        'flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                        activo
                          ? // Activo a todo lo ancho, con borde claro a la izquierda
                            '-mx-3 rounded-none bg-sidebar-primary px-5.5 text-sidebar-primary-foreground shadow-[inset_4px_0_0_var(--sidebar-ring)]'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      )}
                    >
                      <item.icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

/** Logo en blanco a una tinta: el menú lateral siempre es oscuro. La imagen
 *  trae margen transparente; los márgenes negativos lo recortan. */
function LogoLateral({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      to="/dashboard"
      onClick={onNavigate}
      aria-label="GenLogs, ir al dashboard"
      className="flex h-11 items-center overflow-hidden rounded-md px-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
    >
      <img
        src={logoGenlogs}
        alt=""
        width={192}
        height={80}
        className="-mx-4 h-16 w-auto max-w-none object-contain brightness-0 invert"
      />
    </Link>
  );
}

/** Ruta de la pantalla actual: "Cotizaciones › Detalle", "Repuestos › Nuevo". */
function Breadcrumb() {
  const { pathname } = useLocation();
  const [seccion, ...resto] = pathname.split('/').filter(Boolean);
  const titulo = SECCIONES[seccion];
  if (!titulo) return null;

  const partes = resto.map((s) => SUBRUTAS[s] ?? 'Detalle');
  const actual = partes.length === 0;

  return (
    <nav aria-label="Ruta" className="hidden min-w-0 items-center gap-1.5 text-sm md:flex">
      {actual ? (
        <span aria-current="page" className="font-medium text-foreground">{titulo}</span>
      ) : (
        <Link to={`/${seccion}`} className="rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {titulo}
        </Link>
      )}
      {partes.map((parte, i) => (
        <Fragment key={i}>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span
            aria-current={i === partes.length - 1 ? 'page' : undefined}
            className={i === partes.length - 1 ? 'font-medium text-foreground' : 'text-muted-foreground'}
          >
            {parte}
          </span>
        </Fragment>
      ))}
    </nav>
  );
}

export function AppLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isBusquedaAbierta, setIsBusquedaAbierta] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const nombreUsuario = useAuthStore((s) => s.nombreUsuario);
  const nombreRol = useAuthStore((s) => s.nombreRol);
  const logout = useAuthStore((s) => s.logout);
  const esAdmin = nombreRol?.toUpperCase() === 'ADMINISTRADOR';
  const { tema, alternarTema } = useTheme();

  const closeMenu = () => setIsMenuOpen(false);

  // El "Menú" de la barra inferior cuenta como activo cuando estamos en algo
  // que no vive en los 4 accesos fijos (para que siempre haya un ítem resaltado).
  const isMenuSectionActive = !BOTTOM_NAV.some((item) => estaActivo(location.pathname, item.path));

  // El menú de usuario se abre/cierra con click (no solo hover), para que
  // funcione igual con mouse, teclado y táctil; se cierra al hacer click fuera.
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Bloquea el scroll del body mientras el drawer móvil está abierto.
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Ctrl+K / Cmd+K abre la búsqueda global desde cualquier pantalla.
  useEffect(() => {
    function handleShortcut(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsBusquedaAbierta(true);
      }
    }
    document.addEventListener('keydown', handleShortcut);
    return () => document.removeEventListener('keydown', handleShortcut);
  }, []);

  function handleLogout() {
    // Limpia las dos fuentes de sesión (localStorage que lee axios/ProtectedRoute,
    // y el store de Zustand persistido en sessionStorage) para no dejar rastro.
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    logout();
    setIsUserMenuOpen(false);
    closeMenu();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground antialiased">
      {/* Menú lateral fijo — escritorio (lg+) */}
      <aside className="sticky top-0 hidden h-screen w-62 shrink-0 flex-col overflow-y-auto bg-sidebar pt-4 lg:flex">
        <div className="px-3">
          <LogoLateral />
        </div>
        <NavLateral esAdmin={esAdmin} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barra superior: ruta, búsqueda, tema y usuario */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-card px-4 sm:px-6 lg:px-8">
          {/* En móvil/tablet no hay menú lateral: el logo va aquí */}
          <Link
            to="/dashboard"
            aria-label="GenLogs, ir al dashboard"
            className="flex h-10 shrink-0 items-center overflow-hidden rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
          >
            <img src={logoGenlogs} alt="" width={192} height={80} className="-mx-3 h-14 w-auto max-w-none object-contain dark:brightness-0 dark:invert" />
          </Link>

          <Breadcrumb />

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            {/* Búsqueda global — parece un campo, abre el diálogo (Ctrl+K) */}
            <button
              type="button"
              onClick={() => setIsBusquedaAbierta(true)}
              aria-label="Buscar (Ctrl+K)"
              className="flex h-10 items-center gap-2 whitespace-nowrap rounded-lg px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:w-72 md:border md:border-border md:bg-background"
            >
              <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="hidden min-w-0 truncate md:inline">Buscar cotizaciones, clientes…</span>
              <kbd className="ml-auto hidden shrink-0 whitespace-nowrap rounded border border-border px-1.5 font-sans text-[11px] leading-4 text-muted-foreground md:inline">Ctrl K</kbd>
            </button>

            <button
              type="button"
              onClick={alternarTema}
              aria-label={tema === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {tema === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            {/* Menú de usuario — la única forma de cerrar sesión en escritorio */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((v) => !v)}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="menu"
                aria-label="Menú de usuario"
                className="flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {inicialesDe(nombreUsuario)}
                </span>
                <span className="hidden max-w-36 flex-col items-start leading-tight xl:flex">
                  <span className="w-full truncate text-left text-sm font-medium text-foreground">{nombreUsuario ?? 'Usuario'}</span>
                  <span className="w-full truncate text-left text-xs capitalize text-muted-foreground">{nombreRol?.toLowerCase() ?? ''}</span>
                </span>
                <ChevronDown className={cn('hidden h-4 w-4 text-muted-foreground transition-transform sm:block', isUserMenuOpen && 'rotate-180')} aria-hidden="true" />
              </button>

              {isUserMenuOpen && (
                <div
                  role="menu"
                  className={cn('absolute right-0 z-50 mt-2 w-56 rounded-xl border border-border bg-card py-1 shadow-lg shadow-black/5', MENU_ENTRADA)}
                >
                  <div className="border-b border-border px-3 py-2.5">
                    <p className="truncate text-sm font-medium text-foreground">{nombreUsuario ?? 'Usuario'}</p>
                    <p className="truncate text-xs capitalize text-muted-foreground">{nombreRol?.toLowerCase() ?? ''}</p>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Contenido principal — espacio abajo en móvil para la barra inferior */}
        <main className="mx-auto w-full min-w-0 max-w-7xl flex-1 p-4 pb-24 sm:p-6 lg:p-8 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Drawer "Menú" — móvil/tablet: el mismo menú lateral, desde la barra inferior */}
      {isMenuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 animate-in fade-in-0 duration-200 motion-reduce:animate-none lg:hidden" onClick={closeMenu} aria-hidden="true" />
          <aside
            className="fixed inset-y-0 left-0 z-50 flex w-[85vw] max-w-72 flex-col overflow-y-auto bg-sidebar pt-4 shadow-2xl animate-in slide-in-from-left duration-200 ease-out motion-reduce:animate-none lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menú de módulos"
          >
            <div className="flex items-center justify-between px-3">
              <LogoLateral onNavigate={closeMenu} />
              <button
                type="button"
                onClick={closeMenu}
                aria-label="Cerrar menú"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-sidebar-foreground hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLateral esAdmin={esAdmin} onNavigate={closeMenu} />
            <div className="mt-auto border-t border-sidebar-border p-3">
              <button
                type="button"
                onClick={handleLogout}
                className="flex h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              >
                <LogOut className="h-4.5 w-4.5" aria-hidden="true" />
                Cerrar sesión
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Barra de navegación inferior — solo móvil/tablet (hasta lg) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Navegación principal"
      >
        <div className="grid grid-cols-5">
          {BOTTOM_NAV.map((item) => {
            const activo = estaActivo(location.pathname, item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={activo ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                  activo ? 'text-accent' : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-5 w-5" strokeWidth={activo ? 2.5 : 2} aria-hidden="true" />
                <span className="max-w-[4.5rem] truncate">{item.label.split(' ')[0]}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            aria-expanded={isMenuOpen}
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
              isMenuOpen || isMenuSectionActive ? 'text-accent' : 'text-muted-foreground'
            )}
          >
            <Menu className="h-5 w-5" strokeWidth={isMenuOpen || isMenuSectionActive ? 2.5 : 2} aria-hidden="true" />
            <span>Menú</span>
          </button>
        </div>
      </nav>

      <GlobalSearchDialog open={isBusquedaAbierta} onClose={() => setIsBusquedaAbierta(false)} />
    </div>
  );
}
