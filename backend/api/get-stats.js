"use strict";

// handler configuration
const config = {};
config.CHECKOUT_LIFETIME = process.env.CHECKOUT_LIFETIME;
config.CHECKOUTS = process.env.CHECKOUTS;
config.MONITOR = process.env.MONITOR;
config.QUEUE = process.env.QUEUE;
config.REDIS_HOST = process.env.REDIS_HOST;
config.REDIS_PORT = process.env.REDIS_PORT;
config.RESCUE_INTERVAL = process.env.RESCUE_INTERVAL;

// cache configuration
var Redis = require("ioredis");
var redis = null;

// express routing
var express = require("express");
var router = express.Router();

// obtain awe-queue metrics
router.get("/get-stats", function(req, res) {
  redis = new Redis(config.REDIS_PORT, config.REDIS_HOST);
  redis
    .multi()
    .llen(config.QUEUE)
    .hlen(config.CHECKOUTS)
    .exec(function(err, data) {
      var listData, hashData;
      [listData, hashData] = data;
      //console.log("get-stats :: listData ::", listData);
      //console.log("get-stats :: hashData ::", hashData);
      if (listData[0]) {
        console.log("get-stats :: llen-err ::", listData[0]);
        res.status(500).send("Queue failure on stats query (list).");
        return;
      } else if (hashData[0]) {
        console.log("get-stats :: hlen-err ::", hashData[0]);
        res.status(500).send("Queue failure on stats query (hash).");
        return;
      } else {
        res.setHeader("Content-Type", "application/json");
        res.send(
          JSON.stringify({
            status: "okay",
            stats: {
              queue_length: listData[1],
              checkouts_count: hashData[1],
              checkout_lifetime: `${config.CHECKOUT_LIFETIME / 1000}s`,
              rescue_interval: `${config.RESCUE_INTERVAL / 1000}s`
            }
          })
        );
      }
    });
});

module.exports = router;
