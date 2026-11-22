import { render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { BotonGoogle } from "./BotonGoogle"

type Init = { client_id: string; callback: (r: { credential?: string }) => void }

describe("BotonGoogle", () => {
  const initialize = vi.fn()
  const renderButton = vi.fn()

  beforeEach(() => {
    initialize.mockReset()
    renderButton.mockReset()
    ;(window as unknown as { google?: unknown }).google = { accounts: { id: { initialize, renderButton } } }
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    delete (window as unknown as { google?: unknown }).google
  })

  it("sin VITE_GOOGLE_CLIENT_ID no muestra nada", () => {
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "")
    const { container } = render(<BotonGoogle onCredential={vi.fn()} />)
    expect(container.innerHTML).toBe("")
    expect(initialize).not.toHaveBeenCalled()
  })

  it("dibuja el botón de Google con nuestro ID y entrega el token", async () => {
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "123.apps.googleusercontent.com")
    const onCredential = vi.fn()
    render(<BotonGoogle onCredential={onCredential} texto="signup_with" />)

    await vi.waitFor(() => expect(initialize).toHaveBeenCalled())
    const opciones = initialize.mock.calls[0][0] as Init
    expect(opciones.client_id).toBe("123.apps.googleusercontent.com")
    expect(renderButton).toHaveBeenCalledWith(expect.any(HTMLElement), expect.objectContaining({ text: "signup_with" }))
    expect(screen.getByTestId("boton-google")).toBeTruthy()

    opciones.callback({ credential: "id-token" })
    expect(onCredential).toHaveBeenCalledWith("id-token")
    opciones.callback({})
    expect(onCredential).toHaveBeenCalledTimes(1)
  })
})
