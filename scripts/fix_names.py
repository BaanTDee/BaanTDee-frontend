"""Fix corrupted Thai region names in thailand-region-map.tsx by ID lookup"""
import re

path = "src/components/thailand-region-map.tsx"

# Correct Thai names by region id
correct_names = {
    "northern": "ภาคเหนือ",
    "northeastern": "ภาคตะวันออกเฉียงเหนือ",
    "central": "ภาคกลาง",
    "eastern": "ภาคตะวันออก",
    "southern": "ภาคใต้",
    "western": "ภาคตะวันตก",
}

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace name after each id field
def fix_name(m):
    region_id = m.group(1)
    if region_id in correct_names:
        return f'id: "{region_id}",\n    name: "{correct_names[region_id]}"'
    return m.group(0)

# Pattern: id: "xxx",\n    name: "anything"
fixed = re.sub(
    r'id: "([^"]+)",\s*\n\s*name: "[^"]*"',
    fix_name,
    content
)

with open(path, "w", encoding="utf-8", newline="\n") as f:
    f.write(fixed)

print("Names fixed:")
for m in re.findall(r'name: "([^"]+)"', fixed):
    print(f"  {m}")
