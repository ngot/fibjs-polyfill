const fs = require('fs');
const process = require('process');
const global = fs();

global.global = global;
global.GLOBAL = global;
global._ = global;
global.process = process;
