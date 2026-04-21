from PIL import Image, ImageDraw
import os

LOGO = "public/logo.png"
RES_DIR = "android/app/src/main/res"

DENSITIES = {
    "mipmap-mdpi": 48, "mipmap-hdpi": 72, "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144, "mipmap-xxxhdpi": 192,
}
FG_SIZES = {
    "mipmap-mdpi": 108, "mipmap-hdpi": 162, "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324, "mipmap-xxxhdpi": 432,
}

def make_round(img):
    s = img.size[0]
    mask = Image.new('L', (s, s), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, s-1, s-1), fill=255)
    r = Image.new('RGBA', (s, s), (0,0,0,0))
    r.paste(img, (0,0), mask)
    return r

logo = Image.open(LOGO).convert("RGBA")

for d, s in DENSITIES.items():
    od = os.path.join(RES_DIR, d)
    os.makedirs(od, exist_ok=True)
    ps = int(s * 0.85)
    r = logo.resize((ps, ps), Image.LANCZOS)
    c = Image.new('RGBA', (s, s), (3,3,5,255))
    o = (s - ps) // 2
    c.paste(r, (o, o), r)
    rgb = Image.new('RGB', (s, s), (3,3,5))
    rgb.paste(c, (0,0), c)
    rgb.save(os.path.join(od, "ic_launcher.png"), "PNG")
    ri = make_round(rgb.copy())
    rc = Image.new('RGBA', (s, s), (0,0,0,0))
    rc.paste(ri, (0,0), ri)
    rc.save(os.path.join(od, "ic_launcher_round.png"), "PNG")
    print(f"  ok {d}: {s}x{s}")

for d, s in FG_SIZES.items():
    od = os.path.join(RES_DIR, d)
    os.makedirs(od, exist_ok=True)
    ls = int(s * 0.55)
    r = logo.resize((ls, ls), Image.LANCZOS)
    c = Image.new('RGBA', (s, s), (0,0,0,0))
    o = (s - ls) // 2
    c.paste(r, (o, o), r)
    c.save(os.path.join(od, "ic_launcher_foreground.png"), "PNG")
    print(f"  ok {d} fg: {s}x{s}")

print("done")
