node-redis-pubsub-emitter
=========================

This a simple wrapper for pubsub via redis.

```javascript
var redisPubSub = require('redis-pubsub-emitter');

// The factory method takes the same parameters as redis.createClient()
var redisPubSubClient = redisPubSub.createClient(6379, 'localhost');

// Both on() and once() support *-wildcards, therefore the actual topic
// is always passed through
function handleNews(payload, topic) {
  console.log('News on channel %s: %s', topic, payload);
};
redisPubSubClient.on('news.uk.*', handleNews);

// removeListener() will also remove the subscription from redis if
// no other handler is attached
redisPubSubClient.removeListener('news.uk.*', handleNews);

// Publish send a message to redis. This will also call all event
// listeners that are attached to that topic
redisPubSubClient.publish('news.uk.politics', 'message');

// Emit will ONLY emit to local event listeners, no redis message
// will be send
redisPubSubClient.emit('news.uk.*', 'fake news', 'news.uk.fake');

```

Behaves pretty much like events.EventEmitter with the difference
that ````emit()``` calls the internal event handlers without publishing
to a topic whilst ```publish()``` is the function that actually sends
a message to redis.

All the usual functions from EventEmitter work like you'd expect,
e.g. ```on()```, ```once()```, ```setMaxListeners()```, ```removeListener()``` and
```removeAllListeners()```. See http://nodejs.org/api/events.html

Wildcards ```*``` are allowed for ```on()``` and ```once()``` are allowd as
described in http://redis.io/topics/pubsub

Listeners will receive two parameters, a payload as javascript
object and the actual channel name (useful in case wildcards have
been used).

Multiple subscriptions to the same topic will not create multiple
subscriptions with redis, it's therefore safe to subscribe to the
same topic(-pattern) more than once. If all listeners are removed
from one topic the subscription will be removed from redis.
