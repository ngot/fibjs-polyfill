require('../')({
  global: global
});

run('./test-path.js');
run('./test-umask.js');

console.log('tests passed!');
