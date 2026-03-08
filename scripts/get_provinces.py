import re

with open('src/data/thailand-locations.ts', encoding='utf-8') as f:
    content = f.read()

# Find all region blocks
region_blocks = re.split(r'\{\s*\n\s*id:', content)

regions_data = {}
for block in region_blocks[1:]:
    id_match = re.match(r'\s*"(\w+)"', block)
    if not id_match:
        continue
    region_id = id_match.group(1)
    
    # Find all province names (first "name:" in each province object)
    # Province names appear before "districts:"
    province_names = re.findall(r'name:\s*"([^"]+)",\s*\n\s*districts:', block)
    regions_data[region_id] = province_names
    print(f'{region_id}: {len(province_names)} provinces')
    for i, n in enumerate(province_names):
        print(f'  {i}: {n}')
    print()
