import re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Pattern with Design in Color Section
content = re.sub(
    r'<QRDotsIcon />\s*<span>Pattern</span>',
    '<QRDotsIcon />\n                                <span>Design</span>',
    content,
    count=1
)

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
