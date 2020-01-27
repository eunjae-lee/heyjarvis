#!/usr/bin/env node

require("dotenv").config();
require = require("esm")(module /*, options*/);

const { scrapDailyStat } = require("./tasks/scrapDailyStat");

(async function() {
  await scrapDailyStat();
})();
