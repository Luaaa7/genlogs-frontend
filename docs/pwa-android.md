# GenLogs como PWA y APK para Android

## 1. Qué tiene la PWA

| Pieza | Archivo | Detalle |
| --- | --- | --- |
| Manifiesto | `public/manifest.json` (enlazado en `index.html`) y `public/manifest.webmanifest` (copia idéntica para `twa-manifest.json`) | `name` «GenLogs - Sistema de Gestión», `short_name` «GenLogs», `display: standalone`, `start_url: /?source=pwa`, `scope: /`, `orientation: any`, `theme_color #1E3A5F`, `background_color #F9FAFB`, atajos a /login y /portal/ingreso |
| Íconos | `public/icons/` | 192 y 512 (`any`), 512 `maskable` (logo dentro de la zona segura) y `apple-touch-icon` 180, generados desde `public/LOGO.png` |
| Service worker | `public/sw.js` | Ver la sección 2 |
| Registro | `src/lib/registrarServiceWorker.ts` (llamado en `src/main.tsx`) | Solo en producción (`import.meta.env.PROD`), con `updateViaCache: "none"` |
| Página sin conexión | `public/offline.html` | Se muestra al navegar sin internet |
| Etiquetas | `index.html` | `<link rel="manifest">`, `theme-color`, `apple-touch-icon` |

No se usó `vite-plugin-pwa` porque todavía no declara compatibilidad con Vite 8; el service worker es un archivo propio y no agrega dependencias.

## 2. Caché y datos sensibles

- **Se guarda:** `/assets/*` (JS y CSS con hash: primero caché, máximo 80 archivos), íconos, manifiesto, logo y `offline.html`.
- **Nunca se guarda:** el API (`genlogs-backend-…onrender.com`, otro dominio), Cloudinary, cualquier otro dominio, peticiones con `Authorization` ni nada que no sea `GET`.
- **Páginas:** siempre se piden a la red; sin conexión se muestra `offline.html`. La app no funciona sin conexión porque todos sus datos vienen del API.
- **Nueva versión:** el HTML siempre llega de la red, así que una publicación nueva carga sus propios archivos. Si se cambia `sw.js`, sube `VERSION` y el SW borra las cachés viejas al activarse.

## 3. Render

- El sitio es un Static Site: los archivos de `public/` (incluidos `sw.js`, `manifest.webmanifest` y `.well-known/`) se sirven antes que la regla de reescritura de la SPA.
- Render sirve `.webmanifest` como `binary/octet-stream` (comprobado el 22/11/2026) y `.json` como `application/json`; por eso `index.html` enlaza `/manifest.json`. Los dos archivos deben ser idénticos: lo comprueba `src/lib/manifiestoPwa.test.ts`.
- Recomendado (opcional): en Render → Headers, `Cache-Control: no-cache` para `/sw.js` y `/manifest.json`, y `Content-Type: application/manifest+json` para `/manifest.webmanifest` (falta comprobar que Render aplique ese `Content-Type`).

## 4. APK para Android (Trusted Web Activity)

**Recomendado: PWABuilder.** Genera un proyecto TWA con Bubblewrap por dentro, firma el APK y entrega el `assetlinks.json`, sin instalar el Android SDK. **Alternativa reproducible: Bubblewrap CLI** (requiere Node, JDK 17 y el Android SDK, que Bubblewrap descarga).

Requisito previo: esta rama fusionada y desplegada, y `https://genlogs-frontend-kym5.onrender.com/manifest.webmanifest` respondiendo.

### Con PWABuilder

1. Entra a https://www.pwabuilder.com, pega `https://genlogs-frontend-kym5.onrender.com` y pulsa **Start**.
2. Revisa el informe (manifiesto, service worker, seguridad).
3. **Package for stores → Android → Generate Package**:
   - **Package ID:** decisión del equipo (propuesta: `com.genlogs.app`). No se puede cambiar después.
   - **App name / Short name:** GenLogs - Sistema de Gestión / GenLogs.
   - **Signing key:** «Create new».
4. Descarga el .zip. Trae el `.apk` (instalación directa), el `.aab` (Play Store), la llave `signing.keystore`, sus contraseñas (`signing-key-info.txt`) y `assetlinks.json`.
5. **Guarda la llave y las contraseñas fuera del repositorio** (gestor de contraseñas del equipo). Sin ellas no se puede publicar una actualización con la misma firma.

### Con Bubblewrap

```
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://genlogs-frontend-kym5.onrender.com/manifest.webmanifest
bubblewrap build
```
`init` pide el ID del paquete y crea la llave; `build` deja `app-release-signed.apk`. La huella sale con
`keytool -list -v -keystore android.keystore -alias android`.

### assetlinks.json (pantalla completa sin barra de dirección)

1. Copia `docs/assetlinks.plantilla.json` a `public/.well-known/assetlinks.json`.
2. Reemplaza `package_name` y `sha256_cert_fingerprints` con los datos reales (el `assetlinks.json` de PWABuilder ya los trae).
3. Publica y comprueba que `https://genlogs-frontend-kym5.onrender.com/.well-known/assetlinks.json` muestra el JSON.

Si la app se publica en Play Store con «firma de apps de Google Play», se agrega también la huella SHA-256 que muestra Play Console.

> **Estado actual (22/11/2026): huella de DEPURACIÓN, temporal.** `public/.well-known/assetlinks.json` tiene `com.genlogs.app` y la huella SHA-256 del certificado *Android Debug* del APK de prueba instalado en el Samsung A12 de Nicole (`ED:9A:21:…:49:60`). Sirve solo para probar la pantalla completa con ese APK. Cuando se defina la llave de lanzamiento (release), hay que **agregar su huella SHA-256 a la lista** (y la de Play Console, si se usa) y, cuando ya no se use el APK de depuración, **quitar la de depuración**. La llave y sus contraseñas nunca van al repo. `src/lib/assetlinks.test.ts` comprueba que el archivo siga bien escrito.

## 5. Prueba en el teléfono

1. Pasa el `.apk` al teléfono y ábrelo; acepta «instalar apps de origen desconocido».
2. Comprueba: ícono «GenLogs», pantalla de inicio con el color de la app, abre sin barra de dirección (si `assetlinks.json` está bien), ingreso de personal y de cliente, y mensaje «Sin conexión» en modo avión.
3. Toma capturas de cada paso para el informe.
