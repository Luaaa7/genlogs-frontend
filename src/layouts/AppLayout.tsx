
import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

export function AppLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCatalogoOpen, setIsCatalogoOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

 
const mainNavItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Cotizaciones', path: '/cotizaciones' },
    { label: 'Clientes', path: '/clientes' },
    { label: 'Proveedores', path: '/proveedores' },
  ];

  const secondaryNavItems = [
    { label: 'Órdenes de compra', path: '/ordenes-compra' },
    { label: 'Facturación', path: '/facturacion' },
    { label: 'Empresas mineras', path: '/empresas-mineras' },
    { label: 'Reportes', path: '/reportes' },
    { label: 'Usuarios', path: '/usuarios' },
  ];

  const catalogoSubItems = [
    { label: 'Repuestos', path: '/catalogo-repuestos' },
    { label: 'Servicios', path: '/catalogo-servicios' },
  ];

  const isCatalogoActive = location.pathname.startsWith('/catalogo-repuestos') || location.pathname.startsWith('/catalogo-servicios');

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans antialiased text-foreground">
      {/* Navbar Superior */}
      <header className="bg-card border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Botón Hamburguesa */}
            <button
              onClick={toggleMenu}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              aria-label="Abrir menú de navegación"
            >
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M18.293 5.293a1 1 0 011.414 1.414L13.414 12l5.293 5.293a1 1 0 01-1.414 1.414L12 13.414l-5.293 5.293a1 1 0 01-1.414-1.414L10.586 12 5.293 6.707a1 1 0 011.414-1.414L12 10.586l5.293-5.293z"
                  />
                ) : (
                  <path
                    fillRule="evenodd"
                    d="M4 5h16a1 1 0 010 2H4a1 1 0 110-2zm0 6h16a1 1 0 010 2H4a1 1 0 010-2zm0 6h16a1 1 0 010 2H4a1 1 0 010-2z"
                  />
                )}
              </svg>
            </button>

            <Link to="/dashboard" className="text-xl font-bold tracking-tight text-foreground">
              GenLogs ERP
            </Link>
          </div>

          {/* Navegación Directa Superior en Pantallas Grandes */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              to="/dashboard"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                location.pathname.startsWith('/dashboard')
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Dashboard
            </Link>
           <Link
              to="/cotizaciones"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                location.pathname.startsWith('/cotizaciones')
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Cotizaciones
            </Link>
            
            {/* Módulo V8: orden de compra */}
            <Link
              to="/ordenes-compra"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                location.pathname.startsWith('/ordenes-compra')
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Órdenes de compra
            </Link>

            <Link
              to="/clientes"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                location.pathname.startsWith('/clientes')
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Clientes
            </Link>
            <Link
              to="/proveedores"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                location.pathname.startsWith('/proveedores')
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Proveedores
            </Link>

            {/* Dropdown de Catálogo en Navbar */}
            <div className="relative group">
              <button
                className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center space-x-1 transition-colors ${
                  isCatalogoActive
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span>Catálogo</span>
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-md shadow-lg py-1 hidden group-hover:block z-50">
                {catalogoSubItems.map((subItem) => (
                  <Link
                    key={subItem.path}
                    to={subItem.path}
                    className="block px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {subItem.label}
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        </div>
      </header>

      <div className="flex flex-1 relative">
        {/* Drawer / Menú Lateral Hamburguesa */}
        {isMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-40 transition-opacity"
              onClick={closeMenu}
            />

            <aside className="fixed top-0 left-0 w-72 h-full bg-card border-r border-border text-card-foreground z-50 p-5 shadow-lg flex flex-col justify-between transform transition-transform duration-300 ease-in-out overflow-y-auto">
              <div>
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-border">
                  <span className="text-base font-semibold text-foreground">Menú de Módulos</span>
                  <button
                    onClick={closeMenu}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <nav className="space-y-1">
                 {/* Módulos principales V8 */}
                  {mainNavItems.slice(0, 2).map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={closeMenu}
                        className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground font-semibold'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}

                  {/* 1. Clientes y Proveedores Primero */}
                  {mainNavItems.slice(2).map((item) => { 
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={closeMenu}
                        className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground font-semibold'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}

                  {/* 2. Catálogo como Acordeón / Sublista Elegible */}
                  <div>
                    <button
                      onClick={() => setIsCatalogoOpen(!isCatalogoOpen)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isCatalogoActive
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <span>Catálogo</span>
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 fill-current ${
                          isCatalogoOpen || isCatalogoActive ? 'rotate-180' : ''
                        }`}
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {/* Sublista: Repuestos y Servicios */}
                    {(isCatalogoOpen || isCatalogoActive) && (
                      <div className="ml-4 mt-1 space-y-1 border-l-2 border-border pl-2">
                        {catalogoSubItems.map((subItem) => {
                          const isSubActive = location.pathname.startsWith(subItem.path);
                          return (
                            <Link
                              key={subItem.path}
                              to={subItem.path}
                              onClick={closeMenu}
                              className={`block px-3 py-1.5 rounded-md text-sm transition-colors ${
                                isSubActive
                                  ? 'bg-primary text-primary-foreground font-semibold'
                                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                              }`}
                            >
                              {subItem.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Resto de módulos */}
                  {secondaryNavItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={closeMenu}
                        className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground font-semibold'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="border-t border-border pt-4 text-xs text-muted-foreground text-center">
                GenLogs ERP System
              </div>
            </aside>
          </>
        )}

        {/* Contenido Principal */}
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
