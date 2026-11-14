import { render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { UsuarioFormModal } from "./UsuarioFormModal"
import type { Rol, UsuarioResponse } from "@/types/usuario"

const roles: Rol[] = [
  { idRol: 1, nombreRol: "JEFE_ADMINISTRATIVO" },
  { idRol: 2, nombreRol: "ASISTENTE_LOGISTICO" },
  { idRol: 3, nombreRol: "CLIENTE" },
]

function opcionesDeRol() {
  const select = screen.getByLabelText(/rol/i)
  return within(select).getAllByRole("option").map((o) => o.getAttribute("value"))
}

describe("UsuarioFormModal: el rol CLIENTE", () => {
  it("no aparece al crear un usuario: los clientes se registran con su RUC en el portal", () => {
    render(<UsuarioFormModal roles={roles} onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(opcionesDeRol()).toContain("2")
    expect(opcionesDeRol()).not.toContain("3")
  })

  it("no aparece al editar a alguien del personal", () => {
    const asistente: UsuarioResponse = {
      idUsuario: 10, nombreUsuario: "asist", nombres: "Asistente", correo: "a@genlogs.pe",
      nombreRol: "ASISTENTE_LOGISTICO", idRol: 2, bloqueado: false,
    }
    render(<UsuarioFormModal roles={roles} usuario={asistente} onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(opcionesDeRol()).not.toContain("3")
  })

  it("sigue apareciendo al editar a un usuario que ya es cliente, para corregir su nombre", () => {
    const cliente: UsuarioResponse = {
      idUsuario: 11, nombreUsuario: "compras", nombres: "Compras Minera", correo: "c@minera.pe",
      nombreRol: "CLIENTE", idRol: 3, bloqueado: false,
    }
    render(<UsuarioFormModal roles={roles} usuario={cliente} onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(opcionesDeRol()).toContain("3")
  })
})
