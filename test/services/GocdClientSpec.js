const gocdClient = require('../../src/services/GocdClient'),
      gocdResponseBuilder = require('../utils/GocdResponseBuilder'),
      { StageBuilder, PipelineBuilder, PipelineHistoryBuilder, PipelineGroupBuilder, PipelineGroupsBuilder, MaterialBuilder } = gocdResponseBuilder,
      nock = require('nock'),
      should = require('chai').should();

describe('GoCD Client', () => {
    afterEach(() => {
        nock.cleanAll();
    });

    describe("getPipelineStatus", () => {
        const mockPipelineHistory = (status, response) => {
            nock('http://nebmgttgo01.ath.cdi.bskyb.com')
                .get('/go/api/pipelines/mypipeline/history')
                .reply(status, response);
        };

        it('should return latest stage info for valid pipeline and stage', () => {
            mockPipelineHistory(200, new PipelineHistoryBuilder().build());

            return gocdClient.getPipelineStatus('mypipeline')
                .then(pipeline => {
                    should.exist(pipeline);
                    pipeline.should.have.property('status', 'Passed');
                    pipeline.should.have.property('build-number', 1);
                });
        });

        it('should reject request if not successful', () => {
            mockPipelineHistory(400, {});

            return gocdClient.getPipelineStatus('mypipeline')
                .catch((error) => {});
        });

        it("should return status for failed pipelines", () => {
            mockPipelineHistory(200,
                new PipelineHistoryBuilder()
                    .withPipeline(new PipelineBuilder()
                        .withStage(new StageBuilder()
                            .withResult("Failed")
                        )
                    )
                    .build());

            return gocdClient.getPipelineStatus('mypipeline')
                .then(pipeline => {
                    should.exist(pipeline);
                    pipeline.should.have.property('status', 'Failed');
                    pipeline.should.have.property('build-number', 1);
                });
        });

        it("should return pipeline with unknown status and negative build number if no history exists", () => {
            mockPipelineHistory(200,
                new PipelineHistoryBuilder()
                    .withNoPipelines()
                    .build());

            return gocdClient.getPipelineStatus('mypipeline')
                .then(pipeline => {
                    should.exist(pipeline);
                    pipeline.should.have.property('status', 'NoHistory');
                    pipeline.should.have.property('build-number', -1);
                });
        });

        it("should return pipeline with building status and build number when any stage in pipeline is building", () => {
            mockPipelineHistory(200,
                new PipelineHistoryBuilder()
                    .withPipeline(new PipelineBuilder()
                        .withStage(new StageBuilder()
                            .withResult("Unknown")
                        )
                    )
                    .build());

            return gocdClient.getPipelineStatus('mypipeline')
                .then(pipeline => {
                    should.exist(pipeline);
                    pipeline.should.have.property('status', 'Unknown');
                    pipeline.should.have.property('build-number', 1);
                });
        });

        it("should return pipeline success if all stages that have run have passed", () => {
            mockPipelineHistory(200,
                new PipelineHistoryBuilder()
                    .withPipeline(new PipelineBuilder()
                        .withStage(new StageBuilder()
                            .withResult("Passed")
                        ).addStage(new StageBuilder()
                            .withResult(undefined)
                        )
                    )
                    .build());

            return gocdClient.getPipelineStatus('mypipeline')
                .then(pipeline => {
                    should.exist(pipeline);
                    pipeline.should.have.property('status', 'Passed');
                    pipeline.should.have.property('build-number', 1);
                });
        });

        it("should return pipeline failed if all stages that have run have failed", () => {
            mockPipelineHistory(200,
                new PipelineHistoryBuilder()
                    .withPipeline(new PipelineBuilder()
                        .withStage(new StageBuilder()
                            .withResult("Failed")
                        ).addStage(new StageBuilder()
                            .withResult(undefined)
                        )
                    )
                    .build());

            return gocdClient.getPipelineStatus('mypipeline')
                .then(pipeline => {
                    should.exist(pipeline);
                    pipeline.should.have.property('status', 'Failed');
                    pipeline.should.have.property('build-number', 1);
                });
        });
    });

    describe("getAllPipelines", () => {
        const mockPipelineGroups = (status, response) => {
            nock('http://nebmgttgo01.ath.cdi.bskyb.com')
                .get('/go/api/config/pipeline_groups')
                .reply(status, response);
        };

        it("should return pipeline group with one pipeline", () => {
            mockPipelineGroups(200,
                new PipelineGroupsBuilder()
                    .withGroup(new PipelineGroupBuilder()
                        .withPipeline(new PipelineBuilder()
                            .withStage(new StageBuilder()
                                .withName("Build")
                            )
                        )
                    )
                    .build());

            return gocdClient.getAllPipelines()
                .then(pipelines => {
                    should.exist(pipelines);
                    pipelines.should.deep.equal({
                        Application: [
                            {
                                name: "Dev",
                                upstream: []
                            }
                        ]
                    });
                });
        });

        it("should return pipeline group with one pipeline for pipeline with multiple stages", () => {
            mockPipelineGroups(200,
                new PipelineGroupsBuilder()
                    .withGroup(new PipelineGroupBuilder()
                        .withPipeline(new PipelineBuilder()
                            .withStage(new StageBuilder()
                                .withName("Build")
                            )
                            .addStage(new StageBuilder()
                                .withName("Test")
                            )
                        )
                    )
                    .build()
            );

            return gocdClient.getAllPipelines()
                .then(pipelines => {
                    should.exist(pipelines);
                    pipelines.should.deep.equal({
                        Application: [
                            {
                                name: "Dev",
                                upstream: []
                            }
                        ]
                    });
                });
        });

        it("should return pipeline group with multiple pipelines for group with multiple pipelines", () => {
            mockPipelineGroups(200,
                new PipelineGroupsBuilder()
                    .withGroup(new PipelineGroupBuilder()
                        .withName("Restler")
                        .withPipeline(new PipelineBuilder()
                            .withName("Build")
                        )
                        .addPipeline(new PipelineBuilder()
                            .withName("Test")
                        )
                    )
                    .addGroup(new PipelineGroupBuilder()
                        .withName("Ingester")
                        .withPipeline(new PipelineBuilder()
                            .withName("Publish")
                        )
                    )
                    .build()
            );

            return gocdClient.getAllPipelines()
                .then(pipelines => {
                    should.exist(pipelines);
                    pipelines.should.deep.equal({
                        Restler: [
                            {
                                name: "Build",
                                upstream: []
                            },
                            {
                                name: "Test",
                                upstream: []
                            }
                        ],
                        Ingester: [
                            {
                                name: "Publish",
                                upstream: []
                            }
                        ]
                    });
                });
        });

        it("should return all pipeline groups with pipelines", () => {
            mockPipelineGroups(200,
                new PipelineGroupsBuilder()
                    .withGroup(new PipelineGroupBuilder()
                        .withName("Restler")
                        .withPipeline(new PipelineBuilder()
                            .withName("Build")
                        )
                        .addPipeline(new PipelineBuilder()
                            .withName("Test")
                        )
                    )
                    .addGroup(new PipelineGroupBuilder()
                        .withName("Ingester")
                        .withPipeline(new PipelineBuilder()
                            .withName("Compile")
                        )
                        .addPipeline(new PipelineBuilder()
                            .withName("Publish")
                        )
                    )
                    .build()
            );

            return gocdClient.getAllPipelines()
                .then(pipelines => {
                    should.exist(pipelines);
                    pipelines.should.deep.equal({
                        Restler: [
                            {
                                name: "Build",
                                upstream: []
                            },
                            {
                                name: "Test",
                                upstream: []
                            }
                        ],
                        Ingester: [
                            {
                                name: "Compile",
                                upstream: []
                            },
                            {
                                name: "Publish",
                                upstream: []
                            }
                        ]
                    });
                });
        });

        it("should return list of upstream pipelines if available", () => {
            mockPipelineGroups(200,
                new PipelineGroupsBuilder()
                    .withGroup(new PipelineGroupBuilder()
                        .withPipeline(new PipelineBuilder()
                            .withMaterial(new MaterialBuilder()
                                .withDescription("pre-build")
                            )
                        )
                    )
                .build());

            return gocdClient.getAllPipelines()
                .then(pipelines => {
                    should.exist(pipelines);
                    let pipeline = pipelines.Application[0];
                    pipeline.upstream.should.deep.equal([
                        {type: "pipeline", name: "pre-build"}
                    ]);
                });
        });

        it("should return empty list of upstream pipelines if not available", () => {
            mockPipelineGroups(200,
                new PipelineGroupsBuilder()
                    .withGroup(new PipelineGroupBuilder()
                        .withPipeline(new PipelineBuilder())
                    )
                .build());

            return gocdClient.getAllPipelines()
                .then(pipelines => {
                    should.exist(pipelines);
                    let pipeline = pipelines.Application[0];
                    pipeline.upstream.should.be.empty;
                });
        });

        it("should return empty list of upstream pipelines if material type is not Pipeline, Git or Package", () => {
            mockPipelineGroups(200,
                new PipelineGroupsBuilder()
                    .withGroup(new PipelineGroupBuilder()
                        .withPipeline(new PipelineBuilder()
                            .withMaterial(new MaterialBuilder()
                                .withDescription("upstream")
                                .withType("repo")
                            )
                        )
                    )
                .build());

            return gocdClient.getAllPipelines()
                .then(pipelines => {
                    should.exist(pipelines);
                    let pipeline = pipelines.Application[0];
                    pipeline.upstream.should.be.empty;
                });
        });

        it("should return all upstream pipelines that have material type of Pipeline", () => {
            mockPipelineGroups(200,
                new PipelineGroupsBuilder()
                    .withGroup(new PipelineGroupBuilder()
                        .withPipeline(new PipelineBuilder()
                            .withMaterial(new MaterialBuilder()
                                .withDescription("builder")
                                .withType("Pipeline")
                            )
                            .addMaterial(new MaterialBuilder()
                                .withDescription("github")
                                .withType("Git")
                            )
                            .addMaterial(new MaterialBuilder()
                                .withDescription("publisher")
                                .withType("Pipeline")
                            )
                            .addMaterial(new MaterialBuilder()
                                .withDescription("some other dependency")
                                .withType("Other")
                            )
                        )
                    )
                .build());

            return gocdClient.getAllPipelines()
                .then(pipelines => {
                    should.exist(pipelines);
                    let pipeline = pipelines.Application[0];
                    pipeline.upstream.should.have.lengthOf(2);
                    pipeline.upstream.should.have.deep.members([
                        {type: 'pipeline', name: 'builder'},
                        {type: 'pipeline', name: 'publisher'},
                    ]);
                });
        });

        it("should contain GIT in upstream list if pipeline depends on it", () => {
            mockPipelineGroups(200,
                new PipelineGroupsBuilder()
                    .withGroup(new PipelineGroupBuilder()
                        .withPipeline(new PipelineBuilder()
                            .withMaterial(new MaterialBuilder()
                                .withDescription("URL: some-git.com:some-project.git, Branch: master")
                                .withType("Git")
                            )
                        )
                    )
                .build());

            return gocdClient.getAllPipelines()
                .then(pipelines => {
                    should.exist(pipelines);
                    let pipeline = pipelines.Application[0];
                    pipeline.upstream.should.deep.equal([
                        {type: 'git', name: 'some-git.com:some-project.git'},
                    ]);
                });
        });

        it("should return full description if git url cannot be extracted from it", () => {
            mockPipelineGroups(200,
                new PipelineGroupsBuilder()
                    .withGroup(new PipelineGroupBuilder()
                        .withPipeline(new PipelineBuilder()
                            .withMaterial(new MaterialBuilder()
                                .withDescription("https://github.com/some-team/some-project.git")
                                .withType("Git")
                            )
                        )
                    )
                .build());

            return gocdClient.getAllPipelines()
                .then(pipelines => {
                    should.exist(pipelines);
                    let pipeline = pipelines.Application[0];
                    pipeline.upstream.should.deep.equal([
                        {type: 'git', name: 'https://github.com/some-team/some-project.git'},
                    ]);
                });
        });

        it("should not return GIT in upstream list if there are materials of type pipeline available", () => {
            mockPipelineGroups(200,
                new PipelineGroupsBuilder()
                    .withGroup(new PipelineGroupBuilder()
                        .withPipeline(new PipelineBuilder()
                            .withMaterial(new MaterialBuilder()
                                .withDescription("URL: some-git.com:some-project.git, Branch: master")
                                .withType("Git")
                            )
                            .addMaterial(new MaterialBuilder()
                                .withDescription("Build")
                                .withType("Pipeline")
                            )
                        )
                    )
                .build());

            return gocdClient.getAllPipelines()
                .then(pipelines => {
                    should.exist(pipelines);
                    let pipeline = pipelines.Application[0];
                    pipeline.upstream.should.deep.equal([
                        {type: 'pipeline', name: 'Build'},
                    ]);
                });
        });

        it("should return Package materials if available", () => {
            mockPipelineGroups(200,
                new PipelineGroupsBuilder()
                    .withGroup(new PipelineGroupBuilder()
                        .withPipeline(new PipelineBuilder()
                            .withMaterial(new MaterialBuilder()
                                .withDescription("Repository: [repo_url=http://my-rpm-repo.com/releases/my-app/] - Package: [package_spec=my-app.*]")
                                .withType("Package")
                            )
                        )
                    )
                .build());

            return gocdClient.getAllPipelines()
                .then(pipelines => {
                    should.exist(pipelines);
                    let pipeline = pipelines.Application[0];
                    pipeline.upstream.should.deep.equal([
                        {type: 'package', name: 'http://my-rpm-repo.com/releases/my-app/'},
                    ]);
                });
        });
    });
});