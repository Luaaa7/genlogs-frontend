import { Portada } from "./components/Portada"
import { PorQue } from "./components/PorQue"
import { ComoFunciona } from "./components/ComoFunciona"
import { CatalogoReferencia } from "./components/CatalogoReferencia"
import { CoberturaMinera } from "./components/CoberturaMinera"
import { Respaldo } from "./components/Respaldo"
import { SolicitudRapida } from "./components/SolicitudRapida"
import { Pie } from "./components/Pie"
import { VitrinaLanding } from "./components/VitrinaLanding"
import { vitrinaHabilitada } from "@/lib/interruptores"

/** Con la vitrina apagada (por defecto) se mantiene el catálogo de referencia actual. */
export function LandingPage() {
  return <div><Portada /><PorQue /><ComoFunciona />{vitrinaHabilitada ? <VitrinaLanding /> : <CatalogoReferencia />}<CoberturaMinera /><Respaldo /><SolicitudRapida /><Pie /></div>
}
