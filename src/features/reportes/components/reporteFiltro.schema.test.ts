import { describe, it, expect } from 'vitest'
import { reporteFiltroSchema } from '@/lib/validators/reporteFiltro.schema'

const base = { tipoReporte: 'COTIZACIONES', formato: 'EXCEL' } as const

describe('reporteFiltroSchema', () => {
  it('acepta un rango válido', () => {
    expect(reporteFiltroSchema.safeParse({ ...base, fechaInicio: '2026-10-01', fechaFin: '2026-10-20' }).success).toBe(true)
  })

  it('acepta inicio igual a fin', () => {
    expect(reporteFiltroSchema.safeParse({ ...base, fechaInicio: '2026-10-01', fechaFin: '2026-10-01' }).success).toBe(true)
  })

  it('rechaza fecha inicio posterior a fecha fin', () => {
    const r = reporteFiltroSchema.safeParse({ ...base, fechaInicio: '2026-10-20', fechaFin: '2026-10-01' })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues[0].path).toEqual(['fechaInicio'])
      expect(r.error.issues[0].message).toMatch(/no puede ser mayor/)
    }
  })

  it('rechaza fechas vacías', () => {
    expect(reporteFiltroSchema.safeParse({ ...base, fechaInicio: '', fechaFin: '' }).success).toBe(false)
  })

  it('rechaza rangos de más de 365 días', () => {
    expect(reporteFiltroSchema.safeParse({ ...base, fechaInicio: '2025-01-01', fechaFin: '2026-10-01' }).success).toBe(false)
  })
})
