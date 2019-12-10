#!/usr/bin/env node

require("dotenv").config();
require = require("esm")(module /*, options*/);

(async function() {
  await require("./main").run();
})();
