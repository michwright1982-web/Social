with open('app/studio/page.tsx', 'r') as f:
    text = f.read()

# Rename Styles
text = text.replace("name: 'Glassmorphism & Cyber-Premium',", "name: 'Cyber Glass',")
text = text.replace("name: '3D Isometric Ecosystem',", "name: '3D Isometric',")
text = text.replace("name: 'Chaos Maximalism & Collage',", "name: 'Chaos Collage',")
text = text.replace("name: 'Neo-Minimalist Editorial',", "name: 'Neo Minimalist',")
text = text.replace("name: 'Tactile Claymorphism',", "name: 'Soft Clay',")
text = text.replace("name: 'Holographic Tech HUD',", "name: 'Holo Tech',")

# Remove the dynamic shortName splitting logic
# Find: const shortName = style.name.split(' & ')[0].split(' / ')[0].replace('Tactile ', '').replace('3D ', '');
# Replace it with just using style.name
import re
text = re.sub(r"const shortName = style\.name\.split\(' & '\)\[0\]\.split\(' / '\)\[0\]\.replace\('Tactile ', ''\)\.replace\('3D ', ''\);", "", text)
text = text.replace(">{shortName}</h3>", ">{style.name}</h3>")

with open('app/studio/page.tsx', 'w') as f:
    f.write(text)

print("Styles renamed")
