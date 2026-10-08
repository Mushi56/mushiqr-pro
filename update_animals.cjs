const fs = require('fs');
const file = 'src/data/qrTemplates/animalTemplates.js';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/"styleFamily": "image",/g, '"styleFamily": "image",\n    "headline": "> Scan to Connect <",');
fs.writeFileSync(file, content);
console.log('Updated animalTemplates.js successfully');
