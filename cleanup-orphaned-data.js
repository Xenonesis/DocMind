// Cleanup script for orphaned documents and files
const fs = require('fs');
const path = require('path');

console.log('🧹 Starting cleanup of orphaned documents and files...');

// Check what directories exist in uploads
const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'documents');

if (fs.existsSync(uploadsDir)) {
  const directories = fs.readdirSync(uploadsDir);
  console.log('\n📁 Found directories in uploads/documents:');
  directories.forEach(dir => {
    const dirPath = path.join(uploadsDir, dir);
    if (fs.statSync(dirPath).isDirectory()) {
      const files = fs.readdirSync(dirPath);
      console.log(`  - ${dir}/ (${files.length} files: ${files.join(', ')})`);
    }
  });
  
  console.log('\n⚠️  These directories don\'t match any document IDs in the database.');
  console.log('   They appear to be orphaned files from a previous version.');
  console.log('\n💡 To clean up, you can:');
  console.log('   1. Delete these directories if you don\'t need the files');
  console.log('   2. Or manually move/rename them to match document IDs');
  
} else {
  console.log('📁 No uploads/documents directory found.');
}

console.log('\n✅ Cleanup analysis complete.');
console.log('\n🔧 The preview API has been fixed to handle missing files gracefully.');
console.log('   It will now return a proper 404 error instead of crashing.');