/**
 * A simple factory for RedisPubSub that has a createClient()
 * function that behaves like the one in node-redis. See
 * https://github.com/mranney/node_redis
 *
 * All the parameters will be passed through:
 * E.g. redisPubSub.createClient(port, host, options)
 *
 * Please note that two redis clients will be created since they
 * are needed for redis pub/sub to work.
 *
 * "ready" will be emitted as soon as both connections are
 * established.
 */

var redis = require('redis');
var RedisPubSub = require('./lib/RedisPubSub.js');
module.exports = {
    createClient: function(port, host, options) {
        var redisEmitter = redis.createClient(port, host, options);
        var redisReceiver = redis.createClient(port, host, options);
        var redisPubSub = new RedisPubSub(redisEmitter, redisReceiver);

        var readyCounter = 0;
        function onReady() {
            readyCounter++;
            if (readyCounter == 2) {
                redisPubSub.emit('ready');
            }
        }
        var endCounter = 0;
        function onEnd() {
            endCounter++;
            if (endCounter == 2) {
                redisPubSub.emit('end');
            }
        }
        redisEmitter.on('ready', onReady);
        redisReceiver.on('ready', onReady);
        redisEmitter.on('end', onEnd);
        redisReceiver.on('end', onEnd);

        return redisPubSub;
    }
}
