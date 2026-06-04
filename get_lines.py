with open('app/studio/page.tsx', 'r') as f:
    lines = f.readlines()

def find_line(pattern):
    for i, line in enumerate(lines):
        if pattern in line:
            return i + 1
    return -1

print("Main Layout Area:", find_line("{/* Main Layout Area */}"))
print("Gallery:", find_line("<motion.div"), "to", find_line("          </div>\n\n            </div> {/* End Left Column */}"))
print("Right Column:", find_line("{/* Right Column: Art Style Studio */}"))
print("End Right Column:", find_line("            </div> {/* End Right Column */}"))
print("Bottom Dock:", find_line("{/* BOTTOM DOCK */}"))
print("End Bottom Dock:", find_line("          {/* ── AI Style Rules Modal ─────────────────────────────────────────── */}"))

