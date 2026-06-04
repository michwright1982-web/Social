with open('app/studio/page.tsx', 'r') as f:
    text = f.read()

card_replacement = """              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                {STYLES.map(style => {
                  const isSelected = selectedStyle === style.id;
                  return (
                    <div
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      style={{
                        background: isSelected ? 'rgba(124, 58, 237, 0.08)' : 'var(--input-bg)',
                        border: isSelected ? '2px solid #a78bfa' : '1px solid var(--input-border)',
                        borderRadius: '16px',
                        padding: '10px',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        boxShadow: isSelected ? '0 10px 25px -5px rgba(124, 58, 237, 0.25)' : 'none',
                        transform: isSelected ? 'translateY(-2px)' : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.border = '1px solid rgba(167, 139, 250, 0.4)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.background = 'var(--bg-secondary)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.border = '1px solid var(--input-border)';
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.background = 'var(--input-bg)';
                        }
                      }}
                    >
                      {/* 1:1 Image */}
                      <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', borderRadius: '10px', overflow: 'hidden', background: 'var(--bg-primary)' }}>
                        <img
                          src={style.sampleImage}
                          alt={style.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s', transform: isSelected ? 'scale(1.05)' : 'scale(1)' }}
                        />
                        {/* Selection Checkmark */}
                        {isSelected && (
                          <div style={{ position: 'absolute', top: '8px', right: '8px', width: '22px', height: '22px', borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.4)', zIndex: 20 }}>
                            <Check size={12} color="white" strokeWidth={3} />
                          </div>
                        )}
                        
                        {/* Rules Modal Trigger */}
                        <div 
                          title="View strict AI rules"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTooltip(activeTooltip === style.id ? null : style.id);
                          }}
                          style={{
                            position: 'absolute', bottom: '6px', right: '6px', width: '22px', height: '22px', borderRadius: '50%',
                            background: 'var(--input-bg)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', zIndex: 20, color: 'var(--text-muted)', border: '1px solid var(--glass-border)', transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--input-bg)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                        >
                          <Sliders size={11} />
                        </div>
                      </div>
                      
                      {/* Text Below Image (Rectangle Shape) */}
                      <div style={{ display: 'flex', flexDirection: 'column', padding: '0 2px 4px' }}>
                        <h3 style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? '#a78bfa' : 'var(--text-primary)', transition: 'color 0.2s', lineHeight: 1.2 }}>{style.name}</h3>
                      </div>
                    </div>
                  );
                })}
              </div>"""

import re
pattern = r"              <div style=\{\{ display: 'grid', gridTemplateColumns: 'repeat\(2, 1fr\)', gap: '14px' \}\}>.*?\}\)}\n              </div>"
text = re.sub(pattern, card_replacement, text, flags=re.DOTALL)

with open('app/studio/page.tsx', 'w') as f:
    f.write(text)

print("Rectangle cards applied")
