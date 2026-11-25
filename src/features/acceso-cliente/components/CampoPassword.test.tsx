import { createRef } from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { CampoPassword } from "./CampoPassword"

function renderCampo(props: Partial<React.ComponentProps<typeof CampoPassword>> = {}) {
  return render(
    <>
      <label htmlFor="clave">Contraseña</label>
      <CampoPassword id="clave" name="password" autoComplete="current-password" {...props} />
    </>,
  )
}

const campo = () => screen.getByLabelText("Contraseña") as HTMLInputElement
const AVISO = "Bloq Mayús está activado"

describe("CampoPassword", () => {
  it("empieza oculto y pasa al navegador el autocompletado que le dan", () => {
    renderCampo()
    expect(campo().type).toBe("password")
    expect(campo().getAttribute("autocomplete")).toBe("current-password")
    expect(campo().name).toBe("password")
  })

  describe("ojito", () => {
    it("alterna entre contraseña y texto, y cambia su nombre accesible", () => {
      renderCampo()
      fireEvent.click(screen.getByRole("button", { name: "Mostrar contraseña" }))

      expect(campo().type).toBe("text")
      expect(screen.queryByRole("button", { name: "Mostrar contraseña" })).toBeNull()

      fireEvent.click(screen.getByRole("button", { name: "Ocultar contraseña" }))
      expect(campo().type).toBe("password")
    })

    it("se alcanza con el teclado (Tab) y no envía el formulario", () => {
      renderCampo()
      const ojo = screen.getByRole("button", { name: "Mostrar contraseña" })
      expect(ojo.getAttribute("tabindex")).toBeNull()
      ojo.focus()
      expect(document.activeElement).toBe(ojo)
      expect(ojo.getAttribute("type")).toBe("button")
    })

    it("usa la etiqueta que le pasan para nombrar el botón", () => {
      renderCampo({ etiquetaVer: "confirmación" })
      expect(screen.getByRole("button", { name: "Mostrar confirmación" })).toBeTruthy()
    })

    it("conserva lo escrito al alternar", () => {
      renderCampo()
      fireEvent.change(campo(), { target: { value: "Clave1234" } })
      fireEvent.click(screen.getByRole("button", { name: "Mostrar contraseña" }))
      expect(campo().value).toBe("Clave1234")
    })
  })

  describe("aviso de Bloq Mayús", () => {
    it("no aparece al inicio", () => {
      renderCampo()
      expect(screen.queryByText(AVISO)).toBeNull()
    })

    it("aparece al escribir con Bloq Mayús activo y se va al apagarlo", () => {
      renderCampo()
      fireEvent.keyDown(campo(), { key: "A", modifierCapsLock: true })
      expect(screen.getByText(AVISO)).toBeTruthy()

      fireEvent.keyUp(campo(), { key: "CapsLock", modifierCapsLock: false })
      expect(screen.queryByText(AVISO)).toBeNull()
    })

    it("se va cuando el campo pierde el foco", () => {
      renderCampo()
      fireEvent.keyDown(campo(), { key: "A", modifierCapsLock: true })
      fireEvent.blur(campo())
      expect(screen.queryByText(AVISO)).toBeNull()
    })

    it("queda unido al campo para lectores de pantalla, sin perder otras descripciones", () => {
      renderCampo({ "aria-describedby": "reglas" })
      expect(campo().getAttribute("aria-describedby")).toBe("reglas")

      fireEvent.keyDown(campo(), { key: "A", modifierCapsLock: true })

      const ids = (campo().getAttribute("aria-describedby") ?? "").split(" ")
      expect(ids).toContain("reglas")
      const aviso = screen.getByText(AVISO)
      expect(ids).toContain(aviso.id)
    })

    it("sigue llamando a los onKeyDown y onKeyUp que le pasen", () => {
      const teclas: string[] = []
      renderCampo({ onKeyDown: (e) => teclas.push(`abajo:${e.key}`), onKeyUp: (e) => teclas.push(`arriba:${e.key}`) })
      fireEvent.keyDown(campo(), { key: "a" })
      fireEvent.keyUp(campo(), { key: "a" })
      expect(teclas).toEqual(["abajo:a", "arriba:a"])
    })
  })

  it("entrega su ref al input (el registro lo usa para llevar el foco)", () => {
    const ref = createRef<HTMLInputElement>()
    renderCampo({ ref })
    expect(ref.current).toBe(campo())
  })
})
