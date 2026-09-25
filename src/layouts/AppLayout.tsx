import { Outlet } from "react-router-dom"

export function AppLayout() {
  return (
    <div className="flex min-h-screen">
      {/* TODO: Sidebar + Navbar según nombreRol */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}