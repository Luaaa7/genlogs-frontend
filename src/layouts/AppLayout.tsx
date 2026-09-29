import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import logoGenlogs from '../assets/GENLOGS.png';

type NavItem = { label: string; path: string };

const mainNavItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Cotizaciones', path: '/cotizaciones' },
  { label: 'Órdenes de compra', path: '/ordenes-compra' },
  { label: 'Clientes', path: '/clientes' },
  { label: 'Proveedores', path: '/proveedores' },
];

const secondaryNavItems: NavItem[] = [
  { label: 'Facturación', path: '/facturacion' },
  { label: 'Empresas mineras', path: '/empresas-mineras' },
  { label: 'Reportes', path: '/reportes' },
  { label: 'Usuarios', path: '/usuarios' },
];

const catalogoSubItems: NavItem[] = [
  { label: 'Repuestos', path: '/catalogo-repuestos' },
  { label: 'Servicios', path: '/catalogo-servicios' },
];

/** Clase única para todo item de navegación activo/inactivo — nunca se
 *  redefine por pantalla, para que el estado "seleccionado" se vea y se
 *  comporte igual en el drawer móvil, el nav de escritorio y el dropdown. */
function navLinkClass(isActive: boolean, dense = false) {
  const base = `block rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
    dense ? 'px-3 py-1.5' : 'px-3 py-2'
  }`;
  return isActive
    ? `${base} bg-accent text-accent-foreground font-semibold`
    : `${base} text-muted-foreground hover:bg-muted hover:text-foreground`;
}

export function AppLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCatalogoOpen, setIsCatalogoOpen] = useState(false);
  const [isMobileCatalogoOpen, setIsMobileCatalogoOpen] = useState(false);
  const catalogoRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const toggleMenu = () => setIsMenuOpen((v) => !v);
  const closeMenu = () => setIsMenuOpen(false);

  const isCatalogoActive =
    location.pathname.startsWith('/catalogo-repuestos') ||
    location.pathname.startsWith('/catalogo-servicios');

  // El dropdown de Catálogo se abre/cierra con click (no solo hover), para
  // que funcione igual con mouse, teclado y pantallas táctiles (una tablet
  // en ancho "desktop" no tiene hover y antes se quedaba sin poder abrirlo).
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (catalogoRef.current && !catalogoRef.current.contains(e.target as Node)) {
        setIsCatalogoOpen(false);
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
              className="fixed top-0 left-0 w-[85vw] max-w-72 h-full bg-card border-r border-border text-card-foreground z-50 p-5 shadow-lg flex flex-col justify-between overflow-y-auto lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Menú de módulos"
            >
              <div>
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-border">
                  <span className="text-base font-semibold text-foreground">Menú de módulos</span>
                  <button
                    onClick={closeMenu}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                    aria-label="Cerrar menú"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-1">
                  {mainNavItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={closeMenu}
                      className={navLinkClass(location.pathname.startsWith(item.path))}
                    >
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
                      <span>Catálogo</span>
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
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="border-t border-border pt-4 text-xs text-muted-foreground text-center">
                GenLogs ERP System
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
