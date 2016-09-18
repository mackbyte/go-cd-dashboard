var gocdClient = require('../../src/services/gocdClient'),
    should = require('chai').should(),
    sinon = require('sinon');
    promiseMock = require('../utils/PromiseMock'),
    require('sinon-stub-promise')(sinon);

describe('Pipelines Service', function() {
    describe("Get Pipelines", function() {
        var pipelineStatusStub,
            allPipelinesStub,
            promiseStub;

        beforeEach(function() {
            pipelineStatusStub = sinon.stub(gocdClient, 'getPipelineStatus');
            allPipelinesStub = sinon.stub(gocdClient, 'getAllPipelines');
            promiseStub = sinon.stub(Promise, 'all', promiseMock.all);
        });

        afterEach(function() {
            gocdClient.getAllPipelines.restore();
            gocdClient.getPipelineStatus.restore();
            Promise.all.restore();
            delete require.cache[require.resolve('../../src/services/pipelinesService')]
        });

        it("should default to empty object", function() {
            allPipelinesStub.returnsPromise().resolves({});
            var pipelinesService = require('../../src/services/pipelinesService');

            var pipelines = pipelinesService.getPipelines();
            should.exist(pipelines);
            pipelines.should.deep.equal({});
        });

        it("should get list of pipelines for single group with status and build number", function() {
            allPipelinesStub.returnsPromise().resolves({"Application": ["Build", "Test"]});
            pipelineStatusStub
                .withArgs("Build")
                .returnsPromise().resolves({"name": "Build", "status": "Passed", "build-number": 1, "upstream": [{type: "git", name: "git.com:some-project.git"}]});

            pipelineStatusStub
                .withArgs("Test")
                .returnsPromise().resolves({"name": "Test", "status": "Passed", "build-number": 1, "upstream": [{type: "pipeline", name: "Build"}]});
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
            allPipelinesStub.returnsPromise().resolves({
                "Application1": ["Build"],
                "Application2": ["Publish", "Deploy"]
            });
            pipelineStatusStub
                .withArgs("Build")
                .returnsPromise().resolves({"name": "Build", "status": "Passed", "build-number": 1, "upstream": [{type: "git", name: "git.com:some-project.git"}]});

            pipelineStatusStub
                .withArgs("Publish")
                .returnsPromise().resolves({"name": "Publish", "status": "Passed", "build-number": 1, "upstream": [{type: "git", name: "git.com:some-project.git"}]});

            pipelineStatusStub
                .withArgs("Deploy")
                .returnsPromise().resolves({"name": "Deploy", "status": "Passed", "build-number": 1, "upstream": [{type: "pipeline", name: "Publish"}]});

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

        it("should return pipelines in order of breadth first search with git as source node", function() {
            allPipelinesStub
                .returnsPromise().resolves({"Application": ["Build", "Publish", "Deploy"]});

            pipelineStatusStub
                .withArgs("Build")
                .returnsPromise().resolves({"name": "Build", "status": "Passed", "build-number": 1, "upstream": [{type: "git", name: "git.com:some-project.git"}]});

            pipelineStatusStub
                .withArgs("Publish")
                .returnsPromise().resolves({"name": "Publish", "status": "Passed", "build-number": 1, "upstream": [{type: "pipeline", name: "Build"}]});

            pipelineStatusStub
                .withArgs("Deploy")
                .returnsPromise().resolves({"name": "Deploy", "status": "Passed", "build-number": 1, "upstream": [{type: "pipeline", name: "Publish"}]});

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

        it("should not include git nodes", function() {
            allPipelinesStub
                .returnsPromise().resolves({"Application": ["Build"]});

            pipelineStatusStub
                .withArgs("Build")
                .returnsPromise().resolves({"name": "Build", "status": "Passed", "build-number": 1, "upstream": [{type: "git", name: "git.com:some-project.git"}]});

            var pipelinesService = require('../../src/services/pipelinesService');

            var pipelines = pipelinesService.getPipelines();
            should.exist(pipelines);
            pipelines.should.deep.equal({
                "Application": {
                    "Build": {
                        "status": "Passed",
                        "build-number": 1,
                        "order": 0
                    }
                }
            });
        });

        it("should return pipelines that have multiple git nodes for groups which are not connected", function() {
            allPipelinesStub
                .returnsPromise().resolves({"NFT-Suite": ["Hour", "Overnight", "Weekend"]});

            pipelineStatusStub
                .withArgs("Hour")
                .returnsPromise().resolves({"name": "Hour", "status": "Passed", "build-number": 1, "upstream": [{type: "git", name: "git.com:some-project.git"}]});

            pipelineStatusStub
                .withArgs("Overnight")
                .returnsPromise().resolves({"name": "Overnight", "status": "Passed", "build-number": 1, "upstream": [{type: "git", name: "git.com:some-project.git"}]});

            pipelineStatusStub
                .withArgs("Weekend")
                .returnsPromise().resolves({"name": "Weekend", "status": "Passed", "build-number": 1, "upstream": [{type: "git", name: "git.com:some-project.git"}]});

            var pipelinesService = require('../../src/services/pipelinesService');

            var pipelines = pipelinesService.getPipelines();
            should.exist(pipelines);
            pipelines.should.deep.equal({
                "NFT-Suite": {
                    "Hour": {
                        "status": "Passed",
                        "build-number": 1,
                        "order": 0
                    },
                    "Overnight": {
                        "status": "Passed",
                        "build-number": 1,
                        "order": 0
                    },
                    "Weekend": {
                        "status": "Passed",
                        "build-number": 1,
                        "order": 0
                    }
                }
            });
        });

        it("should remove links to build when another link is available to produce correct order", function() {
            allPipelinesStub
                .returnsPromise().resolves({"Application": ["Build", "Publish", "Deploy"]});

            pipelineStatusStub
                .withArgs("Build")
                .returnsPromise().resolves({"name": "Build", "status": "Passed", "build-number": 1, "upstream": [{type: "git", name: "git.com:some-project.git"}]});

            pipelineStatusStub
                .withArgs("Publish")
                .returnsPromise().resolves({"name": "Publish", "status": "Passed", "build-number": 1, "upstream": [{type: "pipeline", name: "Build"}]});

            pipelineStatusStub
                .withArgs("Deploy")
                .returnsPromise().resolves({"name": "Deploy", "status": "Passed", "build-number": 1, "upstream": [{type: "pipeline", name: "Build"}, {type: "pipeline", name: "Publish"}]});

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

        it("should wait until all pipeline status requests have completed before updating the graph", function() {
            allPipelinesStub
                .returnsPromise().resolves({"Application": ["Build", "Publish", "Deploy"]});

            pipelineStatusStub
                .withArgs("Build")
                .returnsPromise().resolves({"name": "Build", "status": "Passed", "build-number": 1, "upstream": [{type: "git", name: "git.com:some-project.git"}]});

            pipelineStatusStub
                .withArgs("Publish")
                .returnsPromise().resolves({"name": "Publish", "status": "Passed", "build-number": 1, "upstream": [{type: "pipeline", name: "Build"}]});

            var deployStub = pipelineStatusStub
                .withArgs("Deploy")
                .returnsPromise();

            var pipelinesService = require('../../src/services/pipelinesService');
            var pipelines = pipelinesService.getPipelines();
            pipelines.should.deep.equal({});

            deployStub.resolves({"name": "Deploy", "status": "Passed", "build-number": 1, "upstream": [{type: "pipeline", name: "Build"}, {type: "pipeline", name: "Publish"}]});

            pipelines = pipelinesService.getPipelines();
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

        // it("should return separate pipeline for each different git repo", function() {
        //     allPipelinesStub
        //         .returnsPromise().resolves({"Libraries": ["Common", "Common-Deploy", "Common-Test", "Common-Test-Deploy"]});
        //
        //     pipelineStatusStub
        //         .withArgs("Common")
        //         .returnsPromise().resolves({"name": "Common", "status": "Passed", "build-number": 1, "upstream": [{type: "git", name: "git.com:some-project.git"}]});
        //
        //     pipelineStatusStub
        //         .withArgs("Common-Deploy")
        //         .returnsPromise().resolves({"name": "Common-Deploy", "status": "Passed", "build-number": 1, "upstream": [{type: "pipeline", name: "Common"}]});
        //
        //     pipelineStatusStub
        //         .withArgs("Common-Test")
        //         .returnsPromise().resolves({"name": "Common-Test", "status": "Passed", "build-number": 1, "upstream": [{type: "git", name: "git.com:some-other-project.git"}]});
        //
        //     pipelineStatusStub
        //         .withArgs("Common-Test-Deploy")
        //         .returnsPromise().resolves({"name": "Common-Test-Deploy", "status": "Passed", "build-number": 1, "upstream": [{type: "pipeline", name: "Common-Test"}]});
        //
        //     var pipelinesService = require('../../src/services/pipelinesService');
        //
        //     var pipelines = pipelinesService.getPipelines();
        //     should.exist(pipelines);
        //     pipelines.should.deep.equal({
        //         "Libraries": {
        //             "Common": {
        //                 "status": "Passed",
        //                 "build-number": 1,
        //                 "order": 0
        //             },
        //             "Common-Test": {
        //                 "status": "Passed",
        //                 "build-number": 1,
        //                 "order": 1
        //             }
        //         }
        //     });
        // });
    });
});