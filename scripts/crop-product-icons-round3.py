"""Round 3: replace product icons using ONLY the newest set of grid sheets
(the 2:10PM-2:19PM batch), superseding whichever earlier sheet produced the
same filename. Same trim-then-square-pad pipeline as crop-product-icons.py
so every icon stays safe inside a circular (object-fit:cover) placeholder.
"""
from pathlib import Path
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "icons" / "fridge"
OUT.mkdir(parents=True, exist_ok=True)

DOWNLOADS = Path(r"C:\Users\dadal\Downloads")
SHEETS = {
    "produce": DOWNLOADS / "Generated Image September 15, 2026 - 2_10PM.jpg",
    "dairy": DOWNLOADS / "Generated Image September 15, 2026 - 2_11PM.jpg",
    "meat": DOWNLOADS / "Generated Image September 15, 2026 - 2_12PM.jpg",
    "bakery": DOWNLOADS / "Generated Image September 15, 2026 - 2_14PM.jpg",
    "drinks": DOWNLOADS / "Generated Image September 15, 2026 - 2_17PM.jpg",
    "pantry": DOWNLOADS / "Generated Image September 15, 2026 - 2_18PM.jpg",
    "household": DOWNLOADS / "Generated Image September 15, 2026 - 2_19PM.jpg",
}

GRID = {
    "produce": (6, 4),
    "dairy": (5, 3),
    "meat": (3, 2),
    "bakery": (3, 2),
    "drinks": (3, 2),
    "pantry": (5, 4),
    "household": (5, 3),
}

MAPPING = {
    ("produce", 1, 1): "tomato.png",
    ("produce", 1, 2): "cucumber.png",
    ("produce", 1, 3): "chili-pepper.png",
    ("produce", 1, 4): "bell-pepper.png",
    ("produce", 1, 5): "onion.png",
    ("produce", 1, 6): "apple.png",
    ("produce", 2, 2): "potato.png",
    ("produce", 2, 4): "leek.png",
    ("produce", 2, 5): "carrot.png",
    ("produce", 3, 2): "nectarine.png",
    ("produce", 3, 3): "banana.png",
    ("produce", 3, 4): "lemon.png",
    ("produce", 3, 5): "watermelon.png",
    ("produce", 4, 1): "celery.png",
    ("produce", 4, 2): "parsley.png",
    ("produce", 4, 3): "ginger.png",
    ("produce", 4, 4): "red-cabbage.png",

    ("dairy", 1, 1): "milk.png",
    ("dairy", 1, 3): "eggs.png",
    ("dairy", 2, 1): "cheese-block.png",
    ("dairy", 2, 2): "shredded-cheese.png",
    ("dairy", 2, 4): "cream-cheese.png",
    ("dairy", 3, 1): "margarine.png",
    ("dairy", 3, 3): "yogurt.png",

    ("meat", 1, 1): "schnitzel.png",
    ("meat", 1, 2): "deli-meat.png",
    ("meat", 1, 3): "salami.png",
    ("meat", 2, 1): "ham.png",
    ("meat", 2, 2): "sausages.png",
    ("meat", 2, 3): "tuna-can.png",

    ("bakery", 1, 1): "toast-bread.png",
    ("bakery", 1, 2): "dark-bread.png",
    ("bakery", 1, 3): "wraps.png",
    ("bakery", 2, 1): "bougatsa.png",
    ("bakery", 2, 2): "cake-slice.png",
    ("bakery", 2, 3): "baklava.png",

    ("drinks", 1, 1): "frozen-spinach.png",
    ("drinks", 1, 2): "frozen-peas.png",
    ("drinks", 1, 3): "water-bottle.png",
    ("drinks", 2, 2): "sparkling-water-glass.png",
    ("drinks", 2, 3): "fruit-juice.png",

    ("pantry", 1, 1): "rice.png",
    ("pantry", 1, 2): "spaghetti.png",
    ("pantry", 1, 3): "cornflakes.png",
    ("pantry", 1, 4): "granola.png",
    ("pantry", 1, 5): "wheat-flour.png",
    ("pantry", 2, 1): "sugar.png",
    ("pantry", 2, 2): "frappe-coffee.png",
    ("pantry", 2, 3): "corn.png",
    ("pantry", 2, 4): "tomato-sauce.png",
    ("pantry", 2, 5): "tomato-paste.png",
    ("pantry", 3, 1): "ketchup.png",
    ("pantry", 3, 2): "salt.png",
    ("pantry", 3, 3): "black-pepper.png",
    ("pantry", 3, 4): "oregano.png",
    ("pantry", 3, 5): "vegetable-bouillon.png",
    ("pantry", 4, 2): "honey.png",
    ("pantry", 4, 3): "canned-peaches.png",
    ("pantry", 4, 4): "vanilla-pudding.png",
    ("pantry", 4, 5): "koulourakia.png",

    ("household", 1, 1): "paper-towels.png",
    ("household", 1, 2): "toilet-paper.png",
    ("household", 1, 3): "wet-wipes.png",
    ("household", 1, 4): "trash-bags.png",
    ("household", 2, 2): "floor-cleaner.png",
    ("household", 2, 3): "glass-cleaner.png",
    ("household", 2, 4): "dish-soap.png",
    ("household", 3, 1): "rubber-gloves.png",
    ("household", 3, 2): "sponges.png",
    ("household", 3, 3): "napkins.png",
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
