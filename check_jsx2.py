import re

with open('app/studio/page.tsx', 'r') as f:
    content = f.read()

div_opens = len(re.findall(r'<div\b[^>]*>', content))
div_closes = len(re.findall(r'</div\s*>', content))
print(f"Open divs: {div_opens}, Close divs: {div_closes}")

motion_opens = len(re.findall(r'<motion\.div\b[^>]*>', content))
motion_closes = len(re.findall(r'</motion\.div\s*>', content))
print(f"Open motion divs: {motion_opens}, Close motion divs: {motion_closes}")
