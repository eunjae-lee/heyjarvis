#!/usr/bin/env bash

(rm -rf functions-build && mkdir functions-build)
(cd functions/scrap-daily-stat && rm -rf node_modules && yarn install --production && chmod -R 777 node_modules && zip -r scrap-daily-stat.zip * >> /dev/null 2>&1)
(mv functions/scrap-daily-stat/scrap-daily-stat.zip functions-build)
