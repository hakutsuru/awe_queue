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


## Personal Statement

Absolutely abysmal at *abstracting the logic around storage*...</br>

(Here is where one should expect a self-satisfied note about sorted-set making orphan-message rescue more efficient.)

For API design, basic SQS object commands were mapped to http endpoints.

Comparison with SQS is provided below, but the essential design goal is *at-least-once* delivery of messages for processing. The rate of message production and consumption, with the required durability of messages, determine the complexity and cost of AweQ.

Soundtrack for convoluted project review -- [The Decemberists <em>Everything Is Awful</em>](https://www.youtube.com/watch?v=3p8P0W7CUFo).


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

[Describe using developer site views to demostrate that queue meets requirements.]

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
