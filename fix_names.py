with open('app/studio/page.tsx', 'r') as f:
    text = f.read()

# 1. Shorten Style Names
text = text.replace("name: 'Glassmorphism & Cyber-Premium',", "name: 'Glassmorphism',")
text = text.replace("name: '3D Isometric Ecosystem',", "name: '3D Isometric',")
text = text.replace("name: 'Chaos Maximalism & Collage',", "name: 'Chaos Maximalism',")
text = text.replace("name: 'Neo-Minimalist Editorial',", "name: 'Neo-Minimalist',")
text = text.replace("name: 'Tactile Claymorphism',", "name: 'Claymorphism',")
text = text.replace("name: 'Holographic Tech HUD',", "name: 'Hologram HUD',")

# 2. Remove "Prompt" span
span_text = "                  <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', lineHeight: 1 }}>Prompt</span>\n"
text = text.replace(span_text, "")

with open('app/studio/page.tsx', 'w') as f:
    f.write(text)

print("Done")
