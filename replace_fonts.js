const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (fullPath.includes('node_modules') || fullPath.includes('.next')) continue;
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Specifically replace the import in globals.css
      if (fullPath.endsWith('globals.css')) {
          content = content.replace(
              "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800&display=swap');",
              "@import url('https://fonts.googleapis.com/css2?family=Saira:wght@300;400;500;600;700;800;900&display=swap');"
          );
      }
      
      // Replace inline font families
      let newContent = content
        .replace(/'Inter'/g, "'Saira'")
        .replace(/'Outfit'/g, "'Saira'")
        .replace(/"'Inter', sans-serif"/g, "\"'Saira', sans-serif\"")
        .replace(/"'Outfit', sans-serif"/g, "\"'Saira', sans-serif\"");
        
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent);
        console.log('Updated ' + fullPath);
      }
    }
  }
}

replaceInDir('/Users/vinith/Desktop/ai-marketing-hub/app');
replaceInDir('/Users/vinith/Desktop/ai-marketing-hub/components');
