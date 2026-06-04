import re

with open('app/studio/page.tsx', 'r') as f:
    text = f.read()

# Helper to extract a balanced JSX block starting at a given string
def extract_block(text, start_marker):
    start_idx = text.find(start_marker)
    if start_idx == -1: return None
    
    div_start = text.find('<div', start_idx)
    if div_start == -1: return None
    
    open_count = 0
    i = div_start
    while i < len(text):
        if text[i:].startswith('<div'):
            open_count += 1
            i += 4
        elif text[i:].startswith('</div'):
            open_count -= 1
            i += 5
            if open_count == 0:
                end_idx = text.find('>', i) + 1
                return text[start_idx:end_idx]
        else:
            i += 1
    return None

def extract_motion_div_block(text, start_marker):
    start_idx = text.find(start_marker)
    if start_idx == -1: return None
    
    div_start = text.find('<motion.div', start_idx)
    if div_start == -1: return None
    
    open_count = 0
    i = div_start
    while i < len(text):
        if text[i:].startswith('<motion.div'):
            open_count += 1
            i += 11
        elif text[i:].startswith('</motion.div'):
            open_count -= 1
            i += 12
            if open_count == 0:
                end_idx = text.find('>', i) + 1
                return text[start_idx:end_idx]
        else:
            i += 1
    return None

# Extract pieces
art_style = extract_block(text, "{/* Art Style Studio Section */}")
reference = extract_block(text, "{/* ── 1. Reference ── */}")
prompt = extract_block(text, "{/* ── 2. Prompt ── */}")
provider = extract_block(text, "{/* ── 3. Provider & Model ── */}")
generate = extract_block(text, "{/* ── 5. Generate ── */}")

# The Gallery is a motion.div
gallery_start_marker = "            <motion.div"
gallery = extract_motion_div_block(text, gallery_start_marker)

# Tooltip
tooltip = extract_block(text, "{/* ── AI Style Rules Modal ─────────────────────────────────────────── */}")
if tooltip is None:
    # the tooltip uses AnimatePresence, so extract_block with div won't work perfectly.
    # We will just extract it manually
    tt_start = text.find("{/* ── AI Style Rules Modal ─────────────────────────────────────────── */}")
    tt_end = text.find("</AnimatePresence>", tt_start) + len("</AnimatePresence>")
    tooltip = text[tt_start:tt_end]

# Now, we find the header part of the file (everything up to Main Layout Area)
header_end = text.find("{/* Main Layout Area */}")
header = text[:header_end]

# And the footer part of the file (everything after the last </div> of the app)
footer = """
      </div>
    </div>
  );
}
"""

# Let's adjust the styles of the extracted pieces so they fit a vertical sidebar
# 1. Reference
reference = reference.replace("width: '148px'", "width: '100%'")
reference = reference.replace("flexShrink: 0", "flexShrink: 0")
# 2. Prompt
prompt = prompt.replace("flex: 1", "width: '100%'")
prompt = prompt.replace("height: '110px'", "height: '140px'")
# 3. Provider
provider = provider.replace("width: '186px'", "width: '100%'")
# 4. Generate
generate = generate.replace("width: '120px'", "width: '100%'")
generate = generate.replace("height: '110px'", "height: '60px'")
generate = generate.replace("width: '120px'", "width: '100%'")

new_layout = f"""{header}
          {{/* ── NEW UI LAYOUT: Left Panel + Right Gallery ── */}}
          <div style={{{{ width: '100%', maxWidth: '1600px', margin: '0 auto', display: 'flex', gap: '30px', alignItems: 'flex-start', paddingBottom: '60px' }}}}>
            
            {{/* ── LEFT CONTROL PANEL ── */}}
            <div style={{{{ width: '360px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '24px', position: 'sticky', top: '30px', maxHeight: 'calc(100vh - 60px)', overflowY: 'auto', paddingRight: '12px' }}}} className="custom-scrollbar">
              
              <div style={{{{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--bg-card)', padding: '24px', borderRadius: '20px', border: '1px solid var(--glass-border)', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}}}>
                {reference}
                {prompt}
                {provider}
                {generate}
              </div>

              <div style={{{{ background: 'var(--bg-card)', padding: '24px', borderRadius: '20px', border: '1px solid var(--glass-border)', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}}}>
                {art_style}
              </div>

            </div>

            {{/* ── RIGHT GALLERY CANVAS ── */}}
            <div style={{{{ flex: 1, minWidth: 0, position: 'relative' }}}}>
              {gallery}
            </div>
            
            {tooltip}
          </div>
{footer}
"""

with open('app/studio/page.tsx', 'w') as f:
    f.write(new_layout)

print("Redesign applied successfully.")
