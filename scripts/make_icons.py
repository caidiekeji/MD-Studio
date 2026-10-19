# -*- coding: utf-8 -*-
"""生成应用图标：纯色品牌蓝圆角方块 + 白色 M 字线稿（无渐变、无 emoji）
输出: src-tauri/icons/app-icon.png (1024), icon-256.png (256), icon.ico
"""
import zlib, struct, math, os

W = 1024
BLUE = (9, 105, 218, 255)     # #0969da 品牌蓝（与编辑器 accent 一致）
WHITE = (255, 255, 255, 255)
TRANS = (0, 0, 0, 0)

# M 字线段（圆头描边 64px）
SEGS = [((280, 730), (280, 330)),
        ((280, 330), (512, 590)),
        ((512, 590), (744, 330)),
        ((744, 330), (744, 730))]
STROKE = 64.0
RADIUS = 180

def in_rounded_rect(x, y, w, h, r):
    if x < 0 or y < 0 or x >= w or y >= h:
        return False
    cx = min(max(x, r), w - 1 - r)
    cy = min(max(y, r), h - 1 - r)
    return (x - cx) ** 2 + (y - cy) ** 2 <= r ** 2 if (x < r or x >= w - r or y < r or y >= h - r) else True

def seg_dist(px, py, a, b):
    ax, ay = a; bx, by = b
    vx, vy = bx - ax, by - ay
    L2 = vx * vx + vy * vy
    t = 0.0 if L2 == 0 else max(0.0, min(1.0, ((px - ax) * vx + (py - ay) * vy) / L2))
    dx, dy = px - (ax + t * vx), py - (ay + t * vy)
    return math.sqrt(dx * dx + dy * dy)

rows = []
for y in range(W):
    row = bytearray()
    for x in range(W):
        if in_rounded_rect(x, y, W, W, RADIUS):
            d = min(seg_dist(x, y, a, b) for a, b in SEGS)
            row += bytes(WHITE if d <= STROKE else BLUE)
        else:
            row += bytes(TRANS)
    rows.append(bytes(row))

def make_png(w, h, row_bytes_list):
    def chunk(t, d):
        return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    ihdr = struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)
    raw = b''.join(b'\x00' + r for r in row_bytes_list)
    return (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) +
            chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))

png1024 = make_png(W, W, rows)
os.makedirs('src-tauri/icons', exist_ok=True)
with open('src-tauri/icons/app-icon.png', 'wb') as f:
    f.write(png1024)

# 256x256 最近邻降采样
S = 4
rows256 = []
for y in range(0, W, S):
    row = bytearray()
    for x in range(0, W, S):
        row += rows[y][x * 4:(x * 4) + 4]
    rows256.append(bytes(row))
png256 = make_png(256, 256, rows256)
with open('src-tauri/icons/icon-256.png', 'wb') as f:
    f.write(png256)

# ICO（内嵌 PNG）
ico_dir = struct.pack('<HHH', 0, 1, 1)
ico_entry = struct.pack('<BBBBHHII', 0, 0, 0, 0, 1, 32, len(png256), 22)
with open('src-tauri/icons/icon.ico', 'wb') as f:
    f.write(ico_dir + ico_entry + png256)

print('icons ok:', os.path.getsize('src-tauri/icons/app-icon.png'),
      os.path.getsize('src-tauri/icons/icon-256.png'),
      os.path.getsize('src-tauri/icons/icon.ico'))
