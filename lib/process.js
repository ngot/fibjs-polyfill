const util = require('../util');
const process = require('process');
const fs = require('fs');
const path = require('path');

module.exports = options => {
  process.platform = util.platform;

  let argv = process.argv.slice(2);
  argv.unshift(path.resolve(process.cwd(), process.argv[1]));
  argv.unshift(process.execPath);

  // delete the origin key, redefine it below
  if (process.hasOwnProperty('argv')) {
    delete process.argv
  }

  Object.defineProperty(process, 'argv', {
    writable: true,
    configurable: true,
    enumerable: true,
    value: argv
  });

  let _umask;
  process.umask = function umask() {
    if (arguments.length === 0) {
      if (!_umask) {
        _umask = fs.umask(0);
        // reset umask
        fs.umask(_umask);
      }
      return _umask;
    } else {
      let mask = arguments[0];
      if (typeof mask === 'string') {
        mask = util.parseOctal(mask)
      }
      return fs.umask(mask);
    }
  };
};
