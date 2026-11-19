import { test as setup, expect } from '@playwright/test'

/**
 * Inicia sesión una vez y guarda el estado (localStorage con access_token) en e2e/.auth/.
 * Usuario y clave salen de variables de entorno; nunca se escriben en el repositorio.
 */
const usuario = process.env.GENLOGS_USUARIO ?? 'demo.jefe'
const clave = process.env.GENLOGS_CLAVE

setup('iniciar sesión', async ({ page }) => {
  setup.skip(!clave, 'Sin GENLOGS_CLAVE: solo se revisan las páginas públicas.')
  await page.goto('/login')
  await page.locator('#login-usuario').fill(usuario)
  await page.locator('#login-password').fill(clave as string)
  await page.getByRole('button', { name: 'Ingresar' }).click()
  // El backend del plan de Render puede tardar en despertar.
  await expect(page).not.toHaveURL(/\/login/, { timeout: 90_000 })
  await page.context().storageState({ path: 'e2e/.auth/sesion.json' })
})
