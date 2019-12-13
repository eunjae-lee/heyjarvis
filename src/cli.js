#!/usr/bin/env node

require("dotenv").config();
require = require("esm")(module /*, options*/);

(async function() {
  try {
    await require("./main").run();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
