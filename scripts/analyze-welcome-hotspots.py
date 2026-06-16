"""Detect individual button rectangles in welcome artwork."""
from PIL import Image
import numpy as np

path = r"C:\Users\jarro\.cursor\projects\c-Projects-gang-wars-GangWars\assets\c__Users_jarro_AppData_Roaming_Cursor_User_workspaceStorage_b8abd18152c996897b88164cd8a20284_images_image-edb0ebf9-d31f-48cf-a9b4-1e4e494a40de.png"
img = Image.open(path).convert("RGB")
w, h = img.size
arr = np.array(img)
r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
gold = (r.astype(int) + g.astype(int) > 260) & (g > b + 12) & (r > 70)

# For each quadrant, find bounding box of gold pixels in bottom 25%
regions = {
    "NEW GAME": (0, int(w * 0.5), int(h * 0.78), int(h * 0.90)),
    "CONTINUE": (int(w * 0.5), w, int(h * 0.78), int(h * 0.90)),
    "LEDGER": (0, int(w * 0.5), int(h * 0.88), h),
    "HIGH SCORES": (int(w * 0.5), w, int(h * 0.88), h),
}

for name, (x1, x2, y1, y2) in regions.items():
    sub = gold[y1:y2, x1:x2]
    ys, xs = np.where(sub)
    if len(xs) == 0:
        print(name, "no gold found")
        continue
    bx1, bx2 = xs.min() + x1, xs.max() + x1
    by1, by2 = ys.min() + y1, ys.max() + y1
    print(f"{name}: px=({bx1},{by1})-({bx2},{by2}) size={bx2-bx1+1}x{by2-by1+1}")
    pad = 4
    print(
        f"  CSS: left={(bx1+pad)/w*100:.3f}%; width={(bx2-bx1-2*pad)/w*100:.3f}%; "
        f"top={(by1+pad)/h*100:.3f}%; height={(by2-by1-2*pad)/h*100:.3f}%;"
    )

# Also find full button rects by scanning for closed rectangles
print("\nFull button scan using edge density:")
for name, approx in [
    ("NEW GAME", (10, 240, 795, 905)),
    ("CONTINUE", (240, 475, 795, 905)),
    ("LEDGER", (10, 240, 905, 1015)),
    ("HIGH SCORES", (240, 475, 905, 1015)),
]:
    x1, x2, y1, y2 = approx
    # find min/max gold in region with threshold for border
    sub = gold[y1:y2, x1:x2]
    ys, xs = np.where(sub)
    bx1, bx2 = xs.min() + x1, xs.max() + x1
    by1, by2 = ys.min() + y1, ys.max() + y1
    pad = 5
    print(
        f"{name}: left={(bx1+pad)/w*100:.3f}%; width={(bx2-bx1-2*pad)/w*100:.3f}%; "
        f"top={(by1+pad)/h*100:.3f}%; height={(by2-by1-2*pad)/h*100:.3f}%;"
    )
