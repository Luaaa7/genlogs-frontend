import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useTardaMucho } from "./useTardaMucho"

describe("useTardaMucho", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it("avisa solo cuando la espera pasa del límite", () => {
    const { result } = renderHook(() => useTardaMucho(true, 5000))
    expect(result.current).toBe(false)
    act(() => { vi.advanceTimersByTime(4999) })
    expect(result.current).toBe(false)
    act(() => { vi.advanceTimersByTime(1) })
    expect(result.current).toBe(true)
  })

  it("se apaga apenas termina la espera y vuelve a contar desde cero", () => {
    const { result, rerender } = renderHook(({ activo }) => useTardaMucho(activo, 5000), { initialProps: { activo: true } })
    act(() => { vi.advanceTimersByTime(6000) })
    expect(result.current).toBe(true)
    rerender({ activo: false })
    expect(result.current).toBe(false)
    rerender({ activo: true })
    act(() => { vi.advanceTimersByTime(3000) })
    expect(result.current).toBe(false)
  })
})
