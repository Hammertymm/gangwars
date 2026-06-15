from PIL import Image, ImageDraw

SIZE = 48
BG = (0, 0, 0, 0)
SHADOW = (18, 10, 4, 255)
DARK = (28, 16, 6, 255)
MID = (100, 62, 20, 255)
BRONZE = (150, 100, 30, 255)
GOLD = (215, 175, 85, 255)
LIGHT = (240, 210, 130, 255)
PALE = (250, 235, 195, 255)
FRAME = (74, 59, 34, 255)


def new():
    return Image.new("RGBA", (SIZE, SIZE), BG)


def save(img, name):
    img.save(f"assets/goods/{name}.png")


def frame(d):
    d.rectangle([1, 1, SIZE - 2, SIZE - 2], outline=FRAME, width=1)
    d.rectangle([2, 2, SIZE - 3, SIZE - 3], outline=GOLD, width=1)


def jug(img):
    d = ImageDraw.Draw(img)
    frame(d)
    d.ellipse([11, 26, 35, 44], fill=MID, outline=GOLD, width=2)
    d.ellipse([13, 28, 33, 42], fill=DARK)
    d.rectangle([17, 11, 29, 28], fill=BRONZE, outline=GOLD, width=2)
    d.polygon([(17, 11), (29, 11), (27, 6), (19, 6)], fill=GOLD, outline=LIGHT)
    d.arc([28, 16, 40, 32], 270, 90, fill=GOLD, width=2)
    for i, x in enumerate([19, 22, 25]):
        d.rectangle([x, 15, x + 2, 20], fill=LIGHT)
        d.rectangle([x, 15, x + 2, 20], outline=GOLD)


def cigars(img):
    d = ImageDraw.Draw(img)
    frame(d)
    d.rectangle([6, 22, 40, 42], fill=DARK, outline=GOLD, width=2)
    d.rectangle([8, 24, 38, 40], fill=(24, 14, 4, 255))
    d.polygon([(6, 22), (40, 22), (37, 14), (9, 14)], fill=BRONZE, outline=GOLD, width=2)
    for i, x in enumerate([11, 18, 25, 32]):
        d.rectangle([x, 5 + i % 2, x + 6, 16], fill=MID, outline=GOLD, width=1)
        d.ellipse([x + 1, 3, x + 5, 8], fill=LIGHT, outline=GOLD)


def bathgin(img):
    d = ImageDraw.Draw(img)
    frame(d)
    d.rectangle([15, 13, 31, 42], fill=MID, outline=GOLD, width=2)
    d.rectangle([16, 15, 30, 40], fill=(20, 30, 42, 255))
    d.line([(19, 17), (19, 38)], fill=(70, 95, 120, 200), width=2)
    d.rectangle([16, 22, 30, 32], fill=PALE, outline=GOLD, width=1)
    for y in [24, 27, 30]:
        d.line([(18, y), (28, y)], fill=DARK, width=1)
    d.rectangle([16, 6, 30, 13], fill=GOLD, outline=LIGHT, width=1)
    d.rectangle([18, 3, 28, 7], fill=LIGHT, outline=GOLD)


def art_icon(img):
    d = ImageDraw.Draw(img)
    frame(d)
    d.rectangle([5, 6, 42, 41], fill=GOLD, width=2)
    d.rectangle([8, 9, 39, 38], fill=DARK, outline=BRONZE, width=1)
    d.rectangle([10, 24, 37, 35], fill=(35, 65, 30, 255))
    d.polygon([(10, 24), (32, 14), (37, 24)], fill=(50, 90, 40, 255), outline=(30, 55, 25, 255))
    d.ellipse([20, 26, 28, 32], fill=(210, 190, 70, 255), outline=GOLD)


def scotch(img):
    d = ImageDraw.Draw(img)
    frame(d)
    d.polygon([(14, 9), (33, 9), (34, 40), (13, 40)], fill=MID, outline=GOLD, width=2)
    d.polygon([(15, 11), (32, 11), (33, 38), (14, 38)], fill=(26, 14, 4, 255))
    d.rectangle([17, 4, 31, 10], fill=GOLD, outline=LIGHT, width=1)
    d.rectangle([16, 16, 32, 28], fill=PALE, outline=BRONZE, width=2)
    d.rectangle([20, 19, 28, 25], fill=DARK)
    d.line([(21, 20), (27, 24)], fill=LIGHT, width=1)
    d.line([(27, 20), (21, 24)], fill=LIGHT, width=1)


