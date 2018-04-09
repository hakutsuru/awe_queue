awe_queue
====

## Orientation

**tl;dr Design AweQ to provide _at-least-once_ delivery of queued messages.**

Awe-Queue (AweQ) Design Guidelines...

Build queue based on [AWS Simple Queue Service (SQS)](https://aws.amazon.com/sqs/).

AweQ is a broker that allows producers to write to it, and consumers to read from it. It runs on a single server. When a producer writes to AweQ, a message ID is generated and returned. When a consumer polls AweQ for new messages, it gets messages which are not being processed.

When a consumer gets a set of messages, it must notify AweQ that it has processed each message (individually). This deletes that message from the AweQ database. When a message is received by a consumer, but not marked as processed within a configurable amount of time, the message should become available to consumers.


## Tasks

- Design a module that represents AweQ. You can abstract the logic for storage.<br />
- Setup a test app to publish messages and demonstrate how AweQ works.<br />
- Build a quick-and-dirty developer tool to explore the state of AweQ.<br />
- Write documentation for potential API endpoints.<br />
- Discuss scaling AweQ to meet high-volume requests.<br />
- Bonus points for Node.js, and ES6/ES7.<br />


## Environment

Host environment...

```
$ VBoxManage --version
5.1.10r112026

$ vagrant --version
Vagrant 1.8.6

$ ansible --version
ansible 2.2.0.0

$ node --version
v7.4.0

$ npm --version
4.0.5
```


## Getting Started

### Queue Server

Run queue in vagrant environment...

This could seem like too much trouble, <em>where art though docker</em>, but really, this will be cool!

```
$ cd awe_queue
$ cd vagrant/aweq-dev
$ vagrant up
$ vagrant ssh
vagrant@aweq-dev:~$ cd /opt/backend
vagrant@aweq-dev:~$ npm install
vagrant@aweq-dev:~$ npm run start
```

<strong>Optional:</strong> If you are down with `redis-cli`, run this in another shell...

```
vagrant@aweq-dev:~$ redis-cli
127.0.0.1:6379> keys *
1) "queue"
127.0.0.1:6379> llen queue
(integer) 10
```

More information on lists, sorted sets and hashes are available from [Redis Docs](https://redis.io/commands).

### Quick and Dirty Developer Tool (e.g. Frontend)

```
$ cd awe_queue
$ cd frontend
$ npm install
$ npm run dev
```

Visit Awe-Queue site via `http://localhost:8080/`.

The site has views for each of the queue API endpoints.

- send-message<br />
- receive-message<br />
- delete-message<br />
- get-stats<br />

### CLI API Testing

Commands run within virtual environment (`localhost` should be replaced by server ip otherwise).

`send-message` call which must fail...
```
$ curl -i -X POST -d '{"message": ""}' -H "Content-Type: application/json" http://localhost:3000/send-message
```

`send-message` call to publish message...
```
$ curl -i -X POST -d '{"message": "job-details-01"}' -H "Content-Type: application/json" http://localhost:3000/send-message
```

`receive-message` calls to consume messages off queue...
```
$ curl -i -X GET http://localhost:3000/receive-message?count=4
$ curl -i -X GET http://localhost:3000/receive-message
```

`delete-message` call to remove message from queue (once processed)...
```
$ curl -i -X DELETE http://localhost:3000/delete-message/123e4567-e89b-12d3-a456-426655440000
```

`get-stats` call to obtain queue metrics...
```
$ curl -i -X GET http://localhost:3000/get-stats
```


## Testing Requirements

**Manual Testing via Developer Tooling**

Using our Quick and Dirty Developer Tool to validate requirements from the Design Guidelines...

Each test builds upon previous test actions. The benefit of being a knowlege professional is that you can be dismissive of instructions, with the understanding that if you change a recipe, you should anticipate different results.

For testing, you may note the Message IDs created, but this is not specified in testing, as it was deemed unhelpful. Paranoia can be a crucial survival skill, YMMV.

**Starting Over: When testing, if ever confused, or desiring a _clean slate_ — drop into a new shell on the backend and _flush the database_...**
```
vagrant@aweq-dev:~$ redis-cli
127.0.0.1:6379> flushdb
OK
127.0.0.1:6379> keys *
(empty list or set)
```

### Producer Writes To AweQ, Obtains Message ID

Type "job-details-01" into the `Queue Message` text field, and click the `Send Message` button.

Note response information with `Message ID` added to page...
```
Message "21c37e00-3b81-11e8-8aba-b76f21b15267" posted to queue...
```

Each Message ID is a [Universally Unique Identifier (UUID)](https://en.wikipedia.org/wiki/Universally_unique_identifier).

Visit `Queue Status` page, and click `Check Stats` button...
```
Stats for the Queue...
{
    "status": "okay",
    "stats": {
        "queue_length": 1,
        "checkouts_count": 0,
        "checkout_lifetime": "120s",
        "rescue_interval": "2s"
    }
}
```

### Consumer Polls AweQ for Messages, Batches Are Disjointed

**Caveat: Batches are disjointed when no checked out messages have been restored to AweQ due to timing out. Thus, simple testing should be performed when no messages are checked out, and all messages consumed in less than the `checkoutLifetime` (of 120s).**

Please add six more messages to AweQ via the `Send Message` form (recommended messages are "job-details-02", "job-details-03", etc).

Check AweQ status via `Queue Status` page...
```
Stats for the Queue...
{
    "status": "okay",
    "stats": {
        "queue_length": 7,
        "checkouts_count": 0,
        "checkout_lifetime": "120s",
        "rescue_interval": "2s"
    }
}
```

Visit `Receive Message` page, enter "3" into the `Batch Size` text field...

You will click the `Receive Message` button three times. The point here is to note all messages are consumed, and the batches do not have any common messages.

Example Results...

First Batch:
```
Messages from the Queue...
{
    "status": "okay",
    "message": "Requested batch-size available.",
    "messages": [
        {
            "key": "ab3e6df0-3b83-11e8-8aba-b76f21b15267",
            "timestamp": 1523229733455,
            "retry_count": 0,
            "message": "job-details-01"
        },
        {
            "key": "acb46c20-3b83-11e8-8aba-b76f21b15267",
            "timestamp": 1523229735906,
            "retry_count": 0,
            "message": "job-details-02"
        },
        {
            "key": "ae1079b0-3b83-11e8-8aba-b76f21b15267",
            "timestamp": 1523229738187,
            "retry_count": 0,
            "message": "job-details-03"
        }
    ]
}
```

Second Batch:
```
Messages from the Queue...
{
    "status": "okay",
    "message": "Requested batch-size available.",
    "messages": [
        {
            "key": "af4fb070-3b83-11e8-8aba-b76f21b15267",
            "timestamp": 1523229740279,
            "retry_count": 0,
            "message": "job-details-04"
        },
        {
            "key": "b09b9160-3b83-11e8-8aba-b76f21b15267",
            "timestamp": 1523229742454,
            "retry_count": 0,
            "message": "job-details-05"
        },
        {
            "key": "b1b517b0-3b83-11e8-8aba-b76f21b15267",
            "timestamp": 1523229744299,
            "retry_count": 0,
            "message": "job-details-06"
        }
    ]
}
```

Third Batch:
```
Messages from the Queue...
{
    "status": "okay",
    "message": "Fewer messages available than requested.",
    "messages": [
        {
            "key": "b2ac48f0-3b83-11e8-8aba-b76f21b15267",
            "timestamp": 1523229745919,
            "retry_count": 0,
            "message": "job-details-07"
        }
    ]
}
```

Queue Status (from `Queue Status` page)...
```
Stats for the Queue...
{
    "status": "okay",
    "stats": {
        "queue_length": 0,
        "checkouts_count": 7,
        "checkout_lifetime": "120s",
        "rescue_interval": "2s"
    }
}
```

### Consumed Messages Are Returned to AweQ When Not-Acknowledged

Via `Request Messages` page, request messages until none more are available (note how you can adjust the `Batch Size` larger to rapidly checkout messages)...
```
Messages from the Queue...
{
    "status": "okay",
    "message": "No messages available in queue.",
    "messages": []
}
```

Check AweQ status (via the `Queue Status` page), `checkout_count` should be non-zero...
```
Stats for the Queue...
{
    "status": "okay",
    "stats": {
        "queue_length": 7,
        "checkouts_count": 0,
        "checkout_lifetime": "120s",
        "rescue_interval": "2s"
    }
}
```

*Wait longer than `checkout_lifetime`, shown as 120s in the AweQ configuration used for testing.*

Reload AweQ status on the `Queue Status` page...
```
Stats for the Queue...
{
    "status": "okay",
    "stats": {
        "queue_length": 7,
        "checkouts_count": 0,
        "checkout_lifetime": "120s",
        "rescue_interval": "2s"
    }
}
```

Note how checkouts have been returned to the queue.

Checkout a three-message batch from AweQ (via `Receive Messages` page)...
```
Messages from the Queue...
{
    "status": "okay",
    "message": "Requested batch-size available.",
    "messages": [
        {
            "key": "ab3e6df0-3b83-11e8-8aba-b76f21b15267",
            "timestamp": 1523229733455,
            "retry_count": 1,
            "message": "job-details-01"
        },
        {
            "key": "acb46c20-3b83-11e8-8aba-b76f21b15267",
            "timestamp": 1523229735906,
            "retry_count": 1,
            "message": "job-details-02"
        },
        {
            "key": "ae1079b0-3b83-11e8-8aba-b76f21b15267",
            "timestamp": 1523229738187,
            "retry_count": 1,
            "message": "job-details-03"
        }
    ]
}
```

*Details which may only be interesting to someone who falls upon the thorns of queueing theory... Messages are restored in order, to the end of AweQ, as though new messages, but with an updated `retry_count` to track issues. Due to ambiguity in queue specification, this was chosed as **simpler**.*

### Messages Acknowledged After Being Consumed Are Deleted

Confirm starting AweQ status...
```
Stats for the Queue...
{
    "status": "okay",
    "stats": {
        "queue_length": 7,
        "checkouts_count": 0,
        "checkout_lifetime": "120s",
        "rescue_interval": "2s"
    }
}
```

Consume a single message via `Receive Message` page...
```
Messages from the Queue...
{
    "status": "okay",
    "message": "Requested batch-size available.",
    "messages": [
        {
            "key": "af4fb070-3b83-11e8-8aba-b76f21b15267",
            "timestamp": 1523229740279,
            "retry_count": 1,
            "message": "job-details-04"
        }
    ]
}
```

Acknowledge message processing via `Delete Message` page. Enter message key from batch into `Message Key` into field (e.g. "af4fb070-3b83-11e8-8aba-b76f21b15267"). Click `Delete Message` button...
```
Message "af4fb070-3b83-11e8-8aba-b76f21b15267" deleted...
```

Check AweQ status, and note how the sum of `queue_length` and `checkouts_count` is now one less than it was before the message was deleted...
```
Stats for the Queue...
{
    "status": "okay",
    "stats": {
        "queue_length": 6,
        "checkouts_count": 0,
        "checkout_lifetime": "120s",
        "rescue_interval": "2s"
    }
}
```

If all your messages had unique text, you should be able to checkout all message in AweQ (via the `Receive Message` page), and not the deleted message is no longer available.

For our case, the message "job-details-04" is no longer available.


## Personal Statement

Absolutely abysmal at *abstracting the logic around storage*...</br>

(Here is where one should expect a self-satisfied note about sorted-set making orphan-message rescue more efficient.)

For API design, basic SQS object commands were mapped to http endpoints.

Comparison with SQS is provided below, but the essential design goal is *at-least-once* delivery of messages for processing. The rate of message production and consumption, with the required durability of messages, determine the complexity and cost of AweQ.

Soundtrack for convoluted project review -- [The Decemberists <em>Everything Is Awful</em>](https://www.youtube.com/watch?v=3p8P0W7CUFo).


## Review Tasks

### Design a module that represents AweQ.

### Setup a test app to demonstrate how AweQ works.

### Setup a developer tool to explore the state of AweQ.

### Write documentation for potential API endpoints.

### Discuss scaling AweQ to meet high-volume requests.

- IO
- CPU
- Storage
- Expense
- Durability

### Bonus points for Node.js, and ES6/ES7.


## awe-queue vs AWS SQS

[Self-explain differences in features...]


## Considerable Alternatives

[Could one do this using RDMS? <em>Bien sûr!</em>]
