#!/usr/bin/env python3
"""
Compute CSS Fonts Module Level 5 fallback-metric overrides for Natspaper.

Measures the self-hosted webfonts (@fontsource) and the local system fonts used
as their loading fallbacks, then derives `size-adjust` / `ascent-override` /
`descent-override` / `line-gap-override` values so the fallback occupies the
same layout box as the webfont (zero-CLS font swaps).

size-adjust is derived from the measured average glyph advance over a
per-script character set (OS/2.xAvgCharWidth is unreliable for modern
proportional fonts — Inter reports a nominal 1250).

Algorithm (same family as next/font's fallback generator):
  size-adjust        = web.avgAdvanceRatio / fb.avgAdvanceRatio
  ascent-override    = (web.hhea.ascent  / web.upem) / size-adjust
  descent-override   = (|web.hhea.descent| / web.upem) / size-adjust
  line-gap-override  = (web.hhea.lineGap / web.upem) / size-adjust

Usage: python scripts/compute-font-fallbacks.py
"""

import glob
import os
import re
import sys

from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = os.path.join(ROOT, "node_modules", "@fontsource")
SYSFONTS = os.environ.get("WINDIR", r"C:\Windows") + r"\Fonts"

LATIN_SET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
GEORGIAN_CHARS = "აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ"


def read_font(path: str) -> dict:
    font = TTFont(path, lazy=True)
    head, hhea, os2 = font["head"], font["hhea"], font["OS/2"]
    cmap = font.getBestCmap()
    hmtx = font["hmtx"]
    glyphset = font.getGlyphSet()
    try:
        features = {
            rec.FeatureTag for rec in font["GSUB"].table.FeatureList.FeatureRecord
        }
    except Exception:
        features = set()
    return {
        "path": path,
        "upm": head.unitsPerEm,
        "asc": hhea.ascent,
        "desc": abs(hhea.descent),
        "lineGap": hhea.lineGap,
        "xHeight": getattr(os2, "sxHeight", None),
        "capHeight": getattr(os2, "sCapHeight", None),
        "cmap": cmap,
        "hmtx": hmtx,
        "glyphset": glyphset,
        "georgian": all(ord(c) in cmap for c in GEORGIAN_CHARS),
        "sups": "sups" in features,
    }


def avg_advance(m: dict, charset: str) -> float:
    """Average advance width (per em) over chars of `charset` the font covers."""
    advances = []
    for ch in charset:
        gname = m["cmap"].get(ord(ch))
        if gname and gname in m["hmtx"].metrics:
            advances.append(m["hmtx"][gname][0])
    if not advances:
        raise ValueError(f"no glyphs of charset found in {m['path']}")
    return (sum(advances) / len(advances)) / m["upm"]


def zero_advance(m: dict) -> float:
    gname = m["cmap"].get(ord("0"))
    if not gname or gname not in m["hmtx"].metrics:
        return float("nan")
    return m["hmtx"][gname][0] / m["upm"]


def overrides(web: dict, fb: dict, charset: str) -> dict:
    sa = avg_advance(web, charset) / avg_advance(fb, charset)
    return {
        "size-adjust": f"{sa * 100:.2f}%",
        "ascent-override": f"{(web['asc'] / web['upm']) / sa * 100:.2f}%",
        "descent-override": f"{(web['desc'] / web['upm']) / sa * 100:.2f}%",
        "line-gap-override": f"{(web['lineGap'] / web['upm']) / sa * 100:.2f}%",
    }


def unicode_ranges(css_path: str, subsets: list[str]) -> str:
    """Concatenate the fontsource unicode-range values for the given subsets."""
    css = open(css_path, encoding="utf-8").read()
    blocks = re.findall(r"/\* ([\w-]+) \*/\s*@font-face\s*\{(.*?)\}", css, re.S)
    picked = []
    for name, body in blocks:
        # fontsource comment ids look like `inter-latin-400-normal`;
        # the subset is the third token from the end.
        if name.split("-")[-3] in subsets:
            picked += re.search(r"unicode-range:\s*([^;]+);", body).group(1).split(",")
    return " ".join(p.strip() for p in picked)


