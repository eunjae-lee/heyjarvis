#!/usr/bin/env node

require("dotenv").config();

const { scrapDailyStat } = require("./tasks/scrapDailyStat");

(async function() {
  await scrapDailyStat();
})();
