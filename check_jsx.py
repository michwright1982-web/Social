import re

with open('app/studio/page.tsx', 'r') as f:
    content = f.read()

# Since it's typescript/react, it might be tricky with regex, but we can just count generic <div and </div
# But there are self closing divs? Not usually.
# Let's count them:
div_opens = len(re.findall(r'<div\b[^>]*>', content))
div_closes = len(re.findall(r'</div\s*>', content))
print(f"Open divs: {div_opens}, Close divs: {div_closes}")
