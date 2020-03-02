// Copyright IBM Corp. 2019,2020. All Rights Reserved.
// Node module: @loopback/test-repository-cloudant
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

// This script is for creating database for couchdb3 instance that created by
// `sh setup.sh`. The setup is separated to two files is because this step
// is hard to achieve by curl. See README for database configuration.

'use strict';

const async = require('async');
const http = require('http');
const chalk = require('chalk');

process.env.CLOUDANT_DATABASE = process.env.CLOUDANT_DATABASE || 'testdb';
process.env.CLOUDANT_PASSWORD = process.env.CLOUDANT_PASSWORD || 'pass';
process.env.CLOUDANT_USERNAME = process.env.CLOUDANT_USERNAME || 'admin';

process.env.CLOUDANT_PORT = process.env.CLOUDANT_PORT || 5984;
process.env.CLOUDANT_HOST = process.env.CLOUDANT_HOST || 'localhost';
process.env.CLOUDANT_URL = 'TBD';

// create database and log the status if success
async.waterfall(
  [createDB(process.env.CLOUDANT_DATABASE), logStatus()],
  function(testErr) {
    if (testErr) {
      console.error('error running tests:', testErr);
      process.exit(1);
    }
  },
);

function createDB(db) {
  return function create(next) {
    const usr = process.env.CLOUDANT_USERNAME;
    const pass = process.env.CLOUDANT_PASSWORD;
    const host = process.env.CLOUDANT_HOST;
    const port = process.env.CLOUDANT_PORT;
    process.env.CLOUDANT_URL =
      'http://' + usr + ':' + pass + '@' + host + ':' + port;

    const opts = {
      method: 'PUT',
      path: '/' + db,
      host: process.env.CLOUDANT_HOST,
      port: process.env.CLOUDANT_PORT,
      auth: process.env.CLOUDANT_USERNAME + ':' + process.env.CLOUDANT_PASSWORD,
    };

    http
      .request(opts, function(res) {
        res.pipe(devNull());
        res.on('error', next);
        res.on('end', function() {
          setImmediate(next, null);
        });
      })
      .on('error', function() {
        try {
          // retry if socket hangs up too early
          create(next);
        } catch (error) {
          throw new Error(error);
        }
      })
      .end();
  };
}

function logStatus() {
  return function createENVFile(next) {
    console.log(
      chalk.yellow(
        `\nStatus: ${chalk.green('Set up completed successfully.\n')}`,
      ),
    );
    console.log(`Instance url: ${chalk.yellow(process.env.CLOUDANT_URL)}\n`);
    console.log(`To run the test suite: ${chalk.yellow(`npm test`)}\n\n`);
    next();
  };
}

// A Writable Stream that just consumes a stream. Useful for draining readable
// streams so that they 'end' properly, like sometimes-empty http responses.
function devNull() {
  return new require('stream').Writable({
    write: function(_chunk, _encoding, cb) {
      return cb(null);
    },
  });
}
