var assert = require('chai').assert;
var sinon = require('sinon');
var RedisPubSub = require('../lib/RedisPubSub.js');
var EventEmitter = require('events').EventEmitter;

describe('RedisPubSub', function(){

    var redisEmitter = null;
    var redisReceiver = null;
    var redisPubSub = null;

    beforeEach(function() {
        redisEmitter = new EventEmitter();
        redisEmitter.publish = sinon.spy();

        redisReceiver = new EventEmitter();
        redisReceiver.psubscribe = sinon.spy();
        redisReceiver.punsubscribe = sinon.spy();

        redisPubSub = new RedisPubSub(redisEmitter, redisReceiver);
    });

    it('publishs an event when publish is called', function() {
        redisPubSub.publish('test.topic', {foo: 'bar'});
        assert.equal(redisEmitter.publish.lastCall.args[0], 'test.topic');
        assert.deepEqual(redisEmitter.publish.lastCall.args[1], '{"foo":"bar"}');
    });

    it('subscribes to topics on the first call of on', function() {
        redisPubSub.on('test.topic.1.*', function() {});
        redisPubSub.on('test.topic.2.*', function() {});
        assert.equal(redisReceiver.psubscribe.firstCall.args[0], 'test.topic.1.*');
        assert.equal(redisReceiver.psubscribe.secondCall.args[0], 'test.topic.2.*');
    });

    it('subscribes to topics only once', function() {
        redisPubSub.on('test.topic.1.*', function() {});
        redisPubSub.on('test.topic.1.*', function() {});
        assert.equal(redisReceiver.psubscribe.callCount, 1);
    });

    it('does not unsubscribe if theres still a listener', function() {
        redisPubSub.on('test.topic.1.*', function() {});
        redisPubSub.on('test.topic.1.*', function() {});
        redisPubSub.removeListener('test.topic.1.*', function() {});
        assert.equal(redisReceiver.punsubscribe.callCount, 0);
    });

    it('does unsubscribe if theres no listener left', function() {
        var listener = function() {};
        redisPubSub.on('test.topic.1.*', listener);
        redisPubSub.removeListener('test.topic.1.*', listener);
        assert.equal(redisReceiver.punsubscribe.firstCall.args[0], 'test.topic.1.*');
    });

    it('does unsubscribe if all listeners get removed', function() {
        redisPubSub.on('test.topic.1.*', function() {});
        redisPubSub.on('test.topic.1.*', function() {});
        redisPubSub.removeAllListeners('test.topic.1.*');
        assert.equal(redisReceiver.punsubscribe.firstCall.args[0], 'test.topic.1.*');
        assert.equal(redisReceiver.punsubscribe.callCount, 1);
    });

    it('does receive data', function(done) {
        redisPubSub.on('test.topic.1.*', function(data, channel) {
            assert.deepEqual(data, {foo: 'bar'});
            assert.equal(channel, 'test.topic.1.test');
            done();
        });
        redisReceiver.emit('pmessage', 'test.topic.1.*', 'test.topic.1.test', '{"foo":"bar"}');
    });

    it('does work with once', function() {
        redisPubSub.once('test.topic.1.*', function() {});
        assert.equal(redisReceiver.punsubscribe.callCount, 0);
        redisReceiver.emit('pmessage', 'test.topic.1.*', 'test.topic.1.test', '{}');
        assert.equal(redisReceiver.punsubscribe.callCount, 1);
    });

    it('passes errors through', function(done) {
        redisPubSub.on('error', function(msg) {
            assert.deepEqual(msg, 'test');
            done();
        });
        redisReceiver.emit('error', 'test');
    });

});