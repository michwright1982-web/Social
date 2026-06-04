with open('app/studio/page.tsx', 'r') as f:
    lines = f.readlines()

def find_line(pattern):
    for i, line in enumerate(lines):
        if pattern in line:
            return i
    return -1

start_idx = find_line('<motion.button')
end_idx = -1

# we need to find the specific motion.button for generate
for i in range(len(lines)):
    if 'id="generate-btn"' in lines[i]:
        # backtrack to the opening <motion.button
        for j in range(i, -1, -1):
            if '<motion.button' in lines[j]:
                start_idx = j
                break
        
        # go forward to the closing </motion.button>
        for j in range(i, len(lines)):
            if '</motion.button>' in lines[j]:
                end_idx = j
                break
        break

if start_idx != -1 and end_idx != -1:
    new_code = """                    {(() => {
                      const idSelectedUrls = selectedVariations
                        .map(id => generatedImages.find(img => img.id === id)?.url)
                        .filter(Boolean) as string[];
                      const mergedUrls = Array.from(new Set([...persistedSelectedUrls, ...idSelectedUrls]));
                      const hasSelection = mergedUrls.length > 0;

                      if (hasSelection) {
                        return (
                          <motion.button
                            className="btn-primary"
                            style={{ width: '120px', height: '110px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '7px', fontSize: '14px', fontWeight: 700, borderRadius: '12px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}
                            onClick={async () => {
                              try {
                                const currentCompanyId = localStorage.getItem('ai_marketing_active_company_id') || 'default';
                                await saveToImageDB(`creative_studio_selected_images_${currentCompanyId}`, mergedUrls);
                                sessionStorage.setItem(`creative_studio_selected_images_${currentCompanyId}`, JSON.stringify(mergedUrls));
                              } catch (e) {}
                              router.push('/editor');
                            }}
                            whileTap={{ scale: 0.96 }}
                          >
                            <Send size={20} />
                            <span>Edit & Post</span>
                          </motion.button>
                        );
                      }

                      return (
"""
    # Insert the original button inside the return
    original_btn = "".join(lines[start_idx:end_idx+1])
    # Add indentation
    original_btn = "\n".join(["                        " + line.strip() for line in original_btn.split("\n") if line.strip() != ""]) + "\n"
    
    new_code += original_btn + """                      );
                    })()}
"""
    
    del lines[start_idx:end_idx+1]
    lines.insert(start_idx, new_code)

with open('app/studio/page.tsx', 'w') as f:
    f.writelines(lines)

print("Done")
