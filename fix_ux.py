with open('app/studio/page.tsx', 'r') as f:
    lines = f.readlines()

def find_line(pattern):
    for i, line in enumerate(lines):
        if pattern in line:
            return i
    return -1

# 2. Add Hologram Style
idx = find_line("id: 'claymorphism'")
if idx != -1:
    # Find the closing brace of claymorphism
    for j in range(idx, len(lines)):
        if "  }" in lines[j] and lines[j+1].strip() == "];":
            new_style = """  },
  {
    id: 'hologram_hud',
    name: 'Holographic Tech HUD',
    description: 'Glowing futuristic 3D data visualizations and neon UI elements overlaying a cinematic scene. Perfect for tech and B2B.',
    sampleImage: '/styles/hologram_hud.png',
    rules: `* Visual Elements: Integrate a glowing, high-tech holographic HUD interface. Include neon data graphics, charts, and icons floating in mid-air around the subject.\\n* Color Palette: Tech-driven colors. Deep cinematic backgrounds with bright cyan, electric blue, and glowing orange UI elements.\\n* Lighting & Texture: Cinematic lighting with sharp focus. Holograms should emit light onto the subject and environment. Use hyper-realistic photography for the base scene.\\n* Composition & Layout: Frame the subject centrally, surrounded symmetrically or dynamically by floating holographic elements. Ensure a high contrast between the luminous UI and the darker background.`
  }
"""
            lines[j] = new_style
            break

# 3. Move description to modal
# First, remove it from the card
idx1 = find_line("style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{style.description}</p>")
if idx1 != -1:
    del lines[idx1]

# Second, add it to the modal body
idx2 = find_line("fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.75',")
if idx2 != -1:
    # We want to insert it right before the div that contains this line
    # The div starts at idx2 - 1
    modal_body_div = idx2 - 1
    lines.insert(modal_body_div, "                        <div style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500, lineHeight: '1.5' }}>{activeStyle.description}</div>\n")

# 4. Refactor Layout
art_start = find_line("{/* Art Style Studio Section */}")
if art_start != -1:
    # Find end of AnimatePresence
    anim_end = -1
    for i in range(art_start, len(lines)):
        if "</AnimatePresence>" in lines[i]:
            anim_end = i
            break
    
    if anim_end != -1:
        # Extract block
        art_block = lines[art_start:anim_end+1]
        del lines[art_start:anim_end+1]
        
        # Modify art_block grid
        for i in range(len(art_block)):
            if "gridTemplateColumns: 'repeat(5, 1fr)'" in art_block[i]:
                art_block[i] = art_block[i].replace("repeat(5, 1fr)", "repeat(2, 1fr)")
            if "marginBottom: '40px'" in art_block[i]:
                art_block[i] = art_block[i].replace("marginBottom: '40px'", "marginBottom: '0'")
            if "Select a premium, high-converting visual style to instantly inject optimized AI rendering rules into your poster." in art_block[i]:
                art_block[i] = art_block[i].replace("Select a premium, high-converting visual style to instantly inject optimized AI rendering rules into your poster.", "Select a premium style to apply optimized AI rendering rules.")
        
        # Modify wrapper
        main_idx = find_line("{/* Main Gallery Area — Takes full width now */}")
        if main_idx != -1:
            lines[main_idx] = "          {/* Main Layout Area */}\n"
            lines[main_idx+1] = "          <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '32px', alignItems: 'flex-start', paddingBottom: '160px' }}>\n"
            lines.insert(main_idx+2, "            {/* Left Column */}\n")
            lines.insert(main_idx+3, "            <div style={{ flex: 1, minWidth: 0, position: 'relative', paddingRight: '280px' }}>\n")
            
            # Find bottom dock
            dock_idx = find_line("{/* BOTTOM DOCK */}")
            if dock_idx != -1:
                # Insert ending of left column and start of right column
                insert_lines = [
                    "            </div> {/* End Left Column */}\n",
                    "            {/* Right Column: Art Style Studio */}\n",
                    "            <div style={{ width: '280px', flexShrink: 0, position: 'fixed', right: 0, top: '70px', bottom: '100px', overflowY: 'auto', padding: '0 16px', background: 'var(--bg-primary)', borderLeft: '1px solid var(--glass-border)', zIndex: 50 }} className=\"custom-scrollbar\">\n"
                ] + art_block + [
                    "            </div> {/* End Right Column */}\n"
                ]
                
                # Insert before dock
                for line in reversed(insert_lines):
                    lines.insert(dock_idx, line)

with open('app/studio/page.tsx', 'w') as f:
    f.writelines(lines)

print("Done")
