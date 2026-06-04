with open('app/studio/page.tsx', 'r') as f:
    lines = f.readlines()

def find_line(pattern):
    for i, line in enumerate(lines):
        if pattern in line:
            return i
    return -1

# Markers
art_style_start = find_line("{/* Art Style Studio Section */}")

# End of AnimatePresence
animate_end = -1
for i in range(art_style_start, len(lines)):
    if "</AnimatePresence>" in lines[i]:
        animate_end = i
        break

if art_style_start == -1 or animate_end == -1:
    print("Failed to find art style block")
    exit(1)

# Extract block
art_style_block = lines[art_style_start:animate_end+1]

# Delete from lines
del lines[art_style_start:animate_end+1]

# Change grid template
for i in range(len(art_style_block)):
    if "gridTemplateColumns: 'repeat(5, 1fr)'" in art_style_block[i]:
        art_style_block[i] = art_style_block[i].replace("repeat(5, 1fr)", "repeat(2, 1fr)")
    if "marginBottom: '40px'" in art_style_block[i]:
        art_style_block[i] = art_style_block[i].replace("marginBottom: '40px'", "marginBottom: '0'")

# Change main layout wrapper
main_idx = find_line("{/* Main Gallery Area — Takes full width now */}")
if main_idx != -1:
    lines[main_idx] = "          {/* Main Layout Area */}\n"
    lines[main_idx+1] = "          <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '32px', alignItems: 'flex-start', paddingBottom: '160px' }}>\n"
    lines.insert(main_idx+2, "            {/* Left Column */}\n")
    lines.insert(main_idx+3, "            <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>\n")

# Find bottom dock
bottom_dock = find_line("{/* BOTTOM DOCK */}")

insert_lines = [
    "            </div> {/* End Left Column */}\n",
    "            {/* Right Column: Art Style Studio */}\n",
    "            <div style={{ width: '380px', flexShrink: 0, position: 'sticky', top: '30px', maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', paddingRight: '12px' }} className=\"custom-scrollbar\">\n"
] + art_style_block + [
    "            </div> {/* End Right Column */}\n"
]

# Insert before bottom dock
for i, line in enumerate(reversed(insert_lines)):
    lines.insert(bottom_dock, line)

# Also let's fix the "Generate Captions" text!
gen_cap_idx = find_line("Generate Captions <Send size={16} />")
if gen_cap_idx != -1:
    lines[gen_cap_idx] = lines[gen_cap_idx].replace("Generate Captions <Send size={16} />", "Edit & Post <Send size={16} />")

ready_cap_idx = find_line("Ready to generate captions & publish")
if ready_cap_idx != -1:
    lines[ready_cap_idx] = lines[ready_cap_idx].replace("Ready to generate captions & publish", "Ready to edit & publish")

with open('app/studio/page.tsx', 'w') as f:
    f.writelines(lines)

print("Success")
