import { Portada } from "./components/Portada"
import { PorQue } from "./components/PorQue"
import { ComoFunciona } from "./components/ComoFunciona"
import { CatalogoReferencia } from "./components/CatalogoReferencia"
import { CoberturaMinera } from "./components/CoberturaMinera"
import { Respaldo } from "./components/Respaldo"
import { SolicitudRapida } from "./components/SolicitudRapida"
import { Pie } from "./components/Pie"

export function LandingPage() {
  return <div><Portada /><PorQue /><ComoFunciona /><CatalogoReferencia /><CoberturaMinera /><Respaldo /><SolicitudRapida /><Pie /></div>
}
