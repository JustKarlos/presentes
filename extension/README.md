# Cosméticos del Ranking para Kick

Extensión de navegador que dibuja en el chat de [kick.com](https://kick.com) lo que cada persona equipó en la tienda del ranking:

- **Pinturas de nombre:** Neón verde, Hielo, Oro metálico, Fuego y Arcoíris.
- **Insignias de rango**, según el nivel: Fruta Wumpa (0-4), Cazador de Gemas (5-9), Guardián Aku Aku (10-19), Rompe Cajas (20-34) y Maestro del Tiempo (35 o más).

> **Ten en cuenta:** los efectos los pinta la extensión en el navegador de cada persona. Quien no la tenga instalada ve el chat de Kick normal. Los marcos de avatar y los fondos de perfil solo se ven en la web del ranking, no en el chat.

## Instalación rápida (5 minutos)

**Necesitas** un navegador basado en Chromium 110 o superior: Chrome, Edge, Brave, Opera o Vivaldi. No está preparada para Firefox ni Safari.

1. **Descomprime** `extension.zip` (o usa la carpeta `extension/` de tu repositorio). Busca la carpeta que tiene `manifest.json` **directamente adentro**: si al descomprimir queda `extension/extension/`, es la de adentro.
2. Abre `chrome://extensions` (en Edge, `edge://extensions`; en Brave, `brave://extensions`).
3. Activa **Modo de desarrollador** (*Developer mode*), arriba a la derecha. En Edge el interruptor está en el menú de la izquierda.
4. Pulsa **Cargar descomprimida** (*Load unpacked*) y elige esa carpeta.
5. Debe aparecer la tarjeta **Cosméticos del Ranking para Kick** sin errores. Para dejarla a mano: icono del puzzle en la barra del navegador → alfiler.
6. Abre un chat de Kick y **recarga la pestaña** (`F5`). Las pestañas que ya estaban abiertas no reciben la extensión hasta que se recargan.

> Chrome carga la extensión **desde esa carpeta**: no la borres ni la muevas después de instalarla. Si la mueves, repite el paso 4.

## Comprobar que funciona

1. Pulsa el icono de la extensión. Arriba debe verse un punto verde y **«Conectado a la base del ranking (… ms)»**.
2. Con un chat de Kick abierto, en **«En esta pestaña»** debe leerse algo así: *«23 mensajes en pantalla · 4 con insignia o pintura · 15 usuarios en caché»*. Solo reciben insignia quienes ya están en el ranking, es decir, quienes escribieron alguna vez en un directo.
3. **Prueba de la base (recomendada la primera vez).** En `chrome://extensions`, en la tarjeta de la extensión, pulsa el enlace **service worker** para abrir su consola y ejecuta lo siguiente, cambiando el nombre por el de un usuario del ranking (en minúsculas y con `-` en lugar de `_`):

   ```js
   rpc('get_chat_cosmetics', { p_usernames: ['tu-usuario'] }).then(console.log, console.error)
   ```

   Si Chrome te pide escribir `allow pasting`, hazlo y vuelve a pegar. Esto responde:

   | Respuesta | Qué significa |
   |---|---|
   | Una lista con `u`, `lv`, `rank`, `ne` y `fr` | Todo en orden. |
   | `[]` | La función existe, pero ese usuario no está en el ranking. |
   | `HTTP 404` | La función `get_chat_cosmetics` no existe en esa base (o sus parámetros no coinciden). |
   | `HTTP 401` o `HTTP 403` | Clave `anon` incorrecta, o la función no tiene permiso `execute` para el rol `anon`. |
   | `Failed to fetch` | Sin conexión, dirección mal escrita o proyecto de Supabase pausado. |

4. **Ver una pintura de verdad:** equipa un efecto de nombre en la tienda del ranking, escribe con esa cuenta en un chat de Kick y recarga la pestaña. Los datos de cada usuario se guardan 5 minutos (1 minuto si todavía no está en el ranking); para saltarte la espera, **Ajustes avanzados → Borrar caché** y `F5`.

## Cómo se usa

Todo se maneja desde el popup (clic en el icono de la extensión):

| Opción | Qué hace |
|---|---|
| Activar en el chat de Kick | Interruptor general. Apagado, quita todo lo que puso en el chat. |
| Pinturas de nombre | Muestra u oculta los efectos de nombre. |
| Insignias de rango | Muestra u oculta la insignia delante del nombre. |
| Abrir la tienda de cosméticos | Abre la web del ranking en otra pestaña. |
| En esta pestaña | Diagnóstico: cuántos mensajes detecta y a cuántos les aplicó algo. |

Los interruptores se aplican al instante, sin recargar.

**Ajustes avanzados** solo hacen falta si cambias de proyecto de Supabase o de dominio: dirección de Supabase, clave pública (`anon`) y dirección de la web. Al guardar una dirección nueva, Chrome te pide permiso para conectar con ella. *Borrar caché* olvida los datos guardados de los usuarios. *Mensajes de depuración* escribe en la consola de Kick (`F12`) lo que hace la extensión; si no ves nada, activa el nivel **Verbose** de la consola.

## Si algo no funciona

| Síntoma | Causa probable y solución |
|---|---|
| Chrome no puede cargar el icono `icons/icon-16.png` | Faltan los iconos. Ejecuta `python3 tools/make_assets.py` dentro de `extension/`, o usa el zip. |
| *Manifest file is missing or unreadable* (el manifiesto falta o no se puede leer) | Elegiste la carpeta equivocada. Elige la que tiene `manifest.json` adentro (paso 1). |
| El popup dice **«Sin conexión con la base del ranking»** | Revisa tu internet, las direcciones de *Ajustes avanzados* y que el proyecto de Supabase no esté pausado (los gratuitos se pausan tras una semana sin actividad). Haz la prueba del punto 3 de arriba. |
| El popup dice **«Recarga la pestaña de Kick para activar la extensión»** | La pestaña estaba abierta antes de instalar o actualizar. Pulsa `F5`. |
| El popup dice **«No se detecta el chat…»** | Kick cambió su HTML. Mira la sección siguiente. |
| *«N mensajes en pantalla · 0 con insignia o pintura»* | Es normal si nadie de ese chat está en el ranking. Si deberían salir, mira si aparece *«errores de red»* y haz la prueba de la base. |
| El diagnóstico muestra *«· N errores de red»* | Falla la consulta a `get_chat_cosmetics`. Usa la tabla de respuestas del punto 3. |
| *Extension context invalidated* en la consola de Kick | Recargaste la extensión con la pestaña abierta. Pulsa `F5`. |

### Si Kick cambia su HTML

La extensión necesita encontrar dos cosas en el chat: cada **mensaje** y, dentro de él, el **nombre de usuario**. Hoy son `div[data-chat-entry]` y `.chat-entry-username`, y se definen en `DEFAULT_SELECTORS`, al principio de `kcx-core.js`. Si dejan de funcionar:

1. En un chat de Kick, clic derecho sobre un nombre de usuario → **Inspeccionar**.
2. Anota el selector del elemento que contiene **solo el nombre** y el del contenedor de **todo el mensaje**.
3. Agrégalos a `DEFAULT_SELECTORS` en `kcx-core.js` (`row` = el mensaje, `username` = el nombre).
4. En `chrome://extensions` pulsa el botón de recargar (↻) de la tarjeta y luego `F5` en Kick.

## Cómo funciona y qué permisos usa

1. `content.js` y `kcx-core.js` (dentro de kick.com) detectan cada mensaje nuevo y leen el nombre de usuario.
2. `background.js` pregunta a Supabase por esos nombres con `get_chat_cosmetics`: hasta 100 por consulta y como máximo una consulta por segundo. Guarda las respuestas 5 minutos (1 minuto si el usuario no está en el ranking).
3. De vuelta en la página, `kcx-core.js` agrega la clase de la pintura (`paints.css`) y la insignia (`badges/*.svg`).

| Permiso | Para qué sirve |
|---|---|
| `storage` | Guardar tus ajustes y la caché. |
| `https://kick.com/*` | Ejecutarse en el chat de Kick. |
| `https://nlgkpoomhgehuabrkwhp.supabase.co/*` | Consultar los cosméticos en la base del ranking. |
| `https://*/*` (opcional) | Solo si cambias la dirección de Supabase en *Ajustes avanzados*; el navegador te pregunta en ese momento. |

Lo único que sale de tu navegador son los nombres de usuario que se ven en el chat, y la extensión solo lee el nombre de cada línea, no el texto de los mensajes. No lee cookies ni inicia sesión en Kick ni en el ranking. Usa la clave pública `anon` de Supabase, que solo permite leer (la protegen las políticas RLS de tu base).

## Mantenimiento

**Actualizar.** Reemplaza los archivos, ve a `chrome://extensions`, pulsa ↻ en la tarjeta y recarga con `F5` las pestañas de Kick. Los valores de `settings.js` son los de fábrica: se copian al instalar y, desde entonces, mandan los que guardes en *Ajustes avanzados*. Si cambias de dominio o de proyecto de Supabase, cámbialo ahí.

**Regenerar iconos e insignias.** `icons/` y `badges/` salen de `tools/sprites.json`. Si cambias un sprite o la paleta:

```bash
python3 extension/tools/make_assets.py
```

No necesita instalar nada. Si prefieres iconos propios, reemplaza los PNG y no vuelvas a ejecutarlo.

**Versión para OBS.** `overlay/kcx-obs.js` se genera con el mismo núcleo, estilos y sprites. Vuelve a ejecutar `python3 extension/tools/build_obs.py` cada vez que cambies `kcx-core.js`, `paints.css`, `settings.js` o `tools/sprites.json`.

**Desinstalar.** En `chrome://extensions`, botón **Quitar** de la tarjeta.

## Opcional: que «Abrir la tienda de cosméticos» abra la tienda

El botón del popup abre `https://presentescoci.vercel.app/#tienda`, pero hoy `index.html` no reconoce ese `#tienda`: abre el ranking y la tienda queda cerrada. Para que se abra sola, agrega una línea en `index.html`, dentro de la función que lee `#session=` al volver del login:

```js
(() => {                                                    // al volver del login: #session=TOKEN&user=NOMBRE
  const h = new URLSearchParams(location.hash.slice(1));
  if(location.hash === '#tienda'){ openShopAfterBoot = true; history.replaceState(null, '', location.pathname + location.search); return; }   // <- línea nueva
  if(!h.get('session')) return;
  /* … el resto queda igual … */
})();
```

## Compartirla con tu comunidad

Cada persona que quiera ver los efectos tiene que instalar la extensión. Con el zip y el modo de desarrollador alcanza para ti, tus moderadores y quien quiera probar, pero es incómodo para el público general. Para que se instale con un clic hay que publicarla en la **Chrome Web Store** (y, si quieres, en **Edge Add-ons**), lo que requiere una cuenta de desarrollador y pasar la revisión de la tienda. Al subirla no hace falta incluir `tools/` ni `README.md`.

## Contenido de la carpeta

```
extension/
├── manifest.json          configuración de la extensión (Manifest V3)
├── background.js          service worker: consulta a Supabase y guarda la caché
├── content.js             se ejecuta en kick.com y conecta con el service worker
├── kcx-core.js            detecta mensajes y aplica pintura + insignia
├── paints.css             estilos de las pinturas y de la insignia
├── settings.js            valores de fábrica (Supabase y dirección de la web)
├── popup.html / .css / .js   ventana de la extensión
├── badges/                fruta, gema, mascara, caja y tiempo (.svg)
├── icons/                 icon-16, 32, 48 y 128 (.png)
└── tools/
    ├── sprites.json       paleta y sprites de las insignias
    ├── make_assets.py     regenera badges/ e icons/
    └── build_obs.py       genera overlay/kcx-obs.js
```
