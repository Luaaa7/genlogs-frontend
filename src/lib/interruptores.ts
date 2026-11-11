/**
 * Interruptores de la v3.2 (Paso 0). La vitrina (Fase 3) queda apagada hasta pasar
 * la prueba de 10 pedidos; se enciende con VITE_VITRINA_HABILITADA=true en Render
 * (o en .env.local para probar). Igual que genlogs.vitrina.habilitada del backend.
 */
export const vitrinaHabilitada = import.meta.env.VITE_VITRINA_HABILITADA === 'true'