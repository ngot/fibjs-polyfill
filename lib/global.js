const process = require('process');

module.exports = options => {
  const global = options.global;
  global.GLOBAL = global;
  global.process = process;
};
