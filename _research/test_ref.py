#!/usr/bin/env python3
"""
test_ref.py — A/B test whether reference-image (mode=image) helps Serega consistency,
WITHOUT needing external hosting: we chain the API's own returned CDN url as the reference.

Steps:
  1) Generate a clean Serega portrait (text mode) -> capture its CDN image_url (the "reference").
  2) Generate a NEW distinctive scene TWO ways:
       A) text-only (mode=text)
       B) with the portrait as reference (mode=image, image_url=<portrait url>)
  3) Save all three to /tmp/ref_test/ for side-by-side comparison.

Answers: (a) does mode=image compose a NEW scene or just edit the portrait?
         (b) is the character visibly more consistent vs text-only?
"""
import sys, time, pathlib, requests
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import gen_images as g  # reuse API_KEY, BASE_URL, build_prompt, ANTIPATTERN

OUT = pathlib.Path("/tmp/ref_test"); OUT.mkdir(parents=True, exist_ok=True)
H = {"Authorization": f"Bearer {g.API_KEY}"}

def generate(prompt, ref_url=None, aspect="16:9", model="gpt-image-2"):
    body = {"prompt": prompt, "model": model, "aspect_ratio": aspect,
            "resolution": "2K", "num_images": 1, "output_format": "png"}
    if ref_url:
        body["mode"] = "image"; body["image_url"] = ref_url
    else:
        body["mode"] = "text"
    r = requests.post(f"{g.BASE_URL}/images/generate", headers=H, json=body, timeout=60).json()
    tid = r.get("data", {}).get("task_id")
    if not tid:
        print("  ! generate failed:", str(r)[:200]); return None
    for _ in range(120):
        time.sleep(3)
        s = requests.get(f"{g.BASE_URL}/images/status", headers=H, params={"task_id": tid}, timeout=30).json()
        st = s.get("data", {}).get("status")
        if st == "completed": return s["data"].get("image_url")
        if st == "failed": print("  ! failed:", s["data"].get("error")); return None
    return None

def save(url, name):
    if not url: return
    dl = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=120)
    (OUT / name).write_bytes(dl.content)
    print(f"  ✓ {name}  ({len(dl.content)//1024} KB)  <- {url[:60]}")

SCENE = ("Serega sitting cross-legged on the floor reading a giant open book, a small stack of "
         "books beside him, three question marks floating above his head. Plain off-white background.")

print("[1] portrait (text) -> reference url …")
ref = generate(g.build_prompt(True, "a clean simple front-facing portrait of Serega from the waist "
                                     "up, smiling, arms relaxed, plain off-white background."))
print("    ref url:", (ref or "NONE")[:80])
if ref: save(ref, "0_reference.png")

print("[2A] new scene, TEXT-ONLY …")
save(generate(g.build_prompt(True, SCENE)), "A_text_only.png")

print("[2B] new scene, WITH reference (mode=image) …")
ref_prompt = ("Using the supplied image purely as the CHARACTER REFERENCE for who Serega is "
              "(same face, same long black hair, same green Tatar skullcap, same blue tunic), "
              "draw a COMPLETELY NEW scene: " + g.build_prompt(True, SCENE))
save(generate(ref_prompt, ref_url=ref), "B_with_reference.png")

print("done ->", OUT)
