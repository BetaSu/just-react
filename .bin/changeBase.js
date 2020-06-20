const fs = require('fs');
const path = require('path');

const [_, _1, base] = process.argv;

const config = require('../docs/.vuepress/config');
config.base = base || '';
const newConfigStr = `module.exports = ${JSON.stringify(config, null, '\t')}`;

fs.writeFileSync(path.resolve(__dirname, '../docs/.vuepress/config.js'), newConfigStr);
