"""One-off: crop a curated set of NEW (non-catalog-duplicate) icons from the
second batch of generated grid sheets, using the same square/circle-safe
trim as crop-product-icons.py. Cells showing a real, recognizable brand
name (e.g. a Kellogg's- or Heinz-style logo) were deliberately skipped in
favor of the plainer/generic-labeled cells, or left out entirely if no safe
cell existed for that product.

These are an ICON LIBRARY, not necessarily 1:1 with existing catalog
product ids — they feed the "add product" icon picker / autofill so staff
can pick a ready icon for products the catalog doesn't have yet (schnitzel,
tuna, leek, ...).
"""
from pathlib import Path
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "icons" / "fridge"
OUT.mkdir(parents=True, exist_ok=True)

DOWNLOADS = Path(r"C:\Users\dadal\Downloads")
SHEETS = {
    "produce2": DOWNLOADS / "Generated Image September 15, 2026 - 2_10PM.jpg",
    "meat2": DOWNLOADS / "Generated Image September 15, 2026 - 2_12PM.jpg",
    "bakery2": DOWNLOADS / "Generated Image September 15, 2026 - 2_14PM.jpg",
    "pantry2": DOWNLOADS / "Generated Image September 15, 2026 - 2_15PM.jpg",
    "drinks2": DOWNLOADS / "Generated Image September 15, 2026 - 2_17PM.jpg",
    "household2": DOWNLOADS / "Generated Image September 15, 2026 - 2_19PM.jpg",
}

GRID = {
    "produce2": (6, 4),
    "meat2": (3, 2),
    "bakery2": (3, 2),
    "pantry2": (7, 4),
    "drinks2": (3, 2),
    "household2": (5, 3),
}

MAPPING = {
    ("produce2", 1, 3): "chili-pepper.png",
    ("produce2", 2, 2): "potato.png",
    ("produce2", 2, 4): "leek.png",
    ("produce2", 4, 1): "celery.png",
    ("produce2", 4, 3): "ginger.png",
    ("produce2", 4, 4): "red-cabbage.png",

    ("meat2", 1, 1): "schnitzel.png",
    ("meat2", 1, 2): "deli-meat.png",
    ("meat2", 2, 2): "sausages.png",
    ("meat2", 2, 3): "tuna-can.png",

    ("bakery2", 2, 1): "bougatsa.png",
    ("bakery2", 2, 2): "cake-slice.png",
    ("bakery2", 2, 3): "baklava.png",

    ("pantry2", 1, 5): "wheat-flour.png",
    ("pantry2", 1, 6): "sugar.png",
    ("pantry2", 1, 7): "frappe-coffee.png",
    ("pantry2", 2, 5): "tomato-paste.png",
    ("pantry2", 3, 4): "oregano.png",
    ("pantry2", 3, 5): "vegetable-bouillon.png",
    ("pantry2", 3, 7): "honey.png",
    ("pantry2", 4, 3): "canned-peaches.png",
    ("pantry2", 4, 4): "vanilla-pudding.png",
    ("pantry2", 4, 5): "koulourakia.png",

    ("drinks2", 1, 1): "frozen-spinach.png",
    ("drinks2", 1, 2): "frozen-peas.png",
    ("drinks2", 2, 2): "sparkling-water-glass.png",
    ("drinks2", 2, 3): "fruit-juice.png",

    ("household2", 2, 3): "glass-cleaner.png",
    ("household2", 2, 5): "fabric-softener.png",
    ("household2", 3, 1): "rubber-gloves.png",
    ("household2", 3, 3): "napkins.png",
    ("household2", 3, 5): "air-freshener.png",
}

INSET = 10
PAD = 20


def trim_and_square(cell: Image.Image) -> Image.Image:
    rgb = cell.convert("RGB")
    bg = Image.new("RGB", rgb.size, (255, 255, 255))
    diff = ImageChops.difference(rgb, bg)
    bbox = diff.point(lambda p: 255 if p > 18 else 0).getbbox()
    if not bbox:
        bbox = (0, 0, cell.width, cell.height)
    x0, y0, x1, y1 = bbox
    x0 = max(0, x0 - PAD)
    y0 = max(0, y0 - PAD)
    x1 = min(cell.width, x1 + PAD)
    y1 = min(cell.height, y1 + PAD)
    subject = cell.crop((x0, y0, x1, y1))
    side = max(subject.width, subject.height)
    canvas = Image.new("RGB", (side, side), (255, 255, 255))
    canvas.paste(subject, ((side - subject.width) // 2, (side - subject.height) // 2))
    return canvas


def main():
    written = []
    for sheet_name, path in SHEETS.items():
        if not path.exists():
            print(f"MISSING SHEET FILE: {path}")
            continue
        im = Image.open(path).convert("RGB")
        cols, rows = GRID[sheet_name]
        cell_w = im.width / cols
        cell_h = im.height / rows
        for (sname, r, c), fname in MAPPING.items():
            if sname != sheet_name:
                continue
            x0 = round((c - 1) * cell_w) + INSET
            y0 = round((r - 1) * cell_h) + INSET
            x1 = round(c * cell_w) - INSET
            y1 = round(r * cell_h) - INSET
            cell = im.crop((x0, y0, x1, y1))
            cell = trim_and_square(cell)
            cell.save(OUT / fname, "PNG")
            written.append(fname)
    print(f"Wrote {len(written)} new icons to {OUT}")
    for f in sorted(written):
        print(" -", f)


if __name__ == "__main__":
    main()
