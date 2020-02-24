"use strict";

require('dotenv').config();

const config = {
  NEXMO_API_KEY: process.env['NEXMO_API_KEY'],
  NEXMO_API_SECRET: process.env['NEXMO_API_SECRET'],
  NEXMO_DEBUG: process.env['NEXMO_DEBUG'],
  NEXMO_APP_ID: process.env['NEXMO_APP_ID'],
  PROVISIONED_NUMBERS: process.env['PROVISIONED_NUMBERS']? JSON.parse(process.env['PROVISIONED_NUMBERS']) : []
};

module.exports = config;
