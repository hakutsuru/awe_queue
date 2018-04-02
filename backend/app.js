"use strict";

// express configuration
const express = require("express");
var bodyParser = require("body-parser");
const app = express();

// configure app to use bodyParser()
// simplify parsing data from POST request
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// constants
const checkoutLifetime = 120 * 1000;
const checkouts_key = "checkouts";
const monitor_key = "monitor";
const negInf = "-inf";
const port = process.env.PORT || 3000;
const queue_key = "queue";
const redis_host = "localhost";
const redis_port = 6379;
const rescueInterval = 15000; // 2 * 1000
process.env["CHECKOUT_LIFETIME"] = checkoutLifetime;
process.env["CHECKOUTS"] = checkouts_key;
process.env["MONITOR"] = monitor_key;
process.env["QUEUE"] = queue_key;
process.env["REDIS_HOST"] = redis_host;
process.env["REDIS_PORT"] = redis_port;
process.env["RESCUE_INTERVAL"] = rescueInterval;

// rescueInterval is the schedule for moving checked-out,
// orphaned messages back to the queue for processing

// cache configuration
var Redis = require("ioredis");
var redis = new Redis(redis_port, redis_host);

/*
// WARNING - code organization for aesthetics and
// ease of review, watching debug console reveals
// extra steps and potential latency, so keeping 
// routes here could be superior
app.post('/send-message', function (req, res) {
  console.log(JSON.stringify(req.body, null, 4));
  res.send('shaving yaks!\n');
})
*/

// handle cors
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, HEAD, DELETE");
  next();
});

// add message to awe-queue
app.use(require("./api/send-message"));

// check-out messages from awe-queue
app.use(require("./api/receive-message"));

// delete processed messages
app.use(require("./api/delete-message"));

// obtain awe-queue metrics
app.use(require("./api/get-stats"));

// rescue messages which appear lost
// find any messages checked-out longer than configured
// limit, and move those orphan messages onto queue
// beware -- IIFE will confuse router
function rescueOrphans() {
  setTimeout(rescueOrphans, rescueInterval);
  var rescues;
  // obtain keys for messages to rescue
  var threshold = Date.now() - checkoutLifetime;
  redis.zrangebyscore(monitor_key, negInf, threshold, function(err, keys) {
    //console.log("rescue-orphans :: zrangebyscore-keys ::", keys);
    if (keys.length === 0) {
      return;
    }
    redis.hmget(checkouts_key, ...keys, function(err, messages) {
      messages = messages.filter(message => {
        return message !== null;
      });
      //console.log("rescue-orphans :: hmget-messages ::", messages);
      messages = messages.map(message => {
        message = JSON.parse(message);
        message.retry_count += 1;
        return message;
      });
      //console.log("rescue-orphans :: updated-messages ::", messages);
      // update three associated data-structures
      var commands = [];
      messages.forEach(message => {
        commands.push(["rpush", queue_key, JSON.stringify(message)]);
      });
      messages.forEach(message => {
        commands.push(["hdel", checkouts_key, message.key]);
      });
      commands.push(["zremrangebyscore", monitor_key, negInf, threshold]);
      //console.log("app :: rescue-commands ::", commands);
      redis.multi(commands).exec(function(err, data) {
        if (err) {
          console.log("rescue-orphans :: rescue-exec-err ::", err);
          return;
        }
        if (!data.every(x => x[0] === null)) {
          // check for any command errors
          console.log("rescue-orphans :: rescue-cmd-err ::", err);
          return;
        }
        // report status
        var status;
        if (messages.length > 1) {
          status = `rescue-orphans :: ${messages.length} messages restored...`;
        } else if (messages.length === 1) {
          status = `rescue-orphans :: 1 message restored...`;
        } else {
          status = `rescue-orphans :: no orphans found...`;
        }
        console.log(status);
      });
    });
  });
}
rescueOrphans();

app.listen(port, () => console.log(`awe-queue listening on port ${port}!`));
