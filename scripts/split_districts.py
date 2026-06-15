from pathlib import Path
from PIL import Image

base = Path(
    r"C:\Users\jarro\.cursor\projects\c-Projects-gang-wars-GangWars\assets"
)
out_dir = Path(__file__).resolve().parent.parent / "assets"
out_dir.mkdir(parents=True, exist_ok=True)

grids = [
    (base / "c__Users_jarro_AppData_Roaming_Cursor_User_workspaceStorage_b8abd18152c996897b88164cd8a20284_images_image-680d5424-3274-4f27-89d1-2602d46460db.png",
     ["little-italy", "dock-13", "kitty-kat-club"]),
    (base / "c__Users_jarro_AppData_Roaming_Cursor_User_workspaceStorage_b8abd18152c996897b88164cd8a20284_images_image-b80f9812-8e21-4baf-8919-bc7abdf919eb.png",
     ["uptown", "warehouse-district", "city-hall"]),
]

for src, names in grids:
    img = Image.open(src)
    w, h = img.size
    col_w = w // 3
    for i, name in enumerate(names):
        x0 = i * col_w
        x1 = w if i == 2 else (i + 1) * col_w
        panel = img.crop((x0, 0, x1, h))
        out = out_dir / f"{name}.png"
        panel.save(out)
        print(f"Saved {out.name}: {panel.size}")

print("Done")