def show(name: str, m: dict) -> None:
    print(f"{name:26s} upm={m['upm']:5d} hhea={m['asc']}/-{m['desc']}/{m['lineGap']}"
          f" xH={m['xHeight']} capH={m['capHeight']} geo={m['georgian']}"
          f" sups={m['sups']} 0adv={zero_advance(m):.4f}")
    print(f"{'':26s}   -> {m['path']}")


def main() -> None:
    inter400 = f"{FILES}/inter/files/inter-latin-400-normal.woff2"
    inter700 = f"{FILES}/inter/files/inter-latin-700-normal.woff2"
    nsg400 = f"{FILES}/noto-sans-georgian/files/noto-sans-georgian-georgian-400-normal.woff2"
    nsg700 = f"{FILES}/noto-sans-georgian/files/noto-sans-georgian-georgian-700-normal.woff2"
    jbm400 = f"{FILES}/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2"
    jbm700 = f"{FILES}/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2"
    arial = f"{SYSFONTS}\\arial.ttf"
    segoe = f"{SYSFONTS}\\segoeui.ttf"
    consolas = f"{SYSFONTS}\\consola.ttf"

    print("== WEB FONTS ==")
    for name, p in [("Inter 400", inter400), ("Inter 700", inter700),
                    ("NotoSansGeorgian 400", nsg400), ("NotoSansGeorgian 700", nsg700),
                    ("JetBrainsMono 400", jbm400), ("JetBrainsMono 700", jbm700)]:
        show(name, read_font(p))

    print("\n== SYSTEM FALLBACKS ==")
    for name, p in [("Arial", arial), ("Segoe UI", segoe), ("Consolas", consolas)] + \
                   [(f"Sylfaen", p) for p in glob.glob(f"{SYSFONTS}\\*ylfaen*")]:
        show(name, read_font(p))

    print("\n== DERIVED OVERRIDES ==")
    faces = [
        ("Inter Fallback", inter400, arial, LATIN_SET,
         f"{FILES}/inter/400.css",
         ["latin", "latin-ext", "cyrillic", "cyrillic-ext", "greek", "greek-ext", "vietnamese"]),
        ("Georgian Fallback", nsg400, segoe, GEORGIAN_CHARS,
         f"{FILES}/noto-sans-georgian/400.css",
         ["georgian"]),
        ("Mono Fallback", jbm400, consolas, LATIN_SET,
         f"{FILES}/jetbrains-mono/400.css",
         ["latin", "latin-ext", "cyrillic", "cyrillic-ext", "greek", "greek-ext", "vietnamese"]),
    ]
    for label, w, f, cs, css_path, subsets in faces:
        wm, fm = read_font(w), read_font(f)
        ov = overrides(wm, fm, cs)
        ur = unicode_ranges(css_path, subsets)
        print(f"\n/* {label} — src: {os.path.basename(f)}; measured over "
              f"{'Latin' if cs is LATIN_SET else 'Georgian'} charset */")
        print("@font-face {")
        print(f'  font-family: "{label}";')
        print(f"  size-adjust: {ov['size-adjust']};")
        print(f"  ascent-override: {ov['ascent-override']};")
        print(f"  descent-override: {ov['descent-override']};")
        print(f"  line-gap-override: {ov['line-gap-override']};")
        print(f"  unicode-range: {ur};")
        print("}")

    inter = read_font(inter400)
    print("\n== font-size-adjust reference (Inter) ==")
    print(f"  ex-height ratio = sxHeight/upem = {inter['xHeight'] / inter['upm']:.4f}")
    print(f"  cap-height ratio = sCapHeight/upem = {inter['capHeight'] / inter['upm']:.4f}")


if __name__ == "__main__":
    sys.exit(main())
