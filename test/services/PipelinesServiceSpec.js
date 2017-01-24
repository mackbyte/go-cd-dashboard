const gocdClient = require('../../src/services/GocdClient'),
    should = require('chai').should(),
    sinon = require('sinon'),
    promiseMock = require('../utils/PromiseMock');
    require('sinon-stub-promise')(sinon);

describe('Pipelines Service', function() {
    describe("Get Pipelines", function() {
        let pipelinesService,
            pipelineStatusStub,
            allPipelinesStub,
            promiseStub;

        beforeEach(function() {
            pipelinesService = require('../../src/services/PipelinesService')({on: function() {}});

            pipelineStatusStub = sinon.stub(gocdClient, 'getPipelineStatus');
            allPipelinesStub = sinon.stub(gocdClient, 'getAllPipelines');
            promiseStub = sinon.stub(Promise, 'all', promiseMock.all);
        });

        afterEach(function() {
            gocdClient.getAllPipelines.restore();
            gocdClient.getPipelineStatus.restore();
            Promise.all.restore();
        });

        it("should default to empty object", function() {
            allPipelinesStub.returnsPromise().resolves({});
            pipelinesService.update();

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

            pipelinesService.update();
            var pipelines = pipelinesService.getPipelines();
            should.exist(pipelines);

            pipelines.should.deep.equal({
                "Application": {
                    "git.com:some-project.git": {
                        "nodes": {
                            "Build": {
                                "data": {
                                    "build-number": 1,
                                    "name": "Build",
                                    "status": "Passed",
                                },
                                "links": [
                                    "Test"
                                ]
                            },
                            "GIT": {
                                "data": {
                                    "url": "git.com:some-project.git"
                                },
                                "links": [
                                    "Build"
                                ]
                            },
                            "Test": {
                                "data": {
                                    "build-number": 1,
                                    "name": "Test",
                                    "status": "Passed"
                                },
                                "links": []
                            }
                        },
                        "source": "GIT"
                    }
                }
            });
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

            pipelinesService.update();
            var pipelines = pipelinesService.getPipelines();
            should.exist(pipelines);

            pipelines.should.deep.equal({
                "Application1": {
                    "git.com:some-project.git": {
                        "nodes": {
                            "Build": {
                                "data": {
                                    "build-number": 1,
                                    "name": "Build",
                                    "status": "Passed"
                                },
                                "links": []
                            },
                            "GIT": {
                                "data": {
                                    "url": "git.com:some-project.git"
                                },
                                "links": [
                                    "Build"
                                ]
                            }
                        },
                        "source": "GIT"
                    }
                },
                "Application2": {
                    "git.com:some-project.git": {
                        "nodes": {
                            "Deploy": {
                                "data": {
                                    "build-number": 1,
                                    "name": "Deploy",
                                    "status": "Passed"
                                },
                                "links": []
                            },
                            "GIT": {
                                "data": {
                                    "url": "git.com:some-project.git"
                                },
                                "links": [
                                    "Publish"
                                ]
                            },
                            "Publish": {
                                "data": {
                                    "build-number": 1,
                                    "name": "Publish",
                                    "status": "Passed"
                                },
                                "links": [
                                    "Deploy"
                                ]
                            }
                        },
                        "source": "GIT"
                    }
                }
            });
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

            pipelinesService.update();
            var pipelines = pipelinesService.getPipelines();
            should.exist(pipelines);
            pipelines.should.deep.equal({
                "Application": {
                    "git.com:some-project.git": {
                        "nodes": {
                            "Build": {
                                "data": {
                                    "build-number": 1,
                                    "name": "Build",
                                    "status": "Passed"
                                },
                                "links": [
                                    "Publish"
                                ]
                            },
                            "Deploy": {
                                "data": {
                                    "build-number": 1,
                                    "name": "Deploy",
                                    "status": "Passed"
                                },
                                "links": []
                            },
                            "GIT": {
                                "data": {
                                    "url": "git.com:some-project.git"
                                },
                                "links": [
                                    "Build"
                                ]
                            },
                            "Publish": {
                                "data": {
                                    "build-number": 1,
                                    "name": "Publish",
                                    "status": "Passed"
                                },
                                "links": [
                                    "Deploy"
                                ]
                            }
                        },
                        "source": "GIT"
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

            pipelinesService.update();
            var pipelines = pipelinesService.getPipelines();
            should.exist(pipelines);
            pipelines.should.deep.equal({
                "Application": {
                    "git.com:some-project.git": {
                        "nodes": {
                            "Build": {
                                "data": {
                                    "build-number": 1,
                                    "name": "Build",
                                    "status": "Passed"
                                },
                                "links": []
                            },
                            "GIT": {
                                "data": {
                                    "url": "git.com:some-project.git"
                                },
                                "links": [
                                    "Build"
                                ]
                            }
                        },
                        "source": "GIT"
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

            pipelinesService.update();
            var pipelines = pipelinesService.getPipelines();
            should.exist(pipelines);
            pipelines.should.deep.equal({
                "NFT-Suite": {
                    "git.com:some-project.git": {
                        "nodes": {
                            "GIT": {
                                "data": {
                                    "url": "git.com:some-project.git"
                                },
                                "links": [
                                    "Hour",
                                    "Overnight",
                                    "Weekend"
                                ]
                            },
                            "Hour": {
                                "data": {
                                    "build-number": 1,
                                    "name": "Hour",
                                    "status": "Passed"
                                },
                                "links": []
                            },
                            "Overnight": {
                                "data": {
                                    "build-number": 1,
                                    "name": "Overnight",
                                    "status": "Passed"
                                },
                                "links": []
                            },
                            "Weekend": {
                                "data": {
                                    "build-number": 1,
                                    "name": "Weekend",
                                    "status": "Passed"
                                },
                                "links": []
                            }
                        },
                        "source": "GIT"
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

            pipelinesService.update();
            var pipelines = pipelinesService.getPipelines();
            should.exist(pipelines);
            pipelines.should.deep.equal({
                "Application": {
                    "git.com:some-project.git": {
                        "nodes": {
                            "Build": {
                                "data": {
                                    "build-number": 1,
                                    "name": "Build",
                                    "status": "Passed"
                                },
                                "links": [
                                    "Publish"
                                ]
                            },
                            "Deploy": {
                                "data": {
                                    "build-number": 1,
                                    "name": "Deploy",
                                    "status": "Passed"
                                },
                                "links": []
                            },
                            "GIT": {
                                "data": {
                                    "url": "git.com:some-project.git"
                                },
                                "links": [
                                    "Build"
                                ]
                            },
                            "Publish": {
                                "data": {
                                    "build-number": 1,
                                    "name": "Publish",
                                    "status": "Passed"
                                },
                                "links": [
                                    "Deploy"
                                ]
                            }
                        },
                        "source": "GIT"
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

            pipelinesService.update();            var pipelines = pipelinesService.getPipelines();
            pipelines.should.deep.equal({});

            deployStub.resolves({"name": "Deploy", "status": "Passed", "build-number": 1, "upstream": [{type: "pipeline", name: "Build"}, {type: "pipeline", name: "Publish"}]});

            pipelines = pipelinesService.getPipelines();
            should.exist(pipelines);
            pipelines.should.deep.equal({
                "Application": {
                    "git.com:some-project.git": {
                        "nodes": {
                            "Build": {
                                "data": {
                                    "build-number": 1,
                                    "name": "Build",
                                    "status": "Passed"
                                },
                                "links": [
                                    "Publish"
                                ]
                            },
                            "Deploy": {
                                "data": {
                                    "build-number": 1,
                                    "name": "Deploy",
                                    "status": "Passed"
                                },
                                "links": []
                            },
                            "GIT": {
                                "data": {
                                    "url": "git.com:some-project.git"
                                },
                                "links": [
                                    "Build"
                                ]
                            },
                            "Publish": {
                                "data": {
                                    "build-number": 1,
                                    "name": "Publish",
                                    "status": "Passed"
                                },
                                "links": [
                                    "Deploy"
                                ]
                            }
                        },
                        "source": "GIT"
                    }
                }
            });
        });

        it("should return separate pipeline for each different git repo", function() {
            allPipelinesStub
                .returnsPromise().resolves({"Libraries": ["Common", "Common-Deploy", "Common-Test", "Common-Test-Deploy"]});

            pipelineStatusStub
                .withArgs("Common")
                .returnsPromise().resolves({"name": "Common", "status": "Passed", "build-number": 1, "upstream": [{type: "git", name: "git.com:some-project.git"}]});

            pipelineStatusStub
                .withArgs("Common-Deploy")
                .returnsPromise().resolves({"name": "Common-Deploy", "status": "Passed", "build-number": 1, "upstream": [{type: "pipeline", name: "Common"}]});

            pipelineStatusStub
                .withArgs("Common-Test")
                .returnsPromise().resolves({"name": "Common-Test", "status": "Passed", "build-number": 1, "upstream": [{type: "git", name: "git.com:some-other-project.git"}]});

            pipelineStatusStub
                .withArgs("Common-Test-Deploy")
                .returnsPromise().resolves({"name": "Common-Test-Deploy", "status": "Passed", "build-number": 1, "upstream": [{type: "pipeline", name: "Common-Test"}]});

            pipelinesService.update();
            var pipelines = pipelinesService.getPipelines();
            should.exist(pipelines);
            pipelines.should.deep.equal({
                "Libraries": {
                    "git.com:some-other-project.git": {
                        "nodes": {
                            "Common-Test": {
                                "data": {
                                    "build-number": 1,
                                    "name": "Common-Test",
                                    "status": "Passed"
                                },
                                "links": [
                                    "Common-Test-Deploy"
                                ]
                            },
                            "Common-Test-Deploy": {
                                "data": {
                                    "build-number": 1,
                                    "name": "Common-Test-Deploy",
                                    "status": "Passed"
                                },
                                "links": []
                            },
                            "GIT": {
                                "data": {
                                    "url": "git.com:some-other-project.git"
                                },
                                "links": [
                                    "Common-Test"
                                ]
                            }
                        },
                        "source": "GIT"
                    },
                    "git.com:some-project.git": {
                        "nodes": {
                            "Common": {
                                "data": {
                                    "build-number": 1,
                                    "name": "Common",
                                    "status": "Passed"
                                },
                                "links": [
                                    "Common-Deploy"
                                ]
                            },
                            "Common-Deploy": {
                                "data": {
                                    "build-number": 1,
                                    "name": "Common-Deploy",
                                    "status": "Passed"
                                },
                                "links": []
                            },
                            "GIT": {
                                "data": {
                                    "url": "git.com:some-project.git"
                                },
                                "links": [
                                    "Common"
                                ]
                            }
                        },
                        "source": "GIT"
                    }
                }
            });
        });
    });
});