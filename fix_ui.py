with open('app/studio/page.tsx', 'r') as f:
    text = f.read()

# 1. Remove Duplicate Hologram Style
duplicate_style = """  {
    id: 'hologram_hud',
    name: 'Holographic Tech HUD',
    description: 'Glowing futuristic 3D data visualizations and neon UI elements overlaying a cinematic scene. Perfect for tech and B2B.',
    sampleImage: '/styles/hologram_hud.png',
    rules: `* Visual Elements: Integrate a glowing, high-tech holographic HUD interface. Include neon data graphics, charts, and icons floating in mid-air around the subject.\\n* Color Palette: Tech-driven colors. Deep cinematic backgrounds with bright cyan, electric blue, and glowing orange UI elements.\\n* Lighting & Texture: Cinematic lighting with sharp focus. Holograms should emit light onto the subject and environment. Use hyper-realistic photography for the base scene.\\n* Composition & Layout: Frame the subject centrally, surrounded symmetrically or dynamically by floating holographic elements. Ensure a high contrast between the luminous UI and the darker background.`
  },
"""
text = text.replace(duplicate_style, "", 1)

# 2. Rename Generate Captions back to Edit & Post
text = text.replace("<span>Generate Captions</span>", "<span>Edit & Post</span>")

# 3. Remove "PROMPT" text
text = text.replace("<span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', lineHeight: 1 }}>Prompt</span>", "")

# 4. Refactor Art Style Cards to fit in one view and look better
# I will use regex to find the grid and replace the card render logic
import re

card_target_start = """              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>"""
card_replacement = """              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {STYLES.map(style => {
                  const isSelected = selectedStyle === style.id;
                  const shortName = style.name.split(' & ')[0].split(' / ')[0].replace('Tactile ', '').replace('3D ', '');
                  return (
                    <div
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      style={{
                        background: isSelected ? 'rgba(124, 58, 237, 0.08)' : 'transparent',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <div style={{ 
                        position: 'relative', width: '100%', aspectRatio: '1/1', borderRadius: '12px', 
                        overflow: 'hidden', background: 'var(--bg-primary)',
                        border: isSelected ? '2px solid #7c3aed' : '1px solid var(--input-border)',
                        boxShadow: isSelected ? '0 8px 20px -4px rgba(124, 58, 237, 0.3)' : 'none',
                        transition: 'all 0.2s'
                      }}>
                        <img
                          src={style.sampleImage}
                          alt={style.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s', transform: isSelected ? 'scale(1.08)' : 'scale(1)' }}
                        />
                        {isSelected && (
                          <div style={{ position: 'absolute', top: '6px', right: '6px', width: '18px', height: '18px', borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.4)', zIndex: 2 }}>
                            <Check size={10} color="white" strokeWidth={3} />
                          </div>
                        )}
                        <div 
                          title="View strict AI rules"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTooltip(activeTooltip === style.id ? null : style.id);
                          }}
                          style={{
                            position: 'absolute', bottom: '4px', left: '4px', width: '20px', height: '20px', borderRadius: '50%',
                            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', zIndex: 3, color: 'rgba(255,255,255,0.8)', transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(0,0,0,0.7)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; e.currentTarget.style.background = 'rgba(0,0,0,0.4)'; }}
                        >
                          <Sliders size={10} />
                        </div>
                      </div>
                      
                      <div style={{ width: '100%', textAlign: 'center' }}>
                        <h3 style={{ fontSize: '11px', fontWeight: 600, color: isSelected ? '#a78bfa' : 'var(--text-secondary)', transition: 'color 0.2s', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shortName}</h3>
                      </div>
                    </div>
                  );
                })}
              </div>"""

# We need to extract the existing map logic and replace it
# The original map logic ends at `                })}` followed by `              </div>`
import re
pattern = r"              <div style=\{\{ display: 'grid', gridTemplateColumns: 'repeat\(2, 1fr\)', gap: '10px' \}\}>.*?\}\)}\n              </div>"
text = re.sub(pattern, card_replacement, text, flags=re.DOTALL)

with open('app/studio/page.tsx', 'w') as f:
    f.write(text)

print("Script Complete")
