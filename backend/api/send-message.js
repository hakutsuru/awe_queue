"use strict";

// handler configuration
const config = {};
config.QUEUE = process.env.QUEUE;
config.REDIS_HOST = process.env.REDIS_HOST;
config.REDIS_PORT = process.env.REDIS_PORT;

// cache configuration
var Redis = require("ioredis");
var redis = null;

// express routing
var express = require("express");
var router = express.Router();

// node tooling
const uuid = require("uuid/v1");

// add message to awe-queue
router.post("/send-message", function(req, res) {
  var message;
  if (!req.body.message) {
    res.status(400).send("Message content required.");
  } else {
    redis = new Redis(config.REDIS_PORT, config.REDIS_HOST);
    message = {};
    message.key = uuid();
    message.timestamp = Date.now();
    message.retry_count = 0;
    message.message = req.body.message;
    redis.rpush(config.QUEUE, JSON.stringify(message), function(err, data) {
      if (err) {
        console.log("send-message :: rpush-aweQueue-err ::", err);
        res.status(500).send("Queue failure on publish.");
        return;
      }
      res.setHeader("Content-Type", "application/json");
      res.send(JSON.stringify({ status: "okay", key: message.key }));
    });
  }
});

module.exports = router;
