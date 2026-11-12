import { beforeEach, describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { useAuthStore } from "@/features/auth/store/authStore"
import { RutaBusqueda } from "./RutaBusqueda"

function pintar() {
  render(
    <MemoryRouter initialEntries={["/busqueda"]}>
      <Routes>
        <Route element={<RutaBusqueda />}>
          <Route path="/busqueda" element={<p>panel</p>} />
        </Route>
        <Route path="/dashboard" element={<p>dashboard</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("RutaBusqueda (permisos.ts, módulo busqueda)", () => {
  beforeEach(() => useAuthStore.setState({ nombreRol: null }))

  it.each(["ASISTENTE_LOGISTICO", "JEFE_ADMINISTRATIVO", "GERENTE_GENERAL"])("%s entra", (rol) => {
    useAuthStore.setState({ nombreRol: rol })
    pintar()
    expect(screen.getByText("panel")).toBeTruthy()
  })

  it.each(["CONTADOR_GENERAL", "SUPERVISOR_SST", "ASISTENTE_ADMINISTRATIVO", "CLIENTE"])("%s va al dashboard", (rol) => {
    useAuthStore.setState({ nombreRol: rol })
    pintar()
    expect(screen.getByText("dashboard")).toBeTruthy()
  })
})
