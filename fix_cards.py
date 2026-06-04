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
                        position: 'relative',
                        aspectRatio: '0.85/1',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        border: isSelected ? '2px solid #a78bfa' : '1px solid rgba(255,255,255,0.08)',
                        boxShadow: isSelected ? '0 8px 24px -4px rgba(124, 58, 237, 0.4), inset 0 0 0 1px rgba(255,255,255,0.1)' : '0 4px 12px rgba(0,0,0,0.1)',
                        transform: isSelected ? 'translateY(-2px)' : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.border = '1px solid rgba(167, 139, 250, 0.4)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)';
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                        }
                      }}
                    >
                      <img
                        src={style.sampleImage}
                        alt={style.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)', transform: isSelected ? 'scale(1.08)' : 'scale(1)' }}
                      />
                      
                      {/* Gradient Overlay for Text Readability */}
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: isSelected ? 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(124,58,237,0.3) 50%, rgba(0,0,0,0) 100%)' : 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0) 100%)',
                        transition: 'background 0.3s'
                      }} />
                      
                      {/* Title */}
                      <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', zIndex: 10 }}>
                        <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)', lineHeight: 1.2 }}>{style.name}</h3>
                      </div>

                      {/* Selection Checkmark */}
                      {isSelected && (
                        <div style={{ position: 'absolute', top: '10px', right: '10px', width: '22px', height: '22px', borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.4)', zIndex: 20 }}>
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
                          position: 'absolute', top: '10px', left: '10px', width: '24px', height: '24px', borderRadius: '50%',
                          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', zIndex: 20, color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(124,58,237,0.8)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#a78bfa'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                      >
                        <Sliders size={12} />
                      </div>
                    </div>
                  );
                })}
              </div>"""

import re
pattern = r"              <div style=\{\{ display: 'grid', gridTemplateColumns: 'repeat\(2, 1fr\)', gap: '16px' \}\}>.*?\}\)}\n              </div>"
text = re.sub(pattern, card_replacement, text, flags=re.DOTALL)

with open('app/studio/page.tsx', 'w') as f:
    f.write(text)

print("Card redesign applied")
