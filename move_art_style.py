import re

with open('app/studio/page.tsx', 'r') as f:
    lines = f.readlines()

# Find the indices
# 392: {/* Main Gallery Area
# 395: {/* Art Style Studio Section */}
# 577: {/* Modal Footer */} ... down to 596 </AnimatePresence>
# 598: <motion.div for Gallery
# 833: {/* ── Fixed Bottom Prompt Editor ── */}
# 996: </div> (closes the main wrapper)

def find_line(pattern):
    for i, line in enumerate(lines):
        if pattern in line:
            return i
    return -1

main_wrapper_start = find_line("          {/* Main Gallery Area — Takes full width now */}")
art_style_start = find_line("            {/* Art Style Studio Section */}")
tooltip_start = find_line("            {/* Tooltip Overlay */}")
if tooltip_start == -1:
    tooltip_start = find_line("                      {/* Modal Footer */}") - 17 # approx

animate_presence_end = find_line("            </AnimatePresence>")
gallery_start = find_line("            <motion.div")
# We want the gallery_start to be the one immediately after AnimatePresence
for i in range(animate_presence_end + 1, len(lines)):
    if "<motion.div" in lines[i]:
        gallery_start = i
        break

bottom_prompt_start = find_line("          {/* ── Fixed Bottom Prompt Editor ── */}")
main_wrapper_end = find_line("          </div>\n") # This is tricky, let's just find bottom_prompt_end
# Actually bottom prompt ends around line 995
bottom_prompt_end = bottom_prompt_start
for i in range(bottom_prompt_start, len(lines)):
    if lines[i].strip() == "</div>" and lines[i+1].strip() == "</div>" and lines[i+2].strip() == "</div>":
        bottom_prompt_end = i
        break

print(f"Main start: {main_wrapper_start}, Art Style start: {art_style_start}, Tooltip end: {animate_presence_end}, Gallery start: {gallery_start}, Bottom prompt end: {bottom_prompt_end}")

# Now, we slice it up
header_to_main = lines[:main_wrapper_start]
art_style_block = lines[art_style_start:animate_presence_end+1]

# We need to change gridTemplateColumns inside art_style_block
for i in range(len(art_style_block)):
    if "gridTemplateColumns: 'repeat(5, 1fr)'" in art_style_block[i]:
        art_style_block[i] = art_style_block[i].replace("repeat(5, 1fr)", "repeat(2, 1fr)")
    if "marginBottom: '40px'" in art_style_block[i]:
        art_style_block[i] = art_style_block[i].replace("marginBottom: '40px'", "marginBottom: '0'")

gallery_and_prompt = lines[gallery_start:bottom_prompt_end+1]
footer = lines[bottom_prompt_end+1:]

# Reconstruct
new_lines = header_to_main + [
    "          {/* Main Layout Area */}\n",
    "          <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '32px', alignItems: 'flex-start', paddingBottom: '160px' }}>\n",
    "            \n",
    "            {/* Left Column: Gallery Area & Prompt */}\n",
    "            <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>\n"
] + gallery_and_prompt + [
    "            </div>\n",
    "\n",
    "            {/* Right Column: Art Style Studio */}\n",
    "            <div style={{ width: '380px', flexShrink: 0, position: 'sticky', top: '30px', maxHeight: 'calc(100vh - 60px)', overflowY: 'auto', paddingRight: '12px' }} className=\"custom-scrollbar\">\n",
] + art_style_block + [
    "            </div>\n",
    "          </div>\n"
] + footer

with open('app/studio/page.tsx', 'w') as f:
    f.writelines(new_lines)

print("Done reorganizing layout.")
