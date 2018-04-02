awe_queue
====

## Orientation

Demonstrate implementation of queue based on [AWS Simple Queue Service (SQS)](https://aws.amazon.com/sqs/).

For API design, basic SQS object commands were mapped to http endpoints.

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

[Review project goals and describe open issues, and opportunities.]

## awe-queue vs AWS SQS

[Self-explain differences in features...]

## Considerable Alternatives

[Could one do this using RDMS? <em>Bien sûr!</em>]
