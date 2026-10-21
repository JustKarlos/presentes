# Ranking de Presencia para Kick

Ranking de asistencia para un canal de [Kick](https://kick.com). Los espectadores escriben `!presente` en el chat (una vez por hora, solo con el stream en vivo) y suman puntos y rachas diarias. El ranking se muestra en una página estática con actualización en tiempo real.

- **Frontend:** un solo `index.html` (Tailwind por CDN + `supabase-js`). Se aloja gratis en GitHub Pages o Vercel.
- **Base de datos:** Supabase (Postgres) con Row Level Security.
- **Chat:** webhooks oficiales de Kick, recibidos por una Edge Function de Supabase. No hace falta ningún servidor propio.

```
Chat de Kick → webhook de Kick → Edge Function (kick-webhook) → register_presente() → users
                                                                        ↑
                                         index.html (estático) lee el ranking en vivo
```

## Estructura del repositorio

```
.
├── index.html                           # página del ranking
├── overlay/                             # widgets para OBS (chat, emotes, ranking, timer, video, música)
├── robots.txt  sitemap.xml  llms.txt    # indexación para buscadores y asistentes de IA
├── vercel.json                          # cabeceras de seguridad, caché y noindex de /overlay/
├── schema.sql                           # tablas, RLS y función register_presente()
├── supabase/
│   └── functions/
│       └── kick-webhook/
│           └── index.ts                 # receptor de webhooks de Kick
├── .gitignore
└── README.md
```

> El archivo de la función debe estar en `supabase/functions/kick-webhook/index.ts` si vas a desplegar con la CLI de Supabase.

## Funcionamiento

- **Panel:** tarjetas de resumen, podio, ranking por categoría (Presentes, Mensajes, Tiempo activo, Rachas), filtros de período (General, Hoy, 7 días, 30 días, fechas a elección), búsqueda, actividad en vivo y perfil de usuario con sus puestos.
- **Mensajes:** la Edge Function cuenta cada mensaje del chat (no solo `!presente`) mientras el canal está en directo.
- **Tiempo activo:** Kick no entrega el tiempo de visualización real. Se calcula con bloques de 5 minutos en los que el usuario escribió algo; quien mira sin escribir no suma.
- **XP y niveles:** cada `!presente` registrado da +100 XP y cada mensaje +5 XP (uno cada 30 segundos por usuario). Nivel = `floor((XP / 100) ^ (1 / 1.5))`, así que el nivel 1 se alcanza con 100 XP, el 5 con 1.118 XP y el 10 con 3.163 XP. Quien tenga menos de 100 XP está en el nivel 0.
- **Rangos:** niveles 0-4 Fruta Wumpa, 5-9 Cazador de Gemas, 10-19 Guardián Aku Aku, 20-34 Rompe Cajas y 35 o más Maestro del Tiempo. Cada rango tiene su insignia pixel-art, visible en el ranking y en el perfil.
- **Misiones:** hay 3 diarias y 3 semanales (mensajes, presentes, minutos activos y racha). Al completarlas dan XP extra. Se editan desde la tabla `quest_defs` en Supabase (título, meta, recompensa, activa). Los mensajes que cuentan para misiones son los que dan XP, para que el spam no sirva.
- **Tienda:** con XP se compran marcos de avatar, efectos de nombre y fondos de perfil. Se pagan con el saldo `xp - xp_spent`, así que gastar no baja el nivel. Los marcos son imágenes pixel-art de `assets/frames/` y los fondos de perfil son ilustraciones de `assets/backgrounds/` (hay que subir ambas carpetas junto con `index.html`). Hay 9 marcos, 11 fondos y 5 efectos de nombre, incluida una edición Halloween y los efectos de nombre son CSS. Los objetos equipados se ven en el ranking, el podio, la actividad en vivo y el perfil. Para comprar hay que iniciar sesión con Kick.
- **Avisos:** al subir de nivel aparece un aviso en la página en tiempo real y el bot lo anuncia en el chat, igual que las misiones completadas.
- **Puntos:** cada `!presente` válido suma +1 a `total_checkins`.
- **Cooldown:** 1 hora entre check-ins por usuario. Se verifica en el servidor, dentro de una transacción con bloqueo de fila.
- **Avatar:** se toma de la foto de perfil que Kick envía en cada mensaje; si falta o no carga, se muestran las iniciales.
- **Racha:** días consecutivos con al menos un check-in (zona horaria `America/Argentina/Buenos_Aires`, editable en `schema.sql`).
- **Solo en directo:** si el canal está offline, el mensaje se ignora y no consume el cooldown.
- **Seguridad:** el navegador solo puede **leer**. La función `register_presente()` solo la puede ejecutar la Edge Function (con la service key), por lo que nadie puede sumarse puntos desde la consola del navegador.

## Instalación

### 1. Supabase

1. Creá un proyecto gratis en [supabase.com](https://supabase.com).
2. En **SQL Editor**, pegá y ejecutá todo `schema.sql`.
3. En **Project Settings → API**, copiá:
   - **Project URL**
   - **anon public key** (es pública y está pensada para ir en el frontend)

### 2. Aplicación en Kick

1. Entrá a [kick.com/settings/developer](https://kick.com/settings/developer) (requiere 2FA) y creá una app.
2. Completá:
   - **Redirect URI:** `https://TU-PROYECTO.supabase.co/functions/v1/kick-webhook/auth/callback`
   - **Webhook URL:** `https://TU-PROYECTO.supabase.co/functions/v1/kick-webhook` (y activá los webhooks)
   - **Scopes:** `user:read`, `channel:read`, `events:subscribe`
3. Copiá el **Client ID** y el **Client Secret**.

### 3. Edge Function

**Opción A: panel de Supabase (sin instalar nada)**

1. Edge Functions → *Create function* → nombre exacto: `kick-webhook`.
2. Pegá el contenido de `supabase/functions/kick-webhook/index.ts`.
3. **Desactivá "Verify JWT"** (Kick no envía un JWT de Supabase).
4. Desplegá.

**Opción B: CLI**

```bash
npm i -g supabase
supabase login
supabase link --project-ref TU-PROJECT-REF
supabase functions deploy kick-webhook --no-verify-jwt
```

### 4. Secrets de la función

En Edge Functions → **Secrets** (o con `supabase secrets set NOMBRE=valor`):

| Nombre | Valor | Obligatorio |
|---|---|---|
| `KICK_CLIENT_ID` | Client ID de tu app de Kick | sí |
| `KICK_CLIENT_SECRET` | Client Secret de tu app de Kick | sí |
| `BROADCASTER_SLUG` | Tu canal, por ejemplo `micanal` | sí |
| `SETUP_KEY` | Una clave larga inventada por vos (solo para el paso 5) | sí |
| `IGNORED_USERS` | Bots a excluir, separados por coma (por ejemplo `botrix,kicklet`) | no |
| `SITE_URL` | Dirección de tu página (por ejemplo `https://usuario.github.io/repo/`). Es obligatoria para la tienda: aquí vuelve el usuario después de iniciar sesión | sí, para la tienda |
| `OVERLAY_KEY` | Clave secreta de tus widgets de OBS (una frase larga inventada por ti). Va en la URL de cada widget | sí, para los widgets |
| `YOUTUBE_API_KEY` | Clave de la API de YouTube Data v3 (gratis). Solo hace falta para pedir canciones por título; sin ella `!sr` acepta links | no |
| `MOD_USERS` | Moderadores, separados por coma. Respaldo por si Kick no envía las insignias | no |
| `VIDEO_ROLES` | Quién puede usar `!video` (por defecto `moderator,broadcaster,vip`; puedes poner `everyone` o `subscriber`) | no |
| `SR_ROLES` | Quién puede usar `!sr` (por defecto `everyone`) | no |
| `MAX_QUEUE` / `MAX_PER_USER` | Tamaño máximo de cada cola (15) y cuántos pedidos puede tener cada usuario a la vez (2) | no |
| `TIMER_PRESENTE_SEC` | Segundos que suma cada `!presente` a la cuenta atrás (por defecto 0, apagado) | no |
| `CHAT_REPLIES` | `false` para que el bot no escriba en el chat | no |
| `ANNOUNCE_XP` | `false` para que el bot no anuncie subidas de nivel ni misiones completadas | no |
| `REPLY_ON_COOLDOWN` | `false` para no avisar cuánto falta cuando alguien repite `!presente` antes de tiempo | no |
| `REQUIRE_LIVE` | `false` para contar también offline (solo pruebas) | no |
| `KICK_PUBLIC_KEY` | Clave pública PEM de Kick, si la descarga automática falla | no |

`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` ya están disponibles dentro de la función. No hace falta cargarlas.

### 5. Suscribirse a los eventos del chat (una sola vez)

Abrí en el navegador:

```
https://TU-PROYECTO.supabase.co/functions/v1/kick-webhook/auth/start?key=TU_SETUP_KEY
```

Iniciá sesión con la cuenta del streamer y aceptá los permisos. Si todo sale bien, verás `Subscription response 200`.

### 5b. Respuestas del bot en el chat

El bot responde a cada `!presente`: confirma el registro (con el total y la racha) o avisa cuántos minutos faltan para el próximo. Para eso necesita permiso para escribir en el chat:

1. En tu app de Kick (kick.com/settings/developer) activa el permiso `chat:write`.
2. Vuelve a abrir `.../kick-webhook/auth/start?key=TU_SETUP_KEY` con la cuenta del streamer. Los mensajes saldrán publicados con esa cuenta.
3. Opcional: para que escriba una cuenta aparte (por ejemplo `MiBot`), abre `.../kick-webhook/auth/start?key=TU_SETUP_KEY&mode=bot` iniciando sesión con la cuenta del bot. Si existe, tiene prioridad sobre la del streamer.

Los tokens se guardan en la tabla `kick_tokens`, que ninguna clave pública puede leer.

### 5c. Tienda e inicio de sesión con Kick

La página es estática y no sabe quién es cada espectador, así que las compras pasan por la Edge Function y solo se aceptan con una sesión iniciada con Kick:

1. Agrega el secret `SITE_URL` con la dirección exacta de tu página.
2. No hace falta cambiar nada en tu app de Kick: el inicio de sesión reutiliza la misma Redirect URI (`.../kick-webhook/auth/callback`).
3. El espectador pulsa **Tienda → Iniciar sesión con Kick**, autoriza solo el permiso de lectura de su nombre y vuelve a la página con una sesión de 30 días. La función guarda únicamente el hash de la sesión y descarta el token de Kick.
4. Compras, equipar y quitar usan el usuario de la sesión, nunca uno enviado por la página, y la compra es atómica en la base de datos (`purchase_cosmetic`).

Para agregar o cambiar objetos edita la tabla `cosmetics` en Supabase. `css_class` es la clase CSS definida en `index.html` (`fr-*` marcos, `ne-*` efectos de nombre, `pb-*` fondos). Los fondos también aceptan `asset_url` con una imagen `https`.

### 6. Configurar el frontend

Editá el bloque `CONFIG` al inicio de `index.html`:

```js
const CONFIG = {
  SUPABASE_URL:      "https://TU-PROYECTO.supabase.co",
  SUPABASE_ANON_KEY: "tu-anon-public-key",
  CHANNEL_NAME:      "micanal",
  LEADERBOARD_SIZE:  50,
};
```

## Widgets para OBS

Seis widgets con fondo transparente que reaccionan al chat de Kick. No hace falta un servidor Node: la Edge Function recibe los webhooks y manda los eventos a los widgets por **Supabase Realtime** (en lugar de Socket.io). Todo sigue siendo gratis.

| Widget | Archivo | Qué hace |
|---|---|---|
| Chat en pantalla | `overlay/chat.html` | Mensajes con insignias, color de usuario y emotes. Se van solos a los 15 s |
| Lluvia de emotes | `overlay/emotes.html` | Emotes de Kick y 7TV que suben o caen por la pantalla |
| Ranking en vivo | `overlay/ranking.html` | Top 3 / Top 5 por mensajes, presentes, XP o tiempo activo |
| Temporizador | `overlay/timer.html` | Cuenta atrás o cronómetro retro (Starting Soon, subathon) |
| Videos | `overlay/video.html` | Cola de `!video` con YouTube y TikTok |
| Música | `overlay/music.html` | Cola de `!sr` con tarjeta "Sonando ahora" y progreso |

### Instalación
1. Ejecuta el `schema.sql` y vuelve a desplegar la Edge Function (agrega las tablas `media_queue` y `overlay_timer`).
2. Crea el secret `OVERLAY_KEY` con una clave larga y secreta.
3. Edita `overlay/config.js` con la URL y la anon key de Supabase (las mismas de `index.html`).
4. Sube la carpeta `overlay/` junto con `assets/` al repositorio.
5. Abre `https://TU-USUARIO.github.io/TU-REPO/overlay/`, pega tu clave y copia la URL de cada widget.

### Cómo agregarlos en OBS Studio
1. En tu escena: **Fuentes → + → Navegador**.
2. Pega la URL del widget (con `?key=TU_CLAVE`), **Ancho 1920** y **Alto 1080**.
3. En **Video** y **Música** marca **"Controlar audio mediante OBS"** para poder ajustar el volumen en el mezclador.
4. Deja **desmarcado** "Apagar la fuente cuando no esté visible". Si la cola de música o el temporizador deben seguir con la escena oculta, desmarca también "Actualizar el navegador cuando la escena se vuelva activa".
5. No hace falta CSS personalizado: el fondo ya es transparente.

Cada widget acepta parámetros extra en la URL (por ejemplo `&pos=br&ttl=10&max=6`). El archivo `overlay/index.html` muestra la lista de cada uno. Los widgets de chat, emotes, video y música necesitan la clave. El ranking y el temporizador solo leen datos públicos.

### Comandos del chat
| Comando | Quién | Qué hace |
|---|---|---|
| `!video <link>` | Moderadores, VIP y streamer (configurable con `VIDEO_ROLES`) | Agrega un video de YouTube o TikTok a la cola |
| `!skipvideo` | Moderadores o quien lo pidió | Salta el video actual |
| `!sr <link o título>` | Todos (configurable con `SR_ROLES`) | Agrega una canción de YouTube |
| `!skip` | Moderadores o quien la pidió | Salta la canción actual |
| `!timer start 10m [texto]` | Moderadores | Inicia una cuenta atrás |
| `!timer add 5m` / `sub 2m` | Moderadores | Suma o resta tiempo (los widgets muestran un aviso `+5:00`) |
| `!timer pause` / `resume` / `reset` | Moderadores | Controla el temporizador |
| `!timer stopwatch` | Moderadores | Cronómetro que cuenta hacia arriba |

Con `TIMER_PRESENTE_SEC=30`, cada `!presente` suma 30 segundos a la cuenta atrás (modo subathon).

### Limitaciones
- **TikTok:** el reproductor incrustado de TikTok no siempre avisa cuándo termina el video ni permite controlar el volumen. Por eso el widget corta a los 90 segundos (`&tiktok_secs=`). YouTube sí controla volumen y final.
- **Pedir por título (`!sr`)** necesita `YOUTUBE_API_KEY`. La cuota gratuita permite unas 100 búsquedas al día. Sin clave solo se aceptan links.
- **Emotes:** los de Kick y los de 7TV funcionan. BTTV no lo incluí porque no lo usa Kick.
- **Insignias y color de usuario:** salen de los datos que Kick envía en el webhook. Si algún moderador no aparece, agrégalo en `MOD_USERS`.
- Los mensajes que empiezan con `!` no se muestran en el chat en pantalla.

## SEO, accesibilidad y publicación

`index.html` incluye descripción, vista previa para redes (Open Graph y Twitter), favicon, datos estructurados (JSON-LD), un enlace «Saltar al contenido», un texto de preguntas frecuentes y manejo de teclado en pestañas y ventanas.

- **Botón «Ir al chat»:** completa `KICK_CHANNEL` en el bloque `CONFIG` de `index.html` con tu usuario de Kick (por ejemplo `"micanal"`). Mientras esté vacío, el botón no se muestra.
- **Dirección del sitio:** los archivos usan `https://presentescoci.vercel.app`. Si cambias de dominio, reemplázalo en `index.html` (canonical, `og:url`, `og:image`, JSON-LD), `robots.txt`, `sitemap.xml` y `llms.txt`.
- **Imagen para compartir:** `assets/og.jpg` (1200×630). Si cambias de canal, genera otra con el cartel nuevo.
- **Widgets de OBS:** todas las páginas de `overlay/` llevan `noindex`, y `vercel.json` agrega además la cabecera `X-Robots-Tag` y bloquea la carpeta en `robots.txt`.
- **Comprobar después de publicar:** abre `/robots.txt`, `/sitemap.xml` y `/llms.txt` en tu dirección. Para ver cómo se ve al compartirla, pega el enlace en Discord o WhatsApp.

## Publicar en GitHub

```bash
git init
git add .
git commit -m "Ranking de presencia para Kick"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
git push -u origin main
```

> **Nunca subas** el Client Secret, la service role key ni el `SETUP_KEY`. Esos valores van solo en los Secrets de Supabase. La URL del proyecto y la `anon key` sí pueden estar en `index.html`.

### GitHub Pages

1. En el repo: **Settings → Pages**.
2. En *Source* elegí **Deploy from a branch**, rama `main`, carpeta `/ (root)`.
3. Guardá. En un par de minutos el sitio estará en `https://TU-USUARIO.github.io/TU-REPO/`.

### Vercel (alternativa)

1. En [vercel.com](https://vercel.com) elegí **Add New → Project** e importá el repo.
2. *Framework Preset*: **Other**. Sin build command ni output directory.
3. Desplegá.

## Probar que funciona

1. Ponete en directo (o poné `REQUIRE_LIVE=false` en los Secrets).
2. Escribí `!presente` en tu chat.
3. Mirá el ranking: tu usuario debería aparecer con 1 presencia.
4. Si no pasa nada, revisá **Edge Functions → kick-webhook → Logs**.

## Solución de problemas

| Síntoma | Causa probable |
|---|---|
| `Rejected: invalid signature` en los logs | El algoritmo o formato de firma no coincide, o la clave pública no se pudo obtener. Probá cargar `KICK_PUBLIC_KEY` a mano. |
| `offline, ignored` | El chequeo de directo dice que el canal está offline. Para probar usá `REQUIRE_LIVE=false`. |
| `live check failed` | La API de Kick respondió con error. Revisá que la app tenga el scope `channel:read` y las credenciales sean correctas. |
| El paso 5 devuelve un error de cuenta | Mostrará los scopes y las respuestas de Kick. Iniciá sesión con la cuenta del streamer y revisá los scopes de la app. |
| El ranking no se actualiza solo | Verificá que `schema.sql` se ejecutó completo (incluye `alter publication supabase_realtime ...`). Igual hay refresco automático cada 60 s. |
| No llegan webhooks | Revisá que los webhooks estén activados en la app de Kick y que la URL sea exacta. Kick desuscribe la app tras fallos repetidos: repetí el paso 5. |

## Limitaciones

- La API de webhooks de Kick no está bajo mi control y puede cambiar. Este proyecto se escribió contra librerías de terceros y no contra una prueba real con tu canal.
- Los proyectos gratuitos de Supabase se pausan tras aproximadamente una semana sin actividad.
- Los nombres de usuario se normalizan a minúsculas con el `channel_slug` de Kick.
- 
