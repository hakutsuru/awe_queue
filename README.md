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

This is the requirement that consumers checkout "messages which are not being processed". But this is only true when all consumers are able to acknowledge their messages in the time allowed (e.g. before a message checkout lifetime expires).

**Batches are disjointed when no consumed messages have been restored to AweQ after timeout. Thus, simple testing should be done when no messages are checked out, and consume messages within the `checkoutLifetime` (of 120s).**

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

AweQ Status (from `Queue Status` page)...
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

*Details which may only be interesting to someone who falls upon the thorns of queueing theory... Messages are restored in order, to the end of AweQ, as though new messages, but with an updated `retry_count` to track issues. Due to ambiguity in queue specification, this was chosen as **simpler**.*

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

(If you just stumbled upon this, welcome to the hellish joys of being challenged. Speak *friend* and enter. I have too much experience doing stuff like this, but I am a generalist, so if anything done here offends you — bless your heart. On the other hand, if trying to understand this frustrates, reach out and I will try to get you through this mess, and back on your journey.)

Self-actualizing requires knowing you are abysmal at *abstracting the logic around storage*...

After working with stores for a long time, this was the most interesting aspect of AweQ. Building a toy using JavaScript objects seems madcap, and this is where I am naive, because there are good reasons AweQ may be a poor design compared with SQS.

Yet I have been running a Redis FIFO queue in production for months, handling hundreds of thousands of events-per-day, with payloads potentially larger than 250KB.

There are three primary challenges for AweQ:

- Consuming messages from the queue<br />
- Managing lifecycle of consumed messages<br />
- Restoring messages which are deemed orphaned<br />

And one existential challenge, *durability*. Minimizing lost messages in various scenarios requires trade-offs which limit performance, and dramatically increase cost and complexity.

Considering the primary challenges, Redis data types are efficient solutions. Lists provide efficient FIFO queue capability. Sorted sets easily identify potential orphaned messages. Hashes store messages awaiting acknowledgment.

The Redis data structures are general, but the primary operations of AweQ fit these structures so well it seems impossible to find better options. Yet, it is durability which could make Redis data structure advantages immaterial.

For API design, basic SQS object commands were mapped to http endpoints. Here is where my lack of acculturation and focus on pragmatic solutions can lead to unusual choices. I was not sure what is desirable about a *module*, or what this would mean.

I have studied restful design (and implemented such), but as AweQ operations were simple, remote procedure calls seem the ideal approach.

UUID are arguably over-engineering, but keys which are ostensibly difficult to guess means AweQ need not track *which client* consumed the message. Security can be a queer obsession, but an integer key would allow clients to easily delete each other's messages — which could lead to lost messages under byzantine circumstances.

Comparison with SQS is provided below, but the essential design goal is *at-least-once* delivery of messages for processing. The rate of message production and consumption, with the required durability of messages, would determine the complexity and cost of AweQ.

AweQ needs monitoring to detect messages consumers are unable/unwilling to process.

