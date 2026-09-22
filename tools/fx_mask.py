"""
전환 조각 마스크(m-*.png) 만들기 — 페이지 이미지를 바꿨을 때 다시 돌리면 됨.

원리
  - 모든 질문 페이지는 같은 흐린 배경 사진을 씀 → tools/plate.png = 요소를 뺀 '배경판'(bg.jpg의 무손실 원본)
  - 마스크 = (조각 영역 안에서 |페이지 - 배경판| 이 큰 곳 = 글씨·사진) ∪ (solid 사각형 = 사진·상자 통째)
  - 540×900 LA PNG(알파가 마스크)로 저장. index.html의 FX_PIECES 에 같은 조각 좌표(r, z)를 적어야 함
좌표는 전부 화면 % [x0, y0, x1, y1]

사용 예
  python3 tools/fx_mask.py pages/p-9q.jpg '[{"r":[16.48,40.94,84.72,46.28]}]'
  python3 tools/fx_mask.py pages/p-2b.jpg '[{"r":[33.8,23.7,68.4,29.1]},{"r":[9.6,32.2,45.7,65.0],"solid":[9.9,32.5,45.4,60.6]}]'
마지막 줄의 'err>30 px' 가 0 이면 전환 중 조각이 원본과 똑같이 보인다는 뜻.
"""
import sys, os, json, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
H, W = 1800, 1080

def make_mask(page_path, pieces):
    plate = np.asarray(Image.open(os.path.join(HERE, 'plate.png')).convert('RGB')).astype(float)
    a = np.asarray(Image.open(page_path).convert('RGB')).astype(float)
    d = np.abs(a - plate).max(2)
    ink = ndimage.grey_dilation(np.clip((d - 18) / 22, 0, 1), size=(3, 3))
    px = lambda v, i: int(round(v / 100 * (W if i % 2 == 0 else H)))
    alpha = np.zeros((H, W))
    for p in pieces:
        x0, y0, x1, y1 = [px(v, i) for i, v in enumerate(p['r'])]
        alpha[y0:y1, x0:x1] = np.maximum(alpha[y0:y1, x0:x1], ink[y0:y1, x0:x1])
        if 'solid' in p:
            s0, s1, s2, s3 = [px(v, i) for i, v in enumerate(p['solid'])]
            alpha[s1:s3, s0:s2] = 1
    full = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
    al = np.asarray(full).astype(float)[..., None] / 255
    err = (np.abs(plate * (1 - al) + a * al - a).max(2) > 30).sum()
    half = full.resize((540, 900), Image.LANCZOS)
    out = os.path.join(os.path.dirname(page_path), 'm-' + os.path.splitext(os.path.basename(page_path))[0] + '.png')
    Image.merge('LA', (Image.new('L', half.size, 0), half)).save(out, optimize=True)
    print(out, 'err>30 px:', err)

if __name__ == '__main__':
    make_mask(sys.argv[1], json.loads(sys.argv[2]))
