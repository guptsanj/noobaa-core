// make jshint ignore mocha globals
/* global describe, it, before, after, beforeEach, afterEach */
'use strict';

var _ = require('lodash');
var Q = require('q');
var assert = require('assert');
var coretest = require('./coretest');
var Agent = require('../agent/agent');
var size_utils = require('../util/size_utils');

describe('agent', function() {

    var client = coretest.client();
    var SYS = 'test-agent-system';

    before(function(done) {
        Q.fcall(function() {
            return client.system.create_system({
                name: SYS
            });
        }).then(function() {
            // authenticate now with the new system
            return client.create_auth({
                system: SYS
            });
        }).then(function() {
            return client.tier.create_tier({
                name: 'edge',
                kind: 'edge',
            });
        }).then(function() {
            return coretest.init_test_nodes(10, SYS, 'edge', size_utils.GIGABYTE);
        }).nodeify(done);
    });

    after(function(done) {
        Q.fcall(function() {
            return coretest.clear_test_nodes();
        }).nodeify(done);
    });

    it('should run agents', function(done) {
        // TODO
        done();
    });

});
