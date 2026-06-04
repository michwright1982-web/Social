with open('app/studio/page.tsx', 'r') as f:
    text = f.read()

# 1. Extract Art Style Studio block
start_marker = "            {/* Art Style Studio Section */}"
end_marker = "            {/* Tooltip Overlay */}"

start_idx = text.find(start_marker)
end_idx = text.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers")
    exit(1)

art_style_block = text[start_idx:end_idx]

# Remove it from the original text
text = text[:start_idx] + text[end_idx:]

# Change properties inside the art_style_block
art_style_block = art_style_block.replace("gridTemplateColumns: 'repeat(5, 1fr)'", "gridTemplateColumns: 'repeat(2, 1fr)'")
art_style_block = art_style_block.replace("marginBottom: '40px'", "marginBottom: '0'")

# 2. Update Main Wrapper and insert Left Column open
main_wrapper_orig = """          {/* Main Gallery Area — Takes full width now */}
          <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>"""

main_wrapper_new = """          {/* Main Layout Area */}
          <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '32px', alignItems: 'flex-start', paddingBottom: '160px' }}>
            {/* Left Column */}
            <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>"""

text = text.replace(main_wrapper_orig, main_wrapper_new)

# 3. Find end of Gallery (which is just before BOTTOM DOCK)
bottom_dock_marker = "          {/* BOTTOM DOCK */}"
bottom_dock_idx = text.find(bottom_dock_marker)

if bottom_dock_idx == -1:
    print("Could not find bottom dock marker")
    exit(1)

# We need to insert the closing of Left Column and the Right Column (containing Art Style)
# right before the bottom dock.
# Actually, wait! The Gallery `motion.div` and the Tooltip `AnimatePresence` are inside the Left Column.
# The `BOTTOM DOCK` is inside the Main Layout Area?
# Let's see if BOTTOM DOCK is inside the wrapper.