Soundtrack for convoluted project review -- [The Decemberists <em>Everything Is Awful</em>](https://www.youtube.com/watch?v=3p8P0W7CUFo).


## Review Tasks

### Design a module that represents AweQ.

Sorry, given specifications for a queue, anything *representing a queue* is confusing, assuming this means the desired prototype is not an *actual queue*.

In our culture of ever-expanding self-consciousness failures and *creeping scopes*, I should concede an understanding that one should focus on project requirements and avoid being distracted by *doing cool stuff*.

(And AweQ is far from fully-considered and stress-tested, so not as *cool as it could be*.)

### Setup a test app to demonstrate how AweQ works.

Test app and developer tool are one in sameness...

### Setup a developer tool to explore the state of AweQ.

すみません for not groking how one would segregate test app and developer tool.

### Write documentation for potential API endpoints.

#### send-message
```
vagrant@aweq-dev:~$ curl -i -X POST -d '{"message": "job-details-88"}' -H "Content-Type: application/json" http://localhost:3000/send-message
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept
Access-Control-Allow-Methods: POST, GET, OPTIONS, HEAD, DELETE
Content-Type: application/json; charset=utf-8
Content-Length: 62
ETag: W/"3e-2kU+fmtd29KuRt8MhWXpQCNusyU"
Date: Tue, 10 Apr 2018 04:25:13 GMT
Connection: keep-alive

{"status":"okay","key":"29bac180-3c77-11e8-8aba-b76f21b15267"}

vagrant@aweq-dev:~$ curl -i -X POST -d '{"message": ""}' -H "Content-Type: application/json" http://localhost:3000/send-message
HTTP/1.1 400 Bad Request
X-Powered-By: Express
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept
Access-Control-Allow-Methods: POST, GET, OPTIONS, HEAD, DELETE
Content-Type: text/html; charset=utf-8
Content-Length: 25
ETag: W/"19-oXL9Vsd5weSTgaOAgD9hyjpT544"
Date: Tue, 10 Apr 2018 04:27:19 GMT
Connection: keep-alive

Message content required.
```

#### receive-message
```
vagrant@aweq-dev:~$ curl -i -X GET http://localhost:3000/receive-message?count=2
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept
Access-Control-Allow-Methods: POST, GET, OPTIONS, HEAD, DELETE
Content-Type: application/json; charset=utf-8
Content-Length: 306
ETag: W/"132-/NrR4iL6X5kHpego8j+7fULfz/g"
Date: Tue, 10 Apr 2018 04:28:24 GMT
Connection: keep-alive

{"status":"okay","message":"Requested batch-size available.","messages":[{"key":"b1b517b0-3b83-11e8-8aba-b76f21b15267","timestamp":1523229744299,"retry_count":1,"message":"job-details-06"},{"key":"b2ac48f0-3b83-11e8-8aba-b76f21b15267","timestamp":1523229745919,"retry_count":1,"message":"job-details-07"}]}

vagrant@aweq-dev:~$ curl -i -X GET http://localhost:3000/receive-message
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept
Access-Control-Allow-Methods: POST, GET, OPTIONS, HEAD, DELETE
Content-Type: application/json; charset=utf-8
Content-Length: 190
ETag: W/"be-NQbR8mMENBIHE18C2BLw6U2TvZo"
Date: Tue, 10 Apr 2018 04:28:45 GMT
Connection: keep-alive

{"status":"okay","message":"Requested batch-size available.","messages":[{"key":"ab3e6df0-3b83-11e8-8aba-b76f21b15267","timestamp":1523229733455,"retry_count":2,"message":"job-details-01"}]}
```

#### delete-message
```
vagrant@aweq-dev:~$ curl -i -X DELETE http://localhost:3000/delete-message/ab3e6df0-3b83-11e8-8aba-b76f21b15267
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept
Access-Control-Allow-Methods: POST, GET, OPTIONS, HEAD, DELETE
Content-Type: application/json; charset=utf-8
Content-Length: 17
ETag: W/"11-MawlXlG548aTOrp+gzBB3p2l60M"
Date: Tue, 10 Apr 2018 04:29:43 GMT
Connection: keep-alive

{"status":"okay"}
```

#### get-stats
```
vagrant@aweq-dev:~$ curl -i -X GET http://localhost:3000/get-stats
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept
Access-Control-Allow-Methods: POST, GET, OPTIONS, HEAD, DELETE
Content-Type: application/json; charset=utf-8
Content-Length: 114
ETag: W/"72-9Y3w7jODY9kVo0II8d5BDkqgXK8"
Date: Tue, 10 Apr 2018 04:30:22 GMT
Connection: keep-alive

{"status":"okay","stats":{"queue_length":4,"checkouts_count":2,"checkout_lifetime":"120s","rescue_interval":"2s"}}
```

### Discuss scaling AweQ to meet high-volume requests.

Welcome to the valley of hand-waving and profound mathematics... The ambition is guidance on what should be scrawled on napkins during lunch, and things which should be considered in depth.

In practice, we estimate critical operational and performance limits, and *over-provision*. Rarely do we have enough information to properly predict required capacity, and must rely on good system metrics to discover unanticipated resource contention (like *CPU steal*).

Capacity planning for *high-volume* AweQ operation must include these factors:

- IO<br />
- CPU<br />
- Storage<br />
- Durability<br />
- Expense<br />

Some concerns should be self-evident... Constrained bandwidth and CPU will be rapidly evident. What could be a surprise is networking expense, so estimating required bandwidth and its cost is advised — e.g. actualize these calculations with estimate average values...
```
bandwidth = request-payload x request-count
cost/day = request-payload x request-count-day x cost-per-volume
```

(Cloud networking is out-of-scope, but networking costs can be shocking in this context. Yet there are often network engineering optimizations possible, like routing traffic within the cloud network, instead of through internet gateways.)

For capacity, one must consider *peak* and average operation, because if the system cannot handle peak requirements, this could lead to performance degredation or failure.

Storage should never be an issue, because queues are for *consumption*. On average, consume capacity should exceed message volume, to avoid an ever-growing queue. If consumers are stalled, or message volume is excessive, the queue will grow, and eventually, storage will be exhausted.

So storage must naturally be chosen to be many times the *peak queue storage required during an average day*. Storage exhaustion is akin to a plane crash, so capacity should be chosen to achieve similar likelihood... How many days must AweQ be able to operate without failure while consumers remain offline? Redis is an in-memory store, so storage here would be RAM (and additional SSD capacity to handle persistence).

**But the real challenge is durability — how do we minimize message loss?**

Redis is an in-memory store. Obviously, standard operation would be *useless*, unless rare message loss had minimal operational or economic impact. Since AweQ relies on only a few keys, memory pressure leading to key eviction would be akin to process or system failure, aka *total loss*.

[Redis Persistence](https://redis.io/topics/persistence) would need to be tested. Writing snapshots should speed up recovery, but would need to be carefully scheduled. *AOF persistence logs* would be required to preserve messages (fsync at every query). Maintaining a message log will affect performance.

System recovery would lead to disappointing system *liveness*, and an alternative would be [Redis Replication](https://redis.io/topics/replication). But replication should be considered a secondary backup (if highly sensitive to even rare message loss), since any replication lag would mean the most recent message activity is more likely to be in persistence logs than replicated.

If AweQ server were to fail, recovery would include these approaches in priority order...

- Attempt restarting AweQ server<br />
- Use persisted snapshot and logs with another AweQ server<br />
- Promote Redis replica to be AweQ server<br />

Every recovery task would **need to be tested, documented and potentially scripted** to ensure success. Everyone know this, sounding glib. Yet I spent weeks documenting Consul recovery after a respected colleague rebooted cluster servers in a fit of frustration. When a service is down, comprehending unfamiliar, crucial recovery instructions can be daunting.

**Scale can lead to exotic places.** An alternative would be to separate concerns, and put message activity on Kafka. AweQ could operate faster, and Kafka is fast and durable (and it should be, with such high operational cost). Every AweQ call would entail writing messages to Kafka, but this may be comparable to persistance overhead.

The magic would be recovery. On AweQ failure, the queue would be unavailable, but since the Kafka basket has all our golden eggs, recovery could be a rapid process of [event sourcing](https://martinfowler.com/eaaDev/EventSourcing.html) to recover the queue (this would require adding a restore-message endpoint, *and testing*).

### Bonus points for Node.js, and ES6/ES7.

Being focused on solving problems, I lack experience with some newer syntax. But I am eager to read Zakas [Understanding ECMAScript 6](https://github.com/nzakas/understandinges6).


## AweQ vs SQS

AweQ is strictly FIFO, whereas this is an option for SQS.

AweQ allows greater operations-per-second (FIFO) and payload size.

SQS uses replicated, distributed storage for durability... When previously evaluating SQS, payload limitations lead me to use a simpler alternative, but from that research, I recall consumer polling to be pleasantly configurable and stochastic.


## Considerable Alternatives

Could one do this using RDMS? <em>Bien sûr!</em>

Yet this is where woe comes to roost. Considering apples and oranges, *amazing* RDMS performance is  ~10,000 transactions-per-second (tps), whereas I have run billions of queries against wimpy ElastiCache instances day after day.

In 2014, I was getting 930 tps from `pgbench` on a `m3.medium` instance.

Performance is only part of the story. Queue processing via relational models means modeling a state machine via field values and their transitions. Simple enough, until you involve SQL.

For small scale (few thousand messages per day), implementing AweQ in SQL would be fine. But at larger scale, queries depending on indexed time fields will be inefficient, as table statistics get skewed. Non-standard indexing will likely be required for critical fields.

Removing processed queue rows is periodically required to avoid table bloat. Updating statistics, and compacting/vacuuming tables will lead to inconsistent performance, like garbage collection.

I have been musing about a hot-or-not demo using SQLite, so I will soon be eating this boot — and grumbling how much it would taste like agedashi tofu if done with AweQ.
