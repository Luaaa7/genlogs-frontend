import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Users,
  Truck,
  Package,
  Receipt,
  Building2,
  BarChart3,
  UserCog,
  LogOut,
} from 'lucide-react';
import logoGenlogs from '../assets/GENLOGS.png';
import { useAuthStore } from '@/features/auth/store/authStore';

type NavItem = { label: string; path: string; icon: React.ElementType };

const mainNavItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Cotizaciones', path: '/cotizaciones', icon: FileText },
  { label: 'Órdenes de compra', path: '/ordenes-compra', icon: ShoppingCart },
  { label: 'Clientes', path: '/clientes', icon: Users },
  { label: 'Proveedores', path: '/proveedores', icon: Truck },
];

const secondaryNavItems: NavItem[] = [
  { label: 'Facturación', path: '/facturacion', icon: Receipt },
  { label: 'Empresas mineras', path: '/empresas-mineras', icon: Building2 },
  { label: 'Reportes', path: '/reportes', icon: BarChart3 },
  { label: 'Usuarios', path: '/usuarios', icon: UserCog },
];

const catalogoSubItems: NavItem[] = [
  { label: 'Repuestos', path: '/catalogo-repuestos', icon: Package },
  { label: 'Servicios', path: '/catalogo-servicios', icon: Package },
];

/** Clase única para todo item de navegación activo/inactivo — nunca se
 *  redefine por pantalla, para que el estado "seleccionado" se vea y se
 *  comporte igual en el drawer móvil, el nav de escritorio y el dropdown. */
function navLinkClass(isActive: boolean, dense = false) {
  const base = `flex items-center gap-2.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
    dense ? 'px-3 py-1.5' : 'px-3 py-2'
  }`;
  return isActive
    ? `${base} bg-accent text-accent-foreground font-semibold`
    : `${base} text-muted-foreground hover:bg-muted hover:text-foreground`;
}

function inicialesDe(nombre: string | null) {
  if (!nombre) return '?';
  const partes = nombre.trim().split(/\s+/);
  const primeras = partes.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '');
  return primeras.join('') || nombre[0]?.toUpperCase() || '?';
}

