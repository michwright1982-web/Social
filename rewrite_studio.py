import re

with open('app/studio/page.tsx', 'r') as f:
    text = f.read()

# 1. Rename "Generate Captions"
text = text.replace("Generate Captions <Send size={16} />", "Edit & Post <Send size={16} />")
text = text.replace("Ready to generate captions & publish", "Ready to edit & publish")

# 2. Add Hologram Style
new_style = """  {
    id: 'hologram_hud',
    name: 'Holographic Tech HUD',
    description: 'Glowing futuristic 3D data visualizations and neon UI elements overlaying a cinematic scene. Perfect for tech and B2B.',
    sampleImage: '/styles/hologram_hud.png',
    rules: `* Visual Elements: Integrate a glowing, high-tech holographic HUD interface. Include neon data graphics, charts, and icons floating in mid-air around the subject.\\n* Color Palette: Tech-driven colors. Deep cinematic backgrounds with bright cyan, electric blue, and glowing orange UI elements.\\n* Lighting & Texture: Cinematic lighting with sharp focus. Holograms should emit light onto the subject and environment. Use hyper-realistic photography for the base scene.\\n* Composition & Layout: Frame the subject centrally, surrounded symmetrically or dynamically by floating holographic elements. Ensure a high contrast between the luminous UI and the darker background.`
  }
];"""
text = text.replace("  }\n];", new_style)

# 3. Extract and Move Art Style Studio
start_marker = "            {/* Art Style Studio Section */}"
end_marker = "            {/* Tooltip Overlay */}"
# In the original file, it was Tooltip Overlay ? Wait, let me check if "Tooltip Overlay" exists.
