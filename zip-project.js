const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const output = fs.createWriteStream(path.join(__dirname, 'DevTask.zip'));
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level.
});

output.on('close', function() {
  console.log(`\nSuccess! DevTask.zip has been created.`);
  console.log(`Total size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
});

archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    console.warn(err);
  } else {
    throw err;
  }
});

archive.on('error', function(err) {
  throw err;
});

archive.pipe(output);

// Append files and directories, excluding node_modules, dist, db files, etc.
archive.glob('**/*', {
  cwd: __dirname,
  ignore: [
    'node_modules/**',
    '**/node_modules/**',
    'client/dist/**',
    'server/dist/**',
    'server/uploads/**',
    'DevTask.zip',
    '.git/**',
    'server/prisma/dev.db*',
    '.env'
  ]
});

archive.finalize();
