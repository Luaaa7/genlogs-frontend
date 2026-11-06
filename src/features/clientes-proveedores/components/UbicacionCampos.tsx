import { useMemo, useState } from 'react'
import type { Distrito } from '@/api/distritosApi'
import { Campo } from '@/components/ui/campo'
import { describedBy, inputFormClass } from '@/components/ui/campoEstilos'
import { cn } from '@/lib/utils/utils'

interface Props {
  /** Prefijo de los ids de los tres campos. */
  idBase: string
  distritos: Distrito[] | undefined
  isLoading: boolean
  /** Distrito elegido (lo que se guarda en el tercero). */
  value: number | undefined
  onChange: (idDistrito: number | undefined) => void
  error?: string
  /** true cuando los datos vinieron de SUNAT o RENIEC: se resaltan, pero se pueden cambiar. */
  autocompletado?: boolean
  disabled?: boolean
}

const ordenar = (a: string, b: string) => a.localeCompare(b, 'es')
const unicos = (lista: (string | undefined)[]) => [...new Set(lista.filter((v): v is string => !!v))].sort(ordenar)

/**
 * Departamento, provincia y distrito en tres listas, una por campo. Al consultar
 * el DNI o el RUC se llenan solas con el UBIGEO del domicilio, y la persona
 * puede cambiar cualquiera de las tres. Lo que se guarda es el distrito del
 * catálogo; la provincia y el departamento sirven para encontrarlo.
 */
export function UbicacionCampos({ idBase, distritos = [], isLoading, value, onChange, error, autocompletado = false, disabled = false }: Props) {
  // Mientras no hay distrito elegido, la provincia y el departamento que se van escogiendo.
  const [departamentoLibre, setDepartamentoLibre] = useState('')
  const [provinciaLibre, setProvinciaLibre] = useState('')

  const seleccionado = distritos.find((d) => d.idDistrito === value)
  const departamento = seleccionado?.nombreDepartamento ?? departamentoLibre
  const provincia = seleccionado?.nombreProvincia ?? provinciaLibre

  const departamentos = useMemo(() => unicos(distritos.map((d) => d.nombreDepartamento)), [distritos])
  const provincias = useMemo(
    () => unicos(distritos.filter((d) => d.nombreDepartamento === departamento).map((d) => d.nombreProvincia)),
    [distritos, departamento]
  )
  const distritosDeProvincia = useMemo(
    () =>
      distritos
        .filter((d) => d.nombreDepartamento === departamento && d.nombreProvincia === provincia)
        .sort((a, b) => ordenar(a.nombreDistrito, b.nombreDistrito)),
    [distritos, departamento, provincia]
  )

  function cambiarDepartamento(nuevo: string) {
    setDepartamentoLibre(nuevo)
    setProvinciaLibre('')
    onChange(undefined)
  }

  function cambiarProvincia(nueva: string) {
    setDepartamentoLibre(departamento)
    setProvinciaLibre(nueva)
    onChange(undefined)
  }

  const resaltado = autocompletado && !!seleccionado
  const claseLista = cn(inputFormClass, resaltado && 'border-teal-400 bg-teal-50/60 dark:border-teal-700 dark:bg-teal-950/40')
  const sinCatalogo = isLoading || distritos.length === 0
  const ayudaDistrito = seleccionado?.ubigeo ? `UBIGEO ${seleccionado.ubigeo}` : undefined
  const errorDistrito = error && !seleccionado ? error : undefined

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Campo id={`${idBase}-departamento`} label="Departamento" obligatorio>
        <select
          id={`${idBase}-departamento`}
          value={departamento}
          onChange={(e) => cambiarDepartamento(e.target.value)}
          disabled={disabled || sinCatalogo}
          className={claseLista}
        >
          <option value="">{isLoading ? 'Cargando…' : 'Elige'}</option>
          {departamentos.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </Campo>
      <Campo id={`${idBase}-provincia`} label="Provincia" obligatorio>
        <select
          id={`${idBase}-provincia`}
          value={provincia}
          onChange={(e) => cambiarProvincia(e.target.value)}
          disabled={disabled || sinCatalogo || !departamento}
          className={claseLista}
        >
          <option value="">{departamento ? 'Elige' : 'Primero el departamento'}</option>
          {provincias.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </Campo>
      <Campo id={`${idBase}-distrito`} label="Distrito" ayuda={ayudaDistrito} error={errorDistrito} obligatorio>
        <select
          id={`${idBase}-distrito`}
          value={seleccionado ? String(seleccionado.idDistrito) : ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
          disabled={disabled || sinCatalogo || !provincia}
          aria-invalid={!!errorDistrito}
          aria-describedby={describedBy(`${idBase}-distrito`, { error: errorDistrito, ayuda: ayudaDistrito })}
          className={claseLista}
        >
          <option value="">{provincia ? 'Elige' : 'Primero la provincia'}</option>
          {distritosDeProvincia.map((d) => (
            <option key={d.idDistrito} value={d.idDistrito}>{d.nombreDistrito}</option>
          ))}
        </select>
      </Campo>
    </div>
  )
}