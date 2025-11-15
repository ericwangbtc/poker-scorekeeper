#!/usr/bin/env node

const path = require("path");

const script = process.argv[2];

if (!script) {
  console.error("Expected a react-scripts command (start, build, test).");
  process.exit(1);
}

// Remove the script name so react-scripts sees the original CLI args.
process.argv.splice(2, 1);

require(path.resolve(__dirname, "./setupDomStorage"));

// eslint-disable-next-line import/no-dynamic-require, global-require
require(require.resolve(`react-scripts/scripts/${script}`));
