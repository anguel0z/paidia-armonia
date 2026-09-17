"""One-off: crop the regenerated grid-sheet images into individual product icons.

Each sheet is a photorealistic contact-sheet of white-background product
shots laid out in a regular grid. This slices each cell (with a small inset
to avoid grid lines), trims tight to the subject by diffing against white,
then pads out to a SQUARE canvas centered on the subject — so every icon is
safe to drop into a circular (object-fit:cover) placeholder without clipping
edges, regardless of the product's natural aspect ratio (bananas, the broom,
etc). Saves as icons/fridge/<icon_filename> per
lager-product-image-prompts.csv's naming.
"""
from pathlib import Path
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "icons" / "fridge"
OUT.mkdir(parents=True, exist_ok=True)

DOWNLOADS = Path(r"C:\Users\dadal\Downloads")
SHEETS = {
    "dairy": DOWNLOADS / "Generated Image September 15, 2026 - 2_03PM.jpg",
    "pantry": DOWNLOADS / "Generated Image September 15, 2026 - 2_04PM.jpg",
    "produce": DOWNLOADS / "Generated Image September 15, 2026 - 2_04PM (1).jpg",
    "household": DOWNLOADS / "Generated Image September 15, 2026 - 2_05PM.jpg",
}

GRID = {
    "dairy": (6, 4),      # cols, rows
    "pantry": (6, 3),
    "produce": (5, 3),
    "household": (5, 3),
}

# (sheet, row, col) -> icon filename. 1-indexed rows/cols, matching what was
# actually generated (grids drifted from the requested column counts, and a
# few cells duplicate an item — only the clearest cell per item is mapped).
MAPPING = {
    ("dairy", 1, 1): "milk.png",
    ("dairy", 1, 2): "butter.png",
    ("dairy", 1, 3): "margarine.png",
    ("dairy", 1, 4): "cheese-block.png",
    ("dairy", 1, 5): "shredded-cheese.png",
    ("dairy", 1, 6): "cream-cheese.png",
    ("dairy", 2, 2): "yogurt.png",
    ("dairy", 2, 4): "feta.png",
    ("dairy", 3, 1): "eggs.png",
    ("dairy", 3, 2): "ham.png",
    ("dairy", 3, 3): "salami.png",
    ("dairy", 3, 4): "tomato.png",
    ("dairy", 4, 1): "cucumber.png",
    ("dairy", 4, 2): "onion.png",
    ("dairy", 4, 3): "spring-onion.png",
    ("dairy", 4, 5): "garlic.png",

    ("pantry", 1, 1): "rice.png",
    ("pantry", 1, 2): "macaroni.png",
    ("pantry", 1, 3): "fusilli.png",
    ("pantry", 1, 5): "spaghetti.png",
    ("pantry", 2, 1): "lasagne-sheets.png",
    ("pantry", 2, 2): "corn.png",
    ("pantry", 2, 3): "salt.png",
    ("pantry", 2, 4): "black-pepper.png",
    ("pantry", 2, 5): "oil.png",
    ("pantry", 3, 1): "ketchup.png",
    ("pantry", 3, 2): "red-vinegar.png",
    ("pantry", 3, 3): "tomato-sauce.png",
    ("pantry", 3, 4): "puff-pastry.png",
    ("pantry", 3, 5): "baking-paper.png",
    ("pantry", 3, 6): "aluminium-foil.png",

    ("produce", 1, 1): "bell-pepper.png",
    ("produce", 1, 2): "zucchini.png",
    ("produce", 1, 3): "carrot.png",
    ("produce", 1, 4): "spinach.png",
    ("produce", 1, 5): "parsley.png",
    ("produce", 2, 1): "nectarine.png",
    ("produce", 2, 2): "apple.png",
    ("produce", 2, 3): "banana.png",
    ("produce", 2, 4): "lemon.png",
    ("produce", 2, 5): "watermelon.png",
    ("produce", 3, 1): "toast-bread.png",
    ("produce", 3, 2): "dark-bread.png",
    ("produce", 3, 3): "oat-flakes.png",
    ("produce", 3, 4): "cherry-jam.png",
    ("produce", 3, 5): "granola.png",

    ("household", 1, 1): "wraps.png",
    ("household", 1, 2): "vanilla-extract.png",
    ("household", 1, 3): "sweet-sour-jar.png",
    ("household", 1, 4): "cornflakes.png",
    ("household", 1, 5): "water-bottle.png",
    ("household", 2, 1): "sparkling-water.png",
    ("household", 2, 2): "toilet-paper.png",
    ("household", 2, 3): "paper-towels.png",
    ("household", 2, 4): "wet-wipes.png",
    ("household", 2, 5): "trash-bags.png",
    ("household", 3, 1): "sponges.png",
    ("household", 3, 2): "dish-soap.png",
    ("household", 3, 3): "floor-cleaner.png",
    ("household", 3, 4): "washing-machine-salt.png",
    ("household", 3, 5): "broom.png",
}

INSET = 10   # px trimmed off each cell edge to avoid grid lines
PAD = 20     # px of white padding re-added around the trimmed subject


def trim_and_square(cell: Image.Image) -> Image.Image:
    """Tighten to the subject, then pad to a centered square canvas — safe
    for any circular (object-fit:cover) placeholder regardless of the
    product's natural aspect ratio."""
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
    off_x = (side - subject.width) // 2
    off_y = (side - subject.height) // 2
    canvas.paste(subject, (off_x, off_y))
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
            out_path = OUT / fname
            cell.save(out_path, "PNG")
            written.append(fname)
    print(f"Wrote {len(written)} icons to {OUT}")
    for f in sorted(written):
        print(" -", f)


if __name__ == "__main__":
    main()
