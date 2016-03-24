const path = require('path');
const process = require('process');
const util = require('../util');

const isWindows = util.platform === 'win32';

function assertPath (path) {
  if (typeof path !== 'string') {
    throw new TypeError('Path must be a string.');
  }
}

const splitDeviceRe =
  /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?([\\\/])?([\s\S]*?)$/;

//// Regex to split the tail part of the above into [*, dir, basename, ext]
//const splitTailRe =
//  /^([\s\S]*?)((?:\.{1,2}|[^\\\/]+?|)(\.[^.\/\\]*|))(?:[\\\/]*)$/;

// resolves . and .. elements in a path array with directory names there
// must be no slashes or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray (parts, allowAboveRoot) {
  var res = [];
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i];

    // ignore empty parts
    if (!p || p === '.')
      continue;

    if (p === '..') {
      if (res.length && res[res.length - 1] !== '..') {
        res.pop();
      } else if (allowAboveRoot) {
        res.push('..');
      }
    } else {
      res.push(p);
    }
  }

  return res;
}

function normalizeUNCRoot (device) {
  return '\\\\' + device.replace(/^[\\\/]+/, '').replace(/[\\\/]+/g, '\\');
}

function win32StatPath (path) {
  const result = splitDeviceRe.exec(path);
  const device = result[1] || '';
  const isUnc = !!device && device[1] !== ':';
  return {
    device,
    isUnc,
    isAbsolute: isUnc || !!result[2], // UNC paths are always absolute
      tail: result[3]
  };
}

module.exports = options => {
  if (isWindows) {
    // path.resolve([from ...], to)
    path.resolve = function resolve() {
      var resolvedDevice = '';
      var resolvedTail = '';
      var resolvedAbsolute = false;

      for (var i = arguments.length - 1; i >= -1; i--) {
        var path;
        if (i >= 0) {
          path = arguments[i];
        } else if (!resolvedDevice) {
          path = process.cwd();
        } else {
          // Windows has the concept of drive-specific current working
          // directories. If we've resolved a drive letter but not yet an
          // absolute path, get cwd for that drive. We're sure the device is not
          // an unc path at this points, because unc paths are always absolute.
          path = process.env['=' + resolvedDevice];
          // Verify that a drive-local cwd was found and that it actually points
          // to our drive. If not, default to the drive's root.
          if (!path || path.substr(0, 3).toLowerCase() !==
            resolvedDevice.toLowerCase() + '\\') {
            path = resolvedDevice + '\\';
          }
        }

        assertPath(path);

        // Skip empty entries
        if (path === '') {
          continue;
        }

        const result = win32StatPath(path);
        const device = result.device;
        var isUnc = result.isUnc;
        const isAbsolute = result.isAbsolute;
        const tail = result.tail;

        if (device &&
          resolvedDevice &&
          device.toLowerCase() !== resolvedDevice.toLowerCase()) {
          // This path points to another device so it is not applicable
          continue;
        }

        if (!resolvedDevice) {
          resolvedDevice = device;
        }
        if (!resolvedAbsolute) {
          resolvedTail = tail + '\\' + resolvedTail;
          resolvedAbsolute = isAbsolute;
        }

        if (resolvedDevice && resolvedAbsolute) {
          break;
        }
      }

      // Convert slashes to backslashes when `resolvedDevice` points to an UNC
      // root. Also squash multiple slashes into a single one where appropriate.
      if (isUnc) {
        resolvedDevice = normalizeUNCRoot(resolvedDevice);
      }

      // At this point the path should be resolved to a full absolute path,
      // but handle relative paths to be safe (might happen when process.cwd()
      // fails)

      // Normalize the tail path
      resolvedTail = normalizeArray(resolvedTail.split(/[\\\/]+/), !
        resolvedAbsolute).join('\\');

      return (resolvedDevice + (resolvedAbsolute ? '\\' : '') +
          resolvedTail) ||
        '.';
    };

    path.isAbsolute = function(path) {
      assertPath(path);
      return win32StatPath(path).isAbsolute;
    };
  } else {
    path.resolve = function resolve() {
      var resolvedPath = '';
      var resolvedAbsolute = false;

      for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
        var path = (i >= 0) ? arguments[i] : process.cwd();

        assertPath(path);

        // Skip empty entries
        if (path === '') {
          continue;
        }

        resolvedPath = path + '/' + resolvedPath;
        resolvedAbsolute = path[0] === '/';
      }

      // At this point the path should be resolved to a full absolute path, but
      // handle relative paths to be safe (might happen when process.cwd() fails)

      // Normalize the path
      resolvedPath = normalizeArray(resolvedPath.split('/'), !
        resolvedAbsolute).join('/');

      return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
    };

    path.isAbsolute = function isAbsolute(path) {
      assertPath(path);
      return !!path && path[0] === '/';
    };
  }
};
