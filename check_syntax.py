import sys

def check_file(filename):
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {filename}: {e}")
        return False

    stack = []
    mapping = {')': '(', ']': '[', '}': '{'}
    lines = content.split('\n')
    
    in_string = False
    string_char = None
    in_comment = False
    in_multiline_comment = False
    
    for line_idx, line in enumerate(lines):
        i = 0
        while i < len(line):
            char = line[i]
            
            # Handle comments
            if not in_string:
                if not in_comment and not in_multiline_comment:
                    if line[i:i+2] == '//':
                        break  # rest of the line is a comment
                    elif line[i:i+2] == '/*':
                        in_multiline_comment = True
                        i += 2
                        continue
                elif in_multiline_comment:
                    if line[i:i+2] == '*/':
                        in_multiline_comment = False
                        i += 2
                        continue
                    i += 1
                    continue
            
            if in_multiline_comment:
                i += 1
                continue
                
            # Handle strings
            if char in ["'", '"', '`']:
                if not in_string:
                    in_string = True
                    string_char = char
                elif string_char == char:
                    # check for escape
                    escaped = False
                    k = i - 1
                    while k >= 0 and line[k] == '\\':
                        escaped = not escaped
                        k -= 1
                    if not escaped:
                        in_string = False
                        string_char = None
            
            if not in_string:
                if char in mapping.values():
                    stack.append((char, line_idx + 1, i + 1))
                elif char in mapping.keys():
                    if not stack:
                        print(f"Unmatched closing '{char}' in {filename} at line {line_idx+1}, col {i+1}")
                        return False
                    top, l, c = stack.pop()
                    if top != mapping[char]:
                        print(f"Mismatched closing '{char}' in {filename} at line {line_idx+1}, col {i+1} (opened with '{top}' at line {l}, col {c})")
                        return False
            i += 1

    if stack:
        top, l, c = stack[-1]
        print(f"Unclosed opening '{top}' in {filename} at line {l}, col {c}")
        return False
        
    print(f"{filename}: Syntax looks balanced and clean.")
    return True

files = [
    'js/levels.js',
    'js/physics.js',
    'js/particles.js',
    'js/audio.js',
    'js/game.js'
]

success = True
for f in files:
    if not check_file(f):
        success = False

if not success:
    sys.exit(1)
print("All JS files syntax check PASSED.")
sys.exit(0)
