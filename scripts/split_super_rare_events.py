from PIL import Image
from pathlib import Path

src = Path(
    r"C:\Users\jarro\.cursor\projects\c-Projects-gang-wars-GangWars\assets"
    r"\c__Users_jarro_AppData_Roaming_Cursor_User_workspaceStorage_b8abd18152c996897b88164cd8a20284"
    r"_images_image-326035a2-e473-400a-af84-c8f73504f142.png"
)
out_dir = Path(__file__).resolve().parent.parent / "events"
out_dir.mkdir(parents=True, exist_ok=True)

img = Image.open(src).convert("RGB")
w, h = img.size

col_bounds = [(2, 201), (205, 403), (407, 612), (616, 816), (820, w - 2)]
row_bounds = [(2, 338), (344, h - 2)]

names = [
    "super_ruth",
    "super_lindbergh",
    "super_dempsey",
    "super_wales",
    "super_kkrevue",
    "super_mauretania",
    "super_ziegfeld",
    "super_wallst",
    "super_walker",
    "super_hollywood",
]

target_w, target_h = 199, 324

idx = 0
for y0, y1 in row_bounds:
    for x0, x1 in col_bounds:
        panel = img.crop((x0, y0, x1, y1))
        panel = panel.resize((target_w, target_h), Image.Resampling.LANCZOS)
        out = out_dir / f"{names[idx]}.png"
        panel.save(out, optimize=True)
        print(f"Saved {out.name}: {panel.size}")
        idx += 1

print("Done:", idx, "images")
