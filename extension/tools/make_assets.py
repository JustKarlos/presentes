#!/usr/bin/env python3
"""Genera las imágenes que pide manifest.json y que no se dibujan a mano:

    badges/<rango>.svg   insignias de rango que se muestran en el chat (una por rango)
    icons/icon-N.png     iconos de la extensión (16, 32, 48 y 128 px)

Todo sale de tools/sprites.json (la misma paleta y los mismos sprites de la web), así que
si cambias un sprite basta con volver a ejecutar el script:

    python3 extension/tools/make_assets.py

Solo usa la biblioteca estándar de Python 3: no hay que instalar nada.
Si prefieres iconos propios, reemplaza los PNG a mano y no vuelvas a ejecutarlo.
"""
import json
import pathlib
import struct
import zlib

EXT = pathlib.Path(__file__).resolve().parents[1]            # carpeta extension/
DATA = json.loads((EXT / "tools" / "sprites.json").read_text(encoding="utf-8"))
PAL, SPRITES = DATA["PAL"], DATA["SPRITES"]

ICON_SPRITE = "fruta"                                        # sprite que va dentro del icono
ICON_SIZES = (16, 32, 48, 128)
FRAME = {"outline": "#150a03", "wood": "#8a552a", "fill": "#1d3b24"}   # contorno, madera y fondo de selva


# ---------- insignias (SVG) ----------
def svg(key):
    """Un <rect> por cada tramo horizontal del mismo color: archivos chicos y bordes nítidos."""
    rows, rects = SPRITES[key], []
    for y, row in enumerate(rows):
        x = 0
        while x < len(row):
            c = row[x]
            if c == ".":
                x += 1
                continue
            end = x
            while end < len(row) and row[end] == c:
                end += 1
            rects.append(f'<rect x="{x}" y="{y}" width="{end - x}" height="1" fill="{PAL[c]}"/>')
            x = end
    w, h = len(rows[0]), len(rows)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w * 2}" height="{h * 2}" '
            f'viewBox="0 0 {w} {h}" shape-rendering="crispEdges">' + "".join(rects) + "</svg>\n")


# ---------- iconos (PNG, sin dependencias) ----------
def png(w, h, rgba):
    raw = b"".join(b"\x00" + bytes(rgba[y * w * 4:(y + 1) * w * 4]) for y in range(h))   # filtro 0 en cada fila

    def chunk(tag, body):
        return struct.pack(">I", len(body)) + tag + body + struct.pack(">I", zlib.crc32(tag + body) & 0xFFFFFFFF)

    return (b"\x89PNG\r\n\x1a\n"
            + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(raw, 9))
            + chunk(b"IEND", b""))


def hex_rgb(h):
    h = h.lstrip("#")
    return bytes(int(h[i:i + 2], 16) for i in (0, 2, 4))


def icon(n):
    px = bytearray(n * n * 4)                                # empieza todo transparente

    def put(x, y, color):
        i = (y * n + x) * 4
        px[i:i + 4] = hex_rgb(color) + b"\xff"

    b = max(1, round(n / 32))                                # grosor de cada línea del marco (contorno y madera)
    for y in range(n):
        for x in range(n):
            if (x < b or x >= n - b) and (y < b or y >= n - b):
                continue                                     # esquinas cortadas, estilo pixel-art
            edge = min(x, y, n - 1 - x, n - 1 - y)
            put(x, y, FRAME["outline"] if edge < b else FRAME["wood"] if edge < 2 * b else FRAME["fill"])

    rows = SPRITES[ICON_SPRITE]
    s = (n - 6 * b) // len(rows[0])                          # ampliación entera: los píxeles quedan nítidos
    ox, oy = (n - s * len(rows[0])) // 2, (n - s * len(rows)) // 2
    for ry, row in enumerate(rows):
        for rx, c in enumerate(row):
            if c == ".":
                continue
            for dy in range(s):
                for dx in range(s):
                    put(ox + rx * s + dx, oy + ry * s + dy, PAL[c])
    return png(n, n, px)


def main():
    (EXT / "badges").mkdir(exist_ok=True)
    (EXT / "icons").mkdir(exist_ok=True)
    for key in SPRITES:
        (EXT / "badges" / f"{key}.svg").write_text(svg(key), encoding="utf-8")
    for n in ICON_SIZES:
        (EXT / "icons" / f"icon-{n}.png").write_bytes(icon(n))
    print(f"badges/: {', '.join(k + '.svg' for k in SPRITES)}")
    print(f"icons/:  {', '.join(f'icon-{n}.png' for n in ICON_SIZES)}")


if __name__ == "__main__":
    main()
