var gocdClient = require('../../src/services/gocdClient'),
    should = require('chai').should(),
    sinon = require('sinon');

describe('Pipelines Service', function() {
    describe("Get Pipelines", function() {
        var pipelineStatusStub,
            allPipelinesStub;

        beforeEach(function(){
            pipelineStatusStub = sinon.stub(gocdClient, 'getPipelineStatus');
            allPipelinesStub = sinon.stub(gocdClient, 'getAllPipelines');
        });

        afterEach(function() {
            gocdClient.getAllPipelines.restore();
            gocdClient.getPipelineStatus.restore();
            delete require.cache[require.resolve('../../src/services/pipelinesService')]
        });

        it("should default to empty object", function() {
            allPipelinesStub.yields({});
            var pipelinesService = require('../../src/services/pipelinesService');

            var pipelines = pipelinesService.getPipelines();
            should.exist(pipelines);
            pipelines.should.deep.equal({});
        });

        it("should get list of pipelines for single group with status and build number", function() {
            allPipelinesStub.yields({"Application": ["Build", "Test"]});
            pipelineStatusStub
                .withArgs("Build")
                .yields({"status": "Passed", "build-number": 1, "upstream": []});

            pipelineStatusStub
                .withArgs("Test")
                .yields({"status": "Passed", "build-number": 1, "upstream": ["Build"]});
            var pipelinesService = require('../../src/services/pipelinesService');

            var pipelines = pipelinesService.getPipelines();
            should.exist(pipelines);

            pipelines.should.have.property("Application");
            pipelines.Application.should.have.property("Build");
            pipelines.Application.Build.should.have.property("build-number", 1);
            pipelines.Application.Build.should.have.property("status", "Passed");

            pipelines.Application.should.have.property("Test");
            pipelines.Application.Test.should.have.property("build-number", 1);
            pipelines.Application.Test.should.have.property("status", "Passed");
        });

        it("should get list of all pipelines for multiple groups with status", function() {
            allPipelinesStub.yields({"Application1": ["Build"], "Application2": ["Publish", "Deploy"]});
            pipelineStatusStub
                .withArgs("Build")
                .yields({"status": "Passed", "build-number": 1, "upstream": []});

            pipelineStatusStub
                .withArgs("Publish")
                .yields({"status": "Passed", "build-number": 1, "upstream": []});

            pipelineStatusStub
                .withArgs("Deploy")
                .yields({"status": "Passed", "build-number": 1, "upstream": ["Publish"]});

            var pipelinesService = require('../../src/services/pipelinesService');

            var pipelines = pipelinesService.getPipelines();
            should.exist(pipelines);

            pipelines.should.have.property("Application1");
            pipelines.Application1.should.have.property("Build");
            pipelines.Application1.Build.should.have.property("build-number", 1);
            pipelines.Application1.Build.should.have.property("status", "Passed");

            pipelines.should.have.property("Application2");
            pipelines.Application2.should.have.property("Publish");
            pipelines.Application2.Publish.should.have.property("build-number", 1);
            pipelines.Application2.Publish.should.have.property("status", "Passed");

            pipelines.Application2.should.have.property("Deploy");
            pipelines.Application2.Deploy.should.have.property("build-number", 1);
            pipelines.Application2.Deploy.should.have.property("status", "Passed");
        });

        it("should return order of pipeline as the order specified in the group", function() {
            allPipelinesStub
                .yields({"Application": ["Build", "Publish", "Deploy"]});

            pipelineStatusStub
                .withArgs("Build")
                .yields({"status": "Passed", "build-number": 1, "upstream": []});

            pipelineStatusStub
                .withArgs("Publish")
                .yields({"status": "Passed", "build-number": 1, "upstream": ["Build"]});

            pipelineStatusStub
                .withArgs("Deploy")
                .yields({"status": "Passed", "build-number": 1, "upstream": ["Publish"]});

            var pipelinesService = require('../../src/services/pipelinesService');

            var pipelines = pipelinesService.getPipelines();
            should.exist(pipelines);
            pipelines.should.deep.equal({
                "Application": {
                    "Build": {
                        "status": "Passed",
                        "build-number": 1,
                        "order": 0
                    },
                    "Deploy": {
                        "status": "Passed",
                        "build-number": 1,
                        "order": 2
                    },
                    "Publish": {
                        "status": "Passed",
                        "build-number": 1,
                        "order": 1
                    }
                }
            });
        });
    });
});