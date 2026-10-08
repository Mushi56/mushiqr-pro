const fs = require('fs');
const file = 'src/data/qrTemplates/animalTemplates.js';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/\n    "headline": "> Scan to Connect <",/g, '');
fs.writeFileSync(file, content);
console.log('Removed headline from animalTemplates.js successfully');
