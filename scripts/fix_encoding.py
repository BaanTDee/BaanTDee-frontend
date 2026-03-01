"""Fix double-encoded UTF-8 Thai text in thailand-region-map.tsx"""
path = "src/components/thailand-region-map.tsx"

with open(path, "rb") as f:
    raw = f.read()

# The Thai text was double-encoded:
# 1. Original UTF-8 bytes read by PowerShell as Windows-1252
# 2. Then written back as UTF-8 of those Windows-1252 code points
# Fix: decode as UTF-8 (gives mojibake string), encode as latin-1 (recovers original UTF-8 bytes), decode as UTF-8
content = raw.decode("utf-8")

try:
    fixed = content.encode("latin-1").decode("utf-8")
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(fixed)
    print("Fixed successfully!")
except Exception as e:
    print(f"Error: {e}")
    # Alternative: try cp1252
    try:
        fixed = content.encode("cp1252").decode("utf-8")
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            f.write(fixed)
        print("Fixed with cp1252!")
    except Exception as e2:
        print(f"cp1252 also failed: {e2}")

import re
with open(path, "r", encoding="utf-8") as f:
    result = f.read()
for m in re.findall(r'name: "([^"]+)"', result):
    print(f"  name: {m}")
