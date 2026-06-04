with open('app/studio/page.tsx', 'r') as f:
    text = f.read()

# I will write a script to find the start of the return statement.
start_return = text.find("  return (\n")
header = text[:start_return]

# Now, let's extract the pieces we need from the old return statement:
def extract(start_str, end_str):
    s = text.find(start_str)
    e = text.find(end_str, s) + len(end_str)
    return text[s:e]

error_msg = extract("{/* Floating Error Message */}", "</AnimatePresence>")

gallery = extract("<motion.div\n              initial={{ opacity: 0 }}\n", "            </motion.div>\n          </div>")
gallery = gallery.replace("            </motion.div>\n          </div>", "            </motion.div>")

art_style = extract("{/* Art Style Studio Section */}", "              </div>\n            </div>")

reference = extract("{/* ── 1. Reference ── */}", "</>\\n                  )}\\n                </div>\\n              </div>")
# The reference block ends at </div></div>
ref_start = text.find("{/* ── 1. Reference ── */}")
ref_end = text.find("{/* ── Divider ── */}", ref_start)
reference = text[ref_start:ref_end].strip()

prompt_start = text.find("{/* ── 2. Prompt ── */}")
prompt_end = text.find("{/* ── Divider ── */}", prompt_start)
prompt = text[prompt_start:prompt_end].strip()

provider_start = text.find("{/* ── 3. Provider & Model ── */}")
provider_end = text.find("{/* ── Divider ── */}", provider_start)
provider = text[provider_start:provider_end].strip()

generate_start = text.find("{/* ── 5. Generate ── */}")
generate_end = text.find("</div>\n\n            </div>", generate_start)
generate = text[generate_start:generate_end].strip()

tooltip_start = text.find("{/* ── AI Style Rules Modal ─────────────────────────────────────────── */}")
tooltip_end = text.find("</AnimatePresence>", tooltip_start) + len("</AnimatePresence>")
tooltip = text[tooltip_start:tooltip_end]

# Modify components for vertical layout
reference = reference.replace("width: '148px'", "width: '100%'").replace("flexShrink: 0", "flexShrink: 0")
prompt = prompt.replace("flex: 1", "width: '100%'").replace("height: '110px'", "height: '160px'")
provider = provider.replace("width: '186px'", "width: '100%'")
generate = generate.replace("width: '120px'", "width: '100%'").replace("height: '110px'", "height: '60px'")
generate = generate.replace("width: '120px'", "width: '100%'")

# Fix Art Style
art_style = art_style.replace("gridTemplateColumns: 'repeat(5, 1fr)'", "gridTemplateColumns: 'repeat(2, 1fr)'")

# Create new return statement
new_return = f"""  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title="Creative Studio" subtitle="AI-powered image generation & variation" />
        <div className="page-content" style={{{{ paddingBottom: '40px', position: 'relative' }}}}>
          
          {error_msg}

          {{/* ── NEW UI LAYOUT: Left Control Panel + Right Gallery ── */}}
          <div style={{{{ width: '100%', maxWidth: '1600px', margin: '0 auto', display: 'flex', gap: '30px', alignItems: 'flex-start' }}}}>
            
            {{/* ── LEFT CONTROL PANEL ── */}}
            <div style={{{{ width: '360px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '24px', position: 'sticky', top: '24px', maxHeight: 'calc(100vh - 48px)', overflowY: 'auto', paddingRight: '12px' }}}} className="custom-scrollbar">
              
              {{/* Input Section */}}
              <div style={{{{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--bg-card)', padding: '24px', borderRadius: '20px', border: '1px solid var(--glass-border)', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}}}>
                {reference}
                {prompt}
                {provider}
                {generate}
              </div>

              {{/* Art Style Section */}}
              <div style={{{{ background: 'var(--bg-card)', padding: '24px', borderRadius: '20px', border: '1px solid var(--glass-border)', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}}}>
                {art_style}
              </div>

            </div>

            {{/* ── RIGHT GALLERY CANVAS ── */}}
            <div style={{{{ flex: 1, minWidth: 0, position: 'relative', background: 'var(--bg-card)', padding: '30px', borderRadius: '20px', border: '1px solid var(--glass-border)', minHeight: 'calc(100vh - 48px)' }}}}>
              {gallery}
            </div>
            
          </div>
          
          {tooltip}
        </div>
      </div>
    </div>
  );
}}
"""

with open('app/studio/page.tsx', 'w') as f:
    f.write(header + new_return)

print("Restructured successfully.")
