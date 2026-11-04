import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Ventana } from '@/components/ui/Ventana'
import { Button } from '@/components/ui/button'
import { MarcaObligatorio } from '@/components/ui/campo'
import { inputFormClass } from '@/components/ui/campoEstilos'
import { FileUploader } from '@/components/ui/FileUploader'
import type { ImagenNueva } from '@/types/producto.types'
import { CategoriaSelector } from '@/features/catalogo-repuestos/components/CategoriaSelector'
import { listarMarcas } from '@/api/marcasApi'
import { listarUnidadesMedida } from '@/api/unidadesMedidaApi'
import { mensajeErrorApi } from '@/api/productosApi'
import { useCrearProducto } from '@/hooks/useCrearProducto'
import { avisar } from '@/lib/avisos'
import type { ItemCatalogo } from './SelectorCatalogoItem'

interface Props {
  /** Lo que se había escrito en el buscador: sirve de nombre inicial. */
  nombreInicial?: string
  onCreado: (item: ItemCatalogo) => void
  onCerrar: () => void
}

/** Alta rápida de un repuesto desde la cotización: solo lo obligatorio.
 *  Fotos, documentos y ficha técnica se completan luego en el catálogo. */
export function RepuestoRapidoModal({ nombreInicial = '', onCreado, onCerrar }: Props) {
  const [codigo, setCodigo] = useState('')
  const [nombre, setNombre] = useState(nombreInicial)
  const [categoria, setCategoria] = useState<number | undefined>()
  const [unidad, setUnidad] = useState<number | undefined>()
  const [marca, setMarca] = useState<number | undefined>()
  const [visibleWeb, setVisibleWeb] = useState(true)
  const [intento, setIntento] = useState(false)
  // Fotos opcionales: ya quedan en Cloudinary y se asocian al crear; la primera es la principal.
  const [imagenes, setImagenes] = useState<ImagenNueva[]>([])
  const [subiendo, setSubiendo] = useState(false)
  const { mutate, isPending, error } = useCrearProducto()

  const { data: unidades, isLoading: cargandoUnidades } = useQuery({ queryKey: ['unidades-medida'], queryFn: listarUnidadesMedida, staleTime: 5 * 60_000 })
  const { data: marcas, isLoading: cargandoMarcas } = useQuery({ queryKey: ['marcas'], queryFn: listarMarcas, staleTime: 5 * 60_000 })

  const faltantes = [
    !codigo.trim() && 'código',
    !nombre.trim() && 'nombre',
    !categoria && 'categoría',
    !unidad && 'unidad de medida',
  ].filter(Boolean) as string[]
  const err = (cond: boolean) => intento && cond

  function guardar() {
    setIntento(true)
    if (faltantes.length > 0 || !categoria || !unidad || subiendo) return
    mutate(
      {
        values: {
          idCategoriaProducto: categoria,
          idMarca: marca,
          idUnidadMedida: unidad,
          codigoProducto: codigo.trim(),
          nombreProducto: nombre.trim(),
          visibleWeb,
          caracteristicas: [],
        },
        medios: { imagenes, documentos: [], documentosIdsParaEliminar: [] },
      },
      {
        onSuccess: ({ producto }) => {
          avisar(`Repuesto ${producto.nombreProducto} registrado correctamente`)
          onCreado({
            tipo: 'producto',
            id: producto.idProducto,
            nombre: producto.nombreProducto,
            codigo: producto.codigoProducto,
            idUnidadMedida: producto.idUnidadMedida,
          })
        },
      },
    )
  }

  const select = `${inputFormClass}`
  const etiqueta = 'block text-sm font-medium text-foreground'

  return (
    <Ventana
      titulo="Nuevo repuesto"
      descripcion="Lo obligatorio y, si quieres, fotos. La ficha técnica y los documentos se completan luego en el catálogo."
      onCerrar={onCerrar}
      cerrable={!isPending && !subiendo}
      ancho="max-w-xl"
      acciones={
        <>
          <Button type="button" variant="ghost" onClick={onCerrar} disabled={isPending}>Cancelar</Button>
          <Button type="button" onClick={guardar} disabled={isPending || subiendo}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
            {isPending ? 'Guardando…' : 'Crear y usar en la cotización'}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={etiqueta}>
          Código<MarcaObligatorio />
          <input value={codigo} maxLength={30} onChange={(e) => setCodigo(e.target.value)} aria-invalid={err(!codigo.trim())} className={`${inputFormClass} mt-1`} />
          {err(!codigo.trim()) && <span className="mt-1 block text-xs font-normal text-destructive">El código es obligatorio.</span>}
        </label>
        <label className={etiqueta}>
          Nombre<MarcaObligatorio />
          <input value={nombre} maxLength={200} onChange={(e) => setNombre(e.target.value)} aria-invalid={err(!nombre.trim())} className={`${inputFormClass} mt-1`} />
          {err(!nombre.trim()) && <span className="mt-1 block text-xs font-normal text-destructive">El nombre es obligatorio.</span>}
        </label>
        <div>
          <span className={`${etiqueta} mb-1`}>Categoría<MarcaObligatorio /></span>
          <CategoriaSelector value={categoria} onChange={setCategoria} invalid={err(!categoria)} />
          {err(!categoria) && <span className="mt-1 block text-xs text-destructive">Selecciona una categoría.</span>}
        </div>
        <label className={etiqueta}>
          Unidad de medida<MarcaObligatorio />
          <select value={unidad ?? ''} onChange={(e) => setUnidad(e.target.value ? Number(e.target.value) : undefined)} disabled={cargandoUnidades} aria-invalid={err(!unidad)} className={`${select} mt-1`}>
            <option value="">{cargandoUnidades ? 'Cargando…' : 'Selecciona una unidad'}</option>
            {unidades?.map((u) => (
              <option key={u.idUnidadMedida} value={u.idUnidadMedida}>{u.nombreUnidad} ({u.codigoUnidad})</option>
            ))}
          </select>
          {err(!unidad) && <span className="mt-1 block text-xs font-normal text-destructive">Selecciona una unidad de medida.</span>}
        </label>
        <label className={etiqueta}>
          Marca (opcional)
          <select value={marca ?? ''} onChange={(e) => setMarca(e.target.value ? Number(e.target.value) : undefined)} disabled={cargandoMarcas} className={`${select} mt-1`}>
            <option value="">{cargandoMarcas ? 'Cargando…' : 'Sin marca'}</option>
            {marcas?.map((m) => (
              <option key={m.idMarca} value={m.idMarca}>{m.nombreMarca}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-foreground">
          <input type="checkbox" className="h-4 w-4" checked={visibleWeb} onChange={(e) => setVisibleWeb(e.target.checked)} />
          Mostrar en el catálogo web
        </label>
      </div>

      <div className="mt-4">
        <FileUploader
          tipo="imagen"
          multiple
          maxArchivos={5}
          label="Fotos del repuesto (opcional)"
          onUploaded={(r) => setImagenes((prev) => [...prev, { url: r.url, esPrincipal: prev.length === 0 }])}
          onRemoved={(r) =>
            setImagenes((prev) => {
              const resto = prev.filter((i) => i.url !== r.url)
              return resto.length > 0 && !resto.some((i) => i.esPrincipal) ? resto.map((i, n) => (n === 0 ? { ...i, esPrincipal: true } : i)) : resto
            })
          }
          onUploadingChange={setSubiendo}
          disabled={isPending}
        />
      </div>
      {intento && faltantes.length > 0 && <p role="alert" className="mt-4 text-sm text-destructive">Falta completar: {faltantes.join(', ')}.</p>}
      {error != null && <p role="alert" className="mt-4 text-sm text-destructive">{mensajeErrorApi(error, 'No se pudo crear el repuesto. Revisa los datos e intenta de nuevo (¿el código ya existe?).')}</p>}
    </Ventana>
  )
}
