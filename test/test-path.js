const util = require('../util');
const assert = require('assert');
const path = require('path');

const isWindows = util.platform === 'win32';

// path.resolve tests
if (isWindows) {
  // windows
  var resolveTests =
    // arguments                                    result
    [[['c:/blah\\blah', 'd:/games', 'c:../a'], 'c:\\blah\\a'],
      [['c:/ignore', 'd:\\a/b\\c/d', '\\e.exe'], 'd:\\e.exe'],
      [['c:/ignore', 'c:/some/file'], 'c:\\some\\file'],
      [['d:/ignore', 'd:some/dir//'], 'd:\\ignore\\some\\dir'],
      [['.'], process.cwd()],
      [['//server/share', '..', 'relative\\'], '\\\\server\\share\\relative'],
      [['c:/', '//'], 'c:\\'],
      [['c:/', '//dir'], 'c:\\dir'],
      [['c:/', '//server/share'], '\\\\server\\share\\'],
      [['c:/', '//server//share'], '\\\\server\\share\\'],
      [['c:/', '///some//dir'], 'c:\\some\\dir']
    ];
} else {
  // Posix
  var resolveTests =
    // arguments                                    result
    [[['/var/lib', '../', 'file/'], '/var/file'],
      [['/var/lib', '/../', 'file/'], '/file'],
      [['a/b/c/', '../../..'], process.cwd()],
      [['.'], process.cwd()],
      [['/some/dir', '.', '/absolute/'], '/absolute']];
}
var failures = [];

resolveTests.forEach(function(test) {
  var actual = path.resolve.apply(path, test[0]);
  var expected = test[1];
  var message = 'path.resolve(' + test[0].map(JSON.stringify).join(',') + ')' +
    '\n  expect=' + JSON.stringify(expected) +
    '\n  actual=' + JSON.stringify(actual);
  if (actual !== expected) failures.push('\n' + message);
  // assert.equal(actual, expected, message);
});
assert.equal(failures.length, 0, failures.join(''));

// path.isAbsolute tests
assert.equal(path.isAbsolute('/home/foo'), true);
assert.equal(path.isAbsolute('/home/foo/..'), true);
assert.equal(path.isAbsolute('bar/'), false);
assert.equal(path.isAbsolute('./baz'), false);
