const fs = require('fs');
const file = 'app/editor/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove left toolbar buttons
content = content.replace(
  /<ToolBtn tool="select"[\s\S]*?<div style={{ width: '28px', height: '1px', background: 'var\(--glass-border\)', margin: '2px auto' }} \/>/m,
  "{/* Filerobot takes care of the tools */}"
);

// 2. Remove modal at the bottom
content = content.replace(
  /\{\/\* Advanced Image Editor Modal \*\/\}[\s\S]*?<\/AnimatePresence>/m,
  ""
);

// 3. Replace Center Canvas
const canvasStartRegex = /\{\/\* ── Canvas card ── \*\/\}[\s\S]*?className="glass-card" style={{ position: 'relative' }}>/;
const canvasEndRegex = /\{\/\* ══════════════ RIGHT — Caption Editor ══════════════ \*\/\}/m;

const matchStart = content.match(canvasStartRegex);
const matchEnd = content.match(canvasEndRegex);

if (matchStart && matchEnd) {
  const startIndex = matchStart.index;
  const endIndex = matchEnd.index;
  
  const before = content.slice(0, startIndex);
  const after = content.slice(endIndex);
  
  const newCanvas = `
                {/* ── Canvas card ── */}
                <div className="glass-card" style={{ position: 'relative', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
                  {activeImage ? (
                    <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', minHeight: '600px', overflow: 'hidden', borderRadius: 'inherit' }}>
                      <StyleSheetManager shouldForwardProp={(prop) => isPropValid(prop)}>
                        <FilerobotImageEditor
                          source={activeImage}
                          onSave={(editedImageObject, designState) => {
                            if (editedImageObject && editedImageObject.imageBase64) {
                              setImages(prev => prev.map((im, i) => i === activeImageIdx ? editedImageObject.imageBase64! : im));
                            }
                          }}
                          annotationsCommon={{
                            fill: '#ff0000',
                          }}
                          Text={{ text: 'Add text here...' }}
                          Rotate={{ angle: 90, componentType: 'slider' }}
                          tabsIds={['Adjust', 'Annotate', 'Watermark', 'Filters', 'Finetune', 'Resize']}
                          defaultTabId="Adjust"
                          savingPixelRatio={1}
                          previewPixelRatio={1}
                        />
                      </StyleSheetManager>
                    </div>
                  ) : (
                    <div style={{ width: '100%', height: '100%', minHeight: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '40px' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ImageIcon size={28} color="#7c3aed" />
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>No image selected</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Upload an image or generate one in the AI Studio.</div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <label className="btn-secondary" style={{ padding: '10px 16px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Upload size={13} /> Upload
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                        </label>
                        <Link href="/studio" style={{ textDecoration: 'none' }}>
                          <button className="btn-primary" style={{ padding: '10px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Sparkles size={13} /> AI Studio
                          </button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              `;
              
  content = before + newCanvas + after;
}

fs.writeFileSync(file, content);
console.log('Success');