def counterfeits(img):
    d = ImageDraw.Draw(img)
    frame(d)
    stacks = [(4, 6), (8, 10), (12, 14), (16, 18)]
    for ox, oy in stacks:
        d.rectangle([7 + ox, 9 + oy, 33 + ox, 27 + oy], fill=PALE, outline=GOLD, width=2)
        d.ellipse([15 + ox, 14 + oy, 25 + ox, 22 + oy], fill=MID, outline=BRONZE, width=1)
        d.rectangle([18 + ox, 16 + oy, 22 + ox, 20 + oy], fill=DARK)


def cognac(img):
    d = ImageDraw.Draw(img)
    frame(d)
    d.ellipse([10, 22, 36, 44], fill=MID, outline=GOLD, width=2)
    d.ellipse([12, 24, 34, 42], fill=(40, 22, 6, 255))
    d.rectangle([16, 7, 30, 24], fill=BRONZE, outline=GOLD, width=2)
    d.arc([14, 4, 32, 14], 0, 180, fill=LIGHT, width=2)
    d.rectangle([19, 2, 27, 7], fill=GOLD, outline=LIGHT)
    d.arc([14, 24, 26, 40], 200, 320, fill=LIGHT, width=2)


def furcoats(img):
    d = ImageDraw.Draw(img)
    frame(d)
    d.arc([11, 3, 35, 16], 180, 0, fill=GOLD, width=2)
    d.line([(23, 3), (23, 9)], fill=GOLD, width=2)
    d.polygon([(8, 14), (38, 14), (40, 42), (6, 42)], fill=BRONZE, outline=GOLD, width=2)
    d.polygon([(11, 16), (35, 16), (37, 40), (9, 40)], fill=MID)
    for y in range(18, 38, 4):
        d.line([(10, y), (36, y)], fill=DARK, width=1)
    d.line([(23, 16), (18, 34)], fill=DARK, width=2)
    d.line([(23, 16), (28, 34)], fill=DARK, width=2)


def champagne(img):
    d = ImageDraw.Draw(img)
    frame(d)
    d.polygon([(15, 11), (31, 11), (32, 42), (14, 42)], fill=MID, outline=GOLD, width=2)
    d.polygon([(16, 13), (30, 13), (31, 40), (15, 40)], fill=(30, 16, 4, 255))
    d.rectangle([14, 4, 32, 12], fill=GOLD, outline=LIGHT, width=2)
    d.polygon([(14, 4), (32, 4), (29, 1), (17, 1)], fill=LIGHT, outline=GOLD)
    d.line([(15, 13), (31, 13)], fill=LIGHT, width=1)
    d.line([(16, 22), (30, 22)], fill=(55, 32, 10, 255), width=1)


def diamonds(img):
    d = ImageDraw.Draw(img)
    frame(d)
    d.polygon([(24, 3), (42, 21), (24, 44), (6, 21)], fill=GOLD, width=2)
    d.polygon([(24, 6), (39, 21), (24, 41), (9, 21)], fill=LIGHT)
    d.polygon([(24, 6), (39, 21), (24, 21)], fill=PALE)
    d.polygon([(24, 6), (9, 21), (24, 21)], fill=LIGHT)
    d.polygon([(24, 41), (39, 21), (24, 21)], fill=BRONZE)
    d.polygon([(24, 41), (9, 21), (24, 21)], fill=MID)
    d.line([(24, 6), (24, 41)], fill=GOLD, width=2)
    d.line([(9, 21), (39, 21)], fill=GOLD, width=2)
    d.ellipse([21, 10, 27, 16], fill=PALE)


icons = {
    "moonshine": jug,
    "cigars": cigars,
    "bathgin": bathgin,
    "art": art_icon,
    "scotch": scotch,
    "counterfeits": counterfeits,
    "cognac": cognac,
    "furcoats": furcoats,
    "champagne": champagne,
    "diamonds": diamonds,
}

for name, fn in icons.items():
    im = new()
    fn(im)
    save(im, name)
    print("ok", name)
