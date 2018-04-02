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

// delete processed messages
router.delete("/delete-message/:id", function(req, res) {
  redis = new Redis(config.REDIS_PORT, config.REDIS_HOST);
  // obtain message-key via url
  // while we could remove key from monitor set
  // rescue task will handle this efficiently
  var key = req.params.id;
  redis.hdel(config.CHECKOUTS, key, function(err, data) {
    if (err) {
      // failure here is dubious, perhaps warn?
      console.log("del-msg :: checkouts-err ::", err);
      res.status(500).send("Queue failure on delete.");
      return;
    }
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify({ status: "okay" }));
  });
});

module.exports = router;
