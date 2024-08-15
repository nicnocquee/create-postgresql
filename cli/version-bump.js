const fs = require('fs');
const path = require('path');

// Read the package.json file
const packageJsonPath = path.join(__dirname, 'package.json');
// eslint-disable-next-line import/no-dynamic-require
const packageJson = require(packageJsonPath);

// Bump the patch version
const versionParts = packageJson.version.split('.');
versionParts[2] = new Date().getTime();
packageJson.version = versionParts.join('.');

// Write the updated package.json
fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

console.log(`Version bumped to ${packageJson.version}`);