export function AppLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCatalogoOpen, setIsCatalogoOpen] = useState(false);
  const [isMobileCatalogoOpen, setIsMobileCatalogoOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const catalogoRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const nombreUsuario = useAuthStore((s) => s.nombreUsuario);
  const nombreRol = useAuthStore((s) => s.nombreRol);
  const logout = useAuthStore((s) => s.logout);

  const toggleMenu = () => setIsMenuOpen((v) => !v);
  const closeMenu = () => setIsMenuOpen(false);

  const isCatalogoActive =
    location.pathname.startsWith('/catalogo-repuestos') ||
    location.pathname.startsWith('/catalogo-servicios');

  // El dropdown de Catálogo y el menú de usuario se abren/cierran con click
  // (no solo hover), para que funcionen igual con mouse, teclado y táctil.
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (catalogoRef.current && !catalogoRef.current.contains(e.target as Node)) {
        setIsCatalogoOpen(false);
      }
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
    <div className="min-h-screen bg-background flex flex-col font-sans antialiased text-foreground">
      {/* Navbar superior */}
      <header className="bg-card border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Botón hamburguesa — visible hasta el breakpoint lg */}
            <button
              onClick={toggleMenu}
              className="lg:hidden p-2 -ml-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors shrink-0"
              aria-label={isMenuOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link to="/dashboard" className="flex items-center gap-2 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md">
              <img src={logoGenlogs} alt="" className="h-8 w-8 object-contain shrink-0" />
              <span className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate">
                GenLogs <span className="hidden sm:inline">ERP</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Navegación de escritorio — desde lg (1024px) para evitar que
                los ~7 items se aprieten en tablets (md, 768-1024px) */}
            <nav className="hidden lg:flex items-center gap-1">
              {mainNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={navLinkClass(location.pathname.startsWith(item.path), true)}
                >
                  {item.label}
                </Link>
              ))}

              {/* Dropdown de Catálogo — click, no hover, para funcionar en táctil */}
              <div className="relative" ref={catalogoRef}>
                <button
                  onClick={() => setIsCatalogoOpen((v) => !v)}
                  aria-expanded={isCatalogoOpen}
                  aria-haspopup="menu"
                  className={`${navLinkClass(isCatalogoActive, true)} flex items-center gap-1`}
                >
                  <span>Catálogo</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isCatalogoOpen ? 'rotate-180' : ''}`} />
                </button>
                {isCatalogoOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-md shadow-lg py-1 z-50"
                  >
                    {catalogoSubItems.map((subItem) => (
                      <Link
                        key={subItem.path}
                        to={subItem.path}
                        role="menuitem"
                        onClick={() => setIsCatalogoOpen(false)}
                        className={navLinkClass(location.pathname.startsWith(subItem.path))}
                      >
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            {/* Menú de usuario — visible en todos los tamaños, es la única
                forma de cerrar sesión en toda la app. */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen((v) => !v)}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                  {inicialesDe(nombreUsuario)}
                </span>
                <span className="hidden xl:flex flex-col items-start leading-tight max-w-32">
                  <span className="text-sm font-medium text-foreground truncate w-full text-left">
                    {nombreUsuario ?? 'Usuario'}
                  </span>
                  <span className="text-xs text-muted-foreground truncate w-full text-left">
                    {nombreRol ?? ''}
                  </span>
                </span>
                <ChevronDown className={`hidden sm:block w-4 h-4 text-muted-foreground transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isUserMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-card py-1 shadow-lg z-50"
                >
                  <div className="border-b border-border px-3 py-2.5">
                    <p className="text-sm font-medium text-foreground truncate">{nombreUsuario ?? 'Usuario'}</p>
                    <p className="text-xs text-muted-foreground truncate">{nombreRol ?? ''}</p>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative">
        {/* Drawer lateral (móvil y tablet, hasta lg) */}
        {isMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-40 transition-opacity lg:hidden"
              onClick={closeMenu}
              aria-hidden="true"
            />

            <aside
              className="fixed top-0 left-0 w-[85vw] max-w-72 h-full bg-card border-r border-border text-card-foreground z-50 shadow-lg flex flex-col justify-between overflow-y-auto lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Menú de módulos"
            >
              <div>
                <div className="flex items-center justify-between p-5 pb-3 border-b border-border">
                  <span className="text-base font-semibold text-foreground">Menú de módulos</span>
                  <button
                    onClick={closeMenu}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                    aria-label="Cerrar menú"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Tarjeta del usuario logueado, arriba del todo del menú */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/40">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                    {inicialesDe(nombreUsuario)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{nombreUsuario ?? 'Usuario'}</p>
                    <p className="text-xs text-muted-foreground truncate">{nombreRol ?? ''}</p>
                  </div>
                </div>

                <nav className="space-y-1 p-5">
                  {mainNavItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={closeMenu}
                      className={navLinkClass(location.pathname.startsWith(item.path))}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  ))}

                  {/* Catálogo como acordeón */}
                  <div>
                    <button
                      onClick={() => setIsMobileCatalogoOpen((v) => !v)}
                      aria-expanded={isMobileCatalogoOpen}
                      className={`w-full flex items-center justify-between ${navLinkClass(isCatalogoActive)}`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Package className="h-4 w-4 shrink-0" />
                        Catálogo
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isMobileCatalogoOpen || isCatalogoActive ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {(isMobileCatalogoOpen || isCatalogoActive) && (
                      <div className="ml-4 mt-1 space-y-1 border-l-2 border-border pl-2">
                        {catalogoSubItems.map((subItem) => (
                          <Link
                            key={subItem.path}
                            to={subItem.path}
                            onClick={closeMenu}
                            className={navLinkClass(location.pathname.startsWith(subItem.path))}
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {secondaryNavItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={closeMenu}
                      className={navLinkClass(location.pathname.startsWith(item.path))}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="border-t border-border p-5 space-y-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </button>
                <p className="text-xs text-muted-foreground text-center">GenLogs ERP System</p>
              </div>
            </aside>
          </>
        )}

        {/* Barra secundaria de escritorio (lg+): los módulos que no caben
            en el nav superior, siempre visibles sin abrir el drawer */}
        <nav className="hidden lg:flex flex-col gap-1 w-56 shrink-0 border-r border-border bg-card p-4">
          {secondaryNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={navLinkClass(location.pathname.startsWith(item.path))}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Contenido principal */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
