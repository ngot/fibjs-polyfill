const fs = require('fs');
const path = require('path');

const filelist = fs.readdir(path.join(__dirname, 'lib')).toJSON();

filelist.map(file => {
  if (file.name.endsWith('.js')) {
    require(path.join(__dirname, 'lib', file.name))
  }
});
