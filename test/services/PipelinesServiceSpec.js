const gocdClient = require('../../src/services/GocdClient'),
    should = require('chai').should(),
    sinon = require('sinon'),
    promiseMock = require('../utils/PromiseMock');
    require('sinon-stub-promise')(sinon);

describe('Pipelines Service', () => {
    describe("Get Pipelines", () => {
        let pipelinesService,
            pipelineStatusStub,
            allPipelinesStub,
            promiseStub;

        beforeEach(() => {
            pipelinesService = require('../../src/services/PipelinesService')({on: () => {}});

            pipelineStatusStub = sinon.stub(gocdClient, 'getPipelineStatus');
            allPipelinesStub = sinon.stub(gocdClient, 'getAllPipelines');
            promiseStub = sinon.stub(Promise, 'all', promiseMock.all);
        });

        afterEach(() => {
            gocdClient.getAllPipelines.restore();
            gocdClient.getPipelineStatus.restore();
            Promise.all.restore();
        });

        it("should default to empty object", () => {
            allPipelinesStub.returnsPromise().resolves({});
            pipelinesService.update();

            let pipelines = pipelinesService.getPipelines();
            should.exist(pipelines);
            pipelines.should.deep.equal({});
        });

        it("should get list of pipelines for single group with status and build number", () => {
            allPipelinesStub.returnsPromise().resolves({
                "Application": [
                    {
                        name: "Build",
                        upstream: [{type: "git", name: "git.com:some-project.git"}]
                    },
                    {
                        name: "Test",
                        upstream: [{type: "pipeline", name: "Build"}]
                    }
                ]
            });

            pipelineStatusStub
                .withArgs("Build")
                .returnsPromise().resolves({"name": "Build", "status": "Passed", "build-number": 1});

            pipelineStatusStub
                .withArgs("Test")
                .returnsPromise().resolves({"name": "Test", "status": "Passed", "build-number": 1});

            pipelinesService.update();
            let pipelines = pipelinesService.getPipelines();
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

        it("should get list of all pipelines for multiple groups with status", () => {
            allPipelinesStub.returnsPromise().resolves({
                "Application1": [
                    {
                        name: "Build",
                        upstream: [
                            {type: "git", name: "git.com:some-project.git"}
                        ]
                    }
                ],
                "Application2": [
                    {
                        name: "Publish",
                        upstream: [{type: "git", name: "git.com:some-project.git"}]
                    },
                    {
                        name: "Deploy",
                        upstream: [{type: "pipeline", name: "Publish"}]
                    }
                ]
            });

            pipelineStatusStub
                .withArgs("Build")
                .returnsPromise().resolves({"name": "Build", "status": "Passed", "build-number": 1});

            pipelineStatusStub
                .withArgs("Publish")
                .returnsPromise().resolves({"name": "Publish", "status": "Passed", "build-number": 1});

            pipelineStatusStub
                .withArgs("Deploy")
                .returnsPromise().resolves({"name": "Deploy", "status": "Passed", "build-number": 1});

            pipelinesService.update();
            let pipelines = pipelinesService.getPipelines();
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

        it("should return pipelines in order of breadth first search with git as source node", () => {
            allPipelinesStub.returnsPromise().resolves({
                "Application": [
                    {
                        name: "Build",
                        upstream: [{type: "git", name: "git.com:some-project.git"}]
                    },
                    {
                        name:"Publish",
                        upstream: [{type: "pipeline", name: "Build"}]
                    },
                    {
                        name: "Deploy",
                        upstream: [{type: "pipeline", name: "Publish"}]
                    }
                ]
            });

            pipelineStatusStub
                .withArgs("Build")
                .returnsPromise().resolves({"name": "Build", "status": "Passed", "build-number": 1});

            pipelineStatusStub
                .withArgs("Publish")
                .returnsPromise().resolves({"name": "Publish", "status": "Passed", "build-number": 1});

            pipelineStatusStub
                .withArgs("Deploy")
                .returnsPromise().resolves({"name": "Deploy", "status": "Passed", "build-number": 1});

            pipelinesService.update();
            let pipelines = pipelinesService.getPipelines();
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

        it("should not include git nodes", () => {
            allPipelinesStub.returnsPromise().resolves({
                "Application": [
                    {
                        name: "Build",
                        upstream: [{type: "git", name: "git.com:some-project.git"}]
                    }
                ]
            });

            pipelineStatusStub
                .withArgs("Build")
                .returnsPromise().resolves({"name": "Build", "status": "Passed", "build-number": 1});

            pipelinesService.update();
            let pipelines = pipelinesService.getPipelines();
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

        it("should return pipelines that have multiple git nodes for groups which are not connected", () => {
            allPipelinesStub.returnsPromise().resolves({
                "NFT-Suite": [
                    {
                        name: "Hour",
                        upstream: [{type: "git", name: "git.com:some-project.git"}]
                    },
                    {
                        name: "Overnight",
                        upstream: [{type: "git", name: "git.com:some-project.git"}]
                    },
                    {
                        name: "Weekend",
                        upstream: [{type: "git", name: "git.com:some-project.git"}]
                    }
                ]
            });

            pipelineStatusStub
                .withArgs("Hour")
                .returnsPromise().resolves({"name": "Hour", "status": "Passed", "build-number": 1});

            pipelineStatusStub
                .withArgs("Overnight")
                .returnsPromise().resolves({"name": "Overnight", "status": "Passed", "build-number": 1});

            pipelineStatusStub
                .withArgs("Weekend")
                .returnsPromise().resolves({"name": "Weekend", "status": "Passed", "build-number": 1});

            pipelinesService.update();
            let pipelines = pipelinesService.getPipelines();
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

        it("should remove links to build when another link is available to produce correct order", () => {
            allPipelinesStub.returnsPromise().resolves({
                "Application": [
                    {
                        name: "Build",
                        upstream: [{type: "git", name: "git.com:some-project.git"}]
                    },
                    {
                        name: "Publish",
                        upstream: [{type: "pipeline", name: "Build"}]
                    },
                    {
                        name: "Deploy",
                        upstream: [{type: "pipeline", name: "Build"}, {type: "pipeline", name: "Publish"}]
                    }
                ]
            });

            pipelineStatusStub
                .withArgs("Build")
                .returnsPromise().resolves({"name": "Build", "status": "Passed", "build-number": 1});

            pipelineStatusStub
                .withArgs("Publish")
                .returnsPromise().resolves({"name": "Publish", "status": "Passed", "build-number": 1});

            pipelineStatusStub
                .withArgs("Deploy")
                .returnsPromise().resolves({"name": "Deploy", "status": "Passed", "build-number": 1});

            pipelinesService.update();
            let pipelines = pipelinesService.getPipelines();
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

        it("should update the graph with pipeline status when available", () => {
            allPipelinesStub.returnsPromise().resolves({
                "Application": [
                    {
                        name: "Build",
                        upstream: [{type: "git", name: "git.com:some-project.git"}]
                    },
                    {
                        name: "Publish",
                        upstream: [{type: "pipeline", name: "Build"}]
                    },
                    {
                        name: "Deploy",
                        upstream: [{type: "pipeline", name: "Build"}, {type: "pipeline", name: "Publish"}]
                    }
                ]
            });

            pipelineStatusStub
                .withArgs("Build")
                .returnsPromise().resolves({"name": "Build", "status": "Passed", "build-number": 1});

            pipelineStatusStub
                .withArgs("Publish")
                .returnsPromise().resolves({"name": "Publish", "status": "Passed", "build-number": 1});

            let deployStub = pipelineStatusStub
                .withArgs("Deploy")
                .returnsPromise();

            pipelinesService.update();
            let pipelines = pipelinesService.getPipelines();
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
                                    "name": "Deploy"
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

            deployStub.resolves({"name": "Deploy", "status": "Passed", "build-number": 1});

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

        it("should return separate pipeline for each different git repo", () => {
            allPipelinesStub.returnsPromise().resolves({
                "Libraries": [
                    {
                        name: "Common",
                        upstream: [{type: "git", name: "git.com:some-project.git"}]
                    },
                    {
                        name: "Common-Deploy",
                        upstream: [{type: "pipeline", name: "Common"}]
                    },
                    {
                        name: "Common-Test",
                        upstream: [{type: "git", name: "git.com:some-other-project.git"}]
                    },
                    {
                        name: "Common-Test-Deploy",
                        upstream: [{type: "pipeline", name: "Common-Test"}]
                    }
                ]
            });

            pipelineStatusStub
                .withArgs("Common")
                .returnsPromise().resolves({"name": "Common", "status": "Passed", "build-number": 1});

            pipelineStatusStub
                .withArgs("Common-Deploy")
                .returnsPromise().resolves({"name": "Common-Deploy", "status": "Passed", "build-number": 1});

            pipelineStatusStub
                .withArgs("Common-Test")
                .returnsPromise().resolves({"name": "Common-Test", "status": "Passed", "build-number": 1});

            pipelineStatusStub
                .withArgs("Common-Test-Deploy")
                .returnsPromise().resolves({"name": "Common-Test-Deploy", "status": "Passed", "build-number": 1});

            pipelinesService.update();
            let pipelines = pipelinesService.getPipelines();
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

        it("should link pipelines that have package dependencies to rpmpromotion pipeline if available", () => {
            allPipelinesStub.returnsPromise().resolves({
                "Application": [
                    {
                        name: "Build",
                        upstream: [{type: "git", name: "git.com:some-project.git"}]
                    },
                    {
                        name: "application-rpmpromotion",
                        upstream: [{type: "pipeline", name: "Build"}]
                    },
                    {
                        name: "Deploy-Stage",
                        upstream: [{type: "package", name: "http://my-rpm-repo.com/releases/my-app/"}]
                    },
                    {
                        name: "Deploy-Prod",
                        upstream: [{type: "package", name: "http://my-rpm-repo.com/releases/my-app/"}]
                    }
                ]
            });

            pipelineStatusStub
                .withArgs("Build")
                .returnsPromise().resolves({"name": "Build", "status": "Passed", "build-number": 1});

            pipelineStatusStub
                .withArgs("application-rpmpromotion")
                .returnsPromise().resolves({"name": "application-rpmpromotion", "status": "Passed", "build-number": 1});

            pipelineStatusStub
                .withArgs("Deploy-Stage")
                .returnsPromise().resolves({"name": "Deploy-Stage", "status": "Passed", "build-number": 1});

            pipelineStatusStub
                .withArgs("Deploy-Prod")
                .returnsPromise().resolves({"name": "Deploy-Prod", "status": "Passed", "build-number": 1});

            pipelinesService.update();

            let pipelines = pipelinesService.getPipelines();
            should.exist(pipelines);

            pipelines.should.deep.equal({
                "Application": {
                    "git.com:some-project.git": {
                        "nodes": {
                            "GIT": {
                                "data": {
                                    "url": "git.com:some-project.git"
                                },
                                "links": [
                                    "Build"
                                ]
                            },
                            "Build": {
                                "data": {
                                    "build-number": 1,
                                    "name": "Build",
                                    "status": "Passed"
                                },
                                "links": [
                                    "application-rpmpromotion"
                                ]
                            },
                            "application-rpmpromotion": {
                                "data": {
                                    "build-number": 1,
                                    "name": "application-rpmpromotion",
                                    "status": "Passed"
                                },
                                "links": [
                                    "Deploy-Stage",
                                    "Deploy-Prod"
                                ]
                            },
                            "Deploy-Stage": {
                                "data": {
                                    "build-number": 1,
                                    "name": "Deploy-Stage",
                                    "status": "Passed"
                                },
                                "links": []
                            },
                            "Deploy-Prod": {
                                "data": {
                                    "build-number": 1,
                                    "name": "Deploy-Prod",
                                    "status": "Passed"
                                },
                                "links": []
                            }
                        },
                        "source": "GIT"
                    }
                },
            });
        });
    });
});