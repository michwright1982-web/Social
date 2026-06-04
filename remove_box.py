with open('app/studio/page.tsx', 'r') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "{(() => {" in line and "Merge ID-based and URL-based selections for total count" in lines[i+1]:
        start_idx = i
        break

if start_idx != -1:
    for i in range(start_idx, len(lines)):
        if "})()}" in lines[i]:
            end_idx = i
            break

if start_idx != -1 and end_idx != -1:
    del lines[start_idx:end_idx+1]

with open('app/studio/page.tsx', 'w') as f:
    f.writelines(lines)

print("Done")
