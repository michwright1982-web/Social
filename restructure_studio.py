import re

with open('app/studio/page.tsx', 'r') as f:
    text = f.read()

def extract_block(text, start_marker, end_marker=None, count_divs=False):
    start_idx = text.find(start_marker)
    if start_idx == -1: return None, text
    
    if count_divs:
        # We start at start_idx, and count open/close <div> to find the end
        # We need to find the first <div after start_idx
        div_start = text.find('<div', start_idx)
        if div_start == -1: return None, text
        
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
                    block = text[start_idx:end_idx]
                    new_text = text[:start_idx] + text[end_idx:]
                    return block, new_text
            else:
                i += 1
        return None, text

    else:
        end_idx = text.find(end_marker, start_idx)
        if end_idx == -1: return None, text
        block = text[start_idx:end_idx]
        new_text = text[:start_idx] + text[end_idx:]
        return block, new_text

# 1. Art Style Studio
art_style_block, text = extract_block(text, "{/* Art Style Studio Section */}", "{/* End Right Column */}")
# Clean up the container from art_style_block
art_style_block = re.sub(r'<div style={{ width: \'280px\'.*?>', '', art_style_block)
art_style_block = art_style_block.replace("marginBottom: '0'", "marginBottom: '24px'")
art_style_block = art_style_block.strip()

# 2. Reference Block
ref_block, text = extract_block(text, "{/* ── 1. Reference ── */}", count_divs=True)

# 3. Prompt Block
prompt_block, text = extract_block(text, "{/* ── 2. Prompt ── */}", count_divs=True)

# 4. Provider Block
provider_block, text = extract_block(text, "{/* ── 3. Provider & Model ── */}", count_divs=True)

# 5. Generate Button Block
generate_block, text = extract_block(text, "{/* ── 5. Generate ── */}", count_divs=True)

# 6. Delete BOTTOM DOCK wrapper
text = re.sub(r'\{\/\* BOTTOM DOCK \*\/\}.*?\<div style=\{\{[^}]*position: \'fixed\'[^}]*bottom: 0[^}]*\}\}\>', '', text, flags=re.DOTALL)
text = re.sub(r'\<div style=\{\{ display: \'flex\', gap: \'12px\'[^}]*\}\}\>', '', text)
text = text.replace("{/* ── Divider ── */}", "")
text = re.sub(r'\<div style=\{\{ width: \'1px\', height: \'110px\', background: \'var\(--glass-border\)\'.*?\/\>', '', text)

# Remove stray closing divs from bottom dock (2 of them)
# We will just reconstruct the main layout entirely instead of patching it!

