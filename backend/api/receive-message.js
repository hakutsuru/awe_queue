"use strict";

// handler configuration
const config = {};
config.CHECKOUTS = process.env.CHECKOUTS;
config.MONITOR = process.env.MONITOR;
config.QUEUE = process.env.QUEUE;
config.REDIS_HOST = process.env.REDIS_HOST;
config.REDIS_PORT = process.env.REDIS_PORT;

// cache configuration
var Redis = require("ioredis");
var redis = null;

// express routing
var express = require("express");
var router = express.Router();

// check-out messages from awe-queue
router.get("/receive-message", function(req, res) {
  redis = new Redis(config.REDIS_PORT, config.REDIS_HOST);
  var batchCount, count, messages, status;
  // obtain batchCount via query param
  var queryCount = req.query.count;
  if (queryCount) {
    batchCount = parseInt(queryCount, 10);
  } else {
    batchCount = 1;
  }
  var stopIndex = batchCount - 1;
  var batch = {};
  // get messages off queue
  redis
    .multi()
    .lrange(config.QUEUE, 0, stopIndex)
    .ltrim(config.QUEUE, batchCount, -1)
    .exec(function(err, data) {
      //console.log("receive-message :: queue-multi-data ::", data);
      if (err) {
        console.log("receive-message :: aweQueue-err ::", err);
        res.status(500).send("Queue failure on consume.");
        return;
      }
      // redis multi should return array, one entry for each
      // command, e.g. [null, result]
      var rangeData, trimData;
      [rangeData, trimData] = data;
      //console.log("receive-message :: rangeData ::", rangeData);
      //console.log("receive-message :: trimData ::", trimData);
      if (trimData[0]) {
        console.log("receive-message :: ltrim-err ::", trimData[0]);
        res.status(500).send("Queue failure on consume (range).");
        return;
      }
      if (rangeData[0]) {
        console.log("receive-message :: lrange-err ::", rangeData[0]);
        res.status(500).send("Queue failure on consume (trim).");
        return;
      } else {
        // obtain collection of queue-messages
        messages = rangeData[1].map(message => {
          return JSON.parse(message);
        });
        //console.log("receive-message :: messages ::", messages);
        //console.log("receive-message :: messages[0] ::", messages[0]);
        // determine status
        var info = "";
        count = messages.length;
        if (count == 0) {
          info = "No messages available in queue.";
        } else if (count !== batchCount) {
          info = "Fewer messages available than requested.";
        } else {
          info = "Requested batch-size available.";
        }
        status = "okay";
        // assemble batch
        batch.status = status;
        batch.message = info;
        batch.messages = messages;
        //console.log("receive-message :: batch ::", batch);
        // stash messages to support rescue
        var timestamp = Date.now();
        var commands = [];
        messages.forEach(message => {
          commands.push(["hset", config.CHECKOUTS, message.key, JSON.stringify(message)]);
          commands.push(["zadd", config.MONITOR, timestamp, message.key]);
        });
        //console.log("receive-message :: commands ::", commands);
        redis.multi(commands).exec(function(err, data) {
          if (err) {
            console.log("receive-message :: rescue-exec-err ::", err);
            res.status(500).send("Queue failure updating status (exec).");
            return;
          }
          if (!data.every(x => x[0] === null)) {
            // check for any command errors
            console.log("receive-message :: rescue-cmd-err ::", err);
            res.status(500).send("Queue failure updating status (cmd).");
            return;
          }
          // return batch
          res.setHeader("Content-Type", "application/json");
          res.send(JSON.stringify(batch));
        });
      }
    });
});

// we strive for at-least-once delivery
// so if checked-out message is not then
// deleted, it will be added back on queue

module.exports = router;
