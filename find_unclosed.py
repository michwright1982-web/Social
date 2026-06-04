import re

with open('app/studio/page.tsx', 'r') as f:
    lines = f.readlines()

stack = []
for i, line in enumerate(lines):
    # Find <div ...> and </div
    opens = re.finditer(r'<(div|motion\.div)\b[^>]*>', line)
    for match in opens:
        # ignore self-closing
        if match.group(0).endswith('/>'):
            continue
        stack.append((match.group(1), i+1))
    
    closes = re.finditer(r'</(div|motion\.div)\s*>', line)
    for match in closes:
        tag = match.group(1)
        if len(stack) == 0:
            print(f"Extra closing tag </{tag}> at line {i+1}")
        else:
            top = stack.pop()
            if top[0] != tag:
                print(f"Mismatch at line {i+1}: expected </{top[0]}> but found </{tag}>. Opened at line {top[1]}")

print("Unclosed tags:")
for tag, line in stack:
    print(f"<{tag}> opened at line {line}")
