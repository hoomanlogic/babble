'use strict';

var core = require('./src/core');
Object.assign(core, require('./src/durations'));
Object.assign(core, require('./src/moments'));
Object.assign(core, require('./src/numbers'));
module.exports = core;
