const fs = require('fs');
const file = 'app/editor/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /Crop, Eye, EyeOff, Type, Plus, Trash2, ChevronDown, Square, Circle, Triangle, Hexagon, Sliders, Wand2,/,
  "Eye, EyeOff,"
);

content = content.replace(
  /AlignHorizontalJustifyStart, AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd,/,
  ""
);

content = content.replace(
  /AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd, Link2/,
  "Link2"
);

fs.writeFileSync(file, content);
