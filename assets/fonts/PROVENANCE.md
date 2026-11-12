# Procedencia de las fuentes — assets/fonts/

Las tipografías del sitio están **autoalojadas**: no hay ninguna dependencia
de un CDN externo en tiempo de ejecución.

| Archivo | Familia | Peso | Subconjunto | Origen |
|---|---|---|---|---|
| `barlow-condensed-500-latin.woff2` | Barlow Condensed | 500 | latin | Google Fonts (SIL OFL 1.1) |
| `barlow-condensed-600-latin.woff2` | Barlow Condensed | 600 | latin | Google Fonts (SIL OFL 1.1) |
| `barlow-condensed-700-latin.woff2` | Barlow Condensed | 700 | latin | Google Fonts (SIL OFL 1.1) |
| `barlow-condensed-800-latin.woff2` | Barlow Condensed | 800 | latin | Google Fonts (SIL OFL 1.1) |
| `nunito-var-latin.woff2` | Nunito | 400–800 (variable) | latin | Google Fonts (SIL OFL 1.1) |

El subconjunto `latin` alcanza para el español (es-AR) que usa la página: la
paginación cubre `U+0000-00FF`, así que `á é í ó ú ñ ü ¿ ¡` están incluidos.
Por eso no se versionaron los archivos `latin-ext`: nadie los referenciaba y
solo sumaban peso muerto al repositorio.

Se descargaron de `fonts.googleapis.com` / `fonts.gstatic.com` y se versionaron
en el repo para que la página renderice igual sin red y sin la latencia de un
tercer servidor. Ambas familias son las que ya usaban `admin.html`,
`overlay/` y el sitio antes del rediseño.

Los `.woff2` no admiten chunks `tEXt` como los PNG, así que esta tabla es su
procedencia. El resto de los rasters del sitio lleva su origen embebido en el
propio archivo (`impeccable:prompt`), verificable con:

```
.opencode/skills/impeccable/scripts/impeccable.cmd embed-prompt --scan assets/frames assets/backgrounds
```

## Arte generado en esta ronda

Ningún PNG nuevo. La portada no lleva props dibujados: el arte es el que ya
estaba en `assets/` (la vista de la selva, el cartel, el podio, las tablas).
Las insignias de rango —fruta Wumpa, gema, máscara Aku Aku, caja y reliquia—
siguen siendo los sprites de `rank-engine.js`.
