const fs = require('fs');
const path = require('path');

// Path to the themes directory
const themesDir = path.join(process.cwd(), 'public', 'uploads', 'themes');

console.log(`Checking theme images in: ${themesDir}`);

// Check if directory exists
if (!fs.existsSync(themesDir)) {
  console.error(`Directory does not exist: ${themesDir}`);
  console.log('Creating directory...');
  
  try {
    fs.mkdirSync(themesDir, { recursive: true });
    console.log('Directory created successfully');
  } catch (err) {
    console.error('Error creating directory:', err);
    process.exit(1);
  }
}

// Read the directory
try {
  const files = fs.readdirSync(themesDir);
  
  console.log(`Found ${files.length} files in themes directory:`);
  
  if (files.length === 0) {
    console.log('No files found.');
  } else {
    files.forEach(file => {
      const filePath = path.join(themesDir, file);
      const stats = fs.statSync(filePath);
      
      console.log(`- ${file} (${stats.size} bytes, created: ${stats.birthtime.toLocaleString()})`);
    });
  }
} catch (err) {
  console.error('Error reading directory:', err);
} 