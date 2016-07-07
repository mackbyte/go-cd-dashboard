var gocdClient = require('../../src/services/gocdClient'),
    should = require('chai').should(),
    sinon = require('sinon');

describe('Pipelines Service', function() {
    describe("Get Pipelines", function() {
        afterEach(function() {
            delete require.cache[require.resolve('../../src/services/pipelinesService')]
        });

        it("should default to empty object", function() {
            sinon.stub(gocdClient, 'getAllPipelines').yields({});
            var pipelinesService = require('../../src/services/pipelinesService');

            var pipelines = pipelinesService.getPipelines();
            should.exist(pipelines);
            pipelines.should.deep.equal({});

            gocdClient.getAllPipelines.restore();
        });

        it("should get list of pipelines for single group with status and build number", function() {
            sinon.stub(gocdClient, 'getAllPipelines').yields({"Application": ["Build", "Test"]});
            sinon.stub(gocdClient, 'getPipelineStatus').yields({"status": "Passed", "build-number": 1});
            var pipelinesService = require('../../src/services/pipelinesService');

            pipelinesService.update();
            var pipelines = pipelinesService.getPipelines();
            should.exist(pipelines);
            pipelines.should.deep.equal({
                "Application": {
                    "Build": {
                        "status": "Passed",
                        "build-number": 1
                    },
                    "Test": {
                        "status": "Passed",
                        "build-number": 1
                    }
                }
            });

            gocdClient.getAllPipelines.restore();
            gocdClient.getPipelineStatus.restore();
        });

        it("should get list of all pipelines for multiple groups with status", function() {
            sinon.stub(gocdClient, 'getAllPipelines').yields({"Application1": ["Build"], "Application2": ["Publish", "Deploy"]});
            sinon.stub(gocdClient, 'getPipelineStatus').yields({"status": "Passed", "build-number": 1});
            var pipelinesService = require('../../src/services/pipelinesService');

            pipelinesService.update();
            var pipelines = pipelinesService.getPipelines();
            should.exist(pipelines);
            pipelines.should.deep.equal({
                "Application1": {
                    "Build": {
                        "status": "Passed",
                        "build-number": 1
                    }
                },
                "Application2": {
                    "Publish": {
                        "status": "Passed",
                        "build-number": 1
                    },
                    "Deploy": {
                        "status": "Passed",
                        "build-number": 1
                    }
                }
            });

            gocdClient.getAllPipelines.restore();
            gocdClient.getPipelineStatus.restore();
        })
    });
});