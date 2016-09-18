var gocdClient = require('../../src/services/gocdClient'),
    gocdResponseBuilder = require('../utils/gocdResponseBuilder'),
    StageBuilder = gocdResponseBuilder.StageBuilder,
    PipelineBuilder = gocdResponseBuilder.PipelineBuilder,
    PipelineHistoryBuilder = gocdResponseBuilder.PipelineHistoryBuilder,
    PipelineGroupBuilder = gocdResponseBuilder.PipelineGroupBuilder,
    PipelineGroupsBuilder = gocdResponseBuilder.PipelineGroupsBuilder,
    MaterialBuilder = gocdResponseBuilder.MaterialBuilder,
    nock = require('nock'),
    should = require('chai').should();

describe('GoCD Client', function() {
    afterEach(function() {
        nock.cleanAll();
    });

    describe("getPipelineStatus", function() {
        function mockPipelineHistory(status, response) {
            nock('http://nebmgttgo01.ath.cdi.bskyb.com')
                .get('/go/api/pipelines/mypipeline/history')
                .reply(status, response);
        }

        it('should return latest stage info for valid pipeline and stage', function(done) {
            mockPipelineHistory(200, new PipelineHistoryBuilder().build());

            gocdClient.getPipelineStatus('mypipeline')
                .then(function(pipeline) {
                    should.exist(pipeline);
                    pipeline.should.have.property('status', 'Passed');
                    pipeline.should.have.property('build-number', 1);
                    done();
                });
        });

        it('should reject request is not successful', function(done) {
            mockPipelineHistory(400, {});

            gocdClient.getPipelineStatus('mypipeline')
                .catch(function(error) {
                    done();
                });
        });

        it("should return status for failed pipelines", function(done) {
            mockPipelineHistory(200,
                new PipelineHistoryBuilder()
                    .withPipeline(new PipelineBuilder()
                        .withStage(new StageBuilder()
                            .withResult("Failed")
                        )
                    )
                    .build());

            gocdClient.getPipelineStatus('mypipeline')
                .then(function(pipeline) {
                    should.exist(pipeline);
                    pipeline.should.have.property('status', 'Failed');
                    pipeline.should.have.property('build-number', 1);
                    done();
                });
        });

        it("should return list of upstream pipelines if available", function(done) {
            mockPipelineHistory(200,
                new PipelineHistoryBuilder()
                    .withPipeline(new PipelineBuilder()
                        .withMaterial(new MaterialBuilder()
                            .withDescription("pre-build")
                        )
                    )
                    .build());

            gocdClient.getPipelineStatus('mypipeline')
                .then(function(pipeline) {
                    should.exist(pipeline);
                    pipeline.upstream.should.deep.equal([
                        {type: 'pipeline', name: 'pre-build'}
                    ]);
                    done();
                });
        });

        it("should return empty list of upstream pipelines if not available", function(done) {
            mockPipelineHistory(200,
                new PipelineHistoryBuilder()
                    .withPipeline(new PipelineBuilder())
                    .build());

            gocdClient.getPipelineStatus('mypipeline')
                .then(function(pipeline) {
                    should.exist(pipeline);
                    pipeline.upstream.should.be.empty;
                    done();
                });
        });

        it("should return empty list of upstream pipelines if material type is not Pipeline or Git", function(done) {
            mockPipelineHistory(200,
                new PipelineHistoryBuilder()
                    .withPipeline(new PipelineBuilder()
                        .withMaterial(new MaterialBuilder()
                            .withDescription("upstream")
                            .withType("repo")
                        )
                    )
                    .build());

            gocdClient.getPipelineStatus('mypipeline')
                .then(function(pipeline) {
                    should.exist(pipeline);
                    pipeline.upstream.should.be.empty;
                    done();
                });
        });

        it("should return all upstream pipelines that have material type of Pipeline", function(done) {
            mockPipelineHistory(200,
                new PipelineHistoryBuilder()
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
                    .build());

            gocdClient.getPipelineStatus('mypipeline')
                .then(function(pipeline) {
                    should.exist(pipeline);
                    pipeline.upstream.should.have.lengthOf(2);
                    pipeline.upstream.should.have.deep.members([
                        {type: 'pipeline', name: 'builder'},
                        {type: 'pipeline', name: 'publisher'},
                    ]);
                    done();
                });
        });

        it("should contain GIT in upstream list if pipeline depends on it", function(done) {
            mockPipelineHistory(200,
                new PipelineHistoryBuilder()
                    .withPipeline(new PipelineBuilder()
                        .withMaterial(new MaterialBuilder()
                            .withDescription("URL: some-git.com:some-project.git, Branch: master")
                            .withType("Git")
                        )
                    )
                    .build());

            gocdClient.getPipelineStatus('mypipeline')
                .then(function(pipeline) {
                    should.exist(pipeline);
                    pipeline.upstream.should.deep.equal([
                        {type: 'git', name: 'some-git.com:some-project.git'},
                    ]);
                    done();
                });
        });

        it("should return full description if git url cannot be extracted from it", function(done) {
            mockPipelineHistory(200,
                new PipelineHistoryBuilder()
                    .withPipeline(new PipelineBuilder()
                        .withMaterial(new MaterialBuilder()
                            .withDescription("https://github.com/some-team/some-project.git")
                            .withType("Git")
                        )
                    )
                    .build());

            gocdClient.getPipelineStatus('mypipeline')
                .then(function(pipeline) {
                    should.exist(pipeline);
                    pipeline.upstream.should.deep.equal([
                        {type: 'git', name: 'https://github.com/some-team/some-project.git'},
                    ]);
                    done();
                });
        });

        it("should not return GIT in upstream list if there are materials of type pipeline available", function(done) {
            mockPipelineHistory(200,
                new PipelineHistoryBuilder()
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
                    .build());

            gocdClient.getPipelineStatus('mypipeline')
                .then(function(pipeline) {
                    should.exist(pipeline);
                    pipeline.upstream.should.deep.equal([
                        {type: 'pipeline', name: 'Build'},
                    ]);
                    done();
                });
        });
    });

    describe("getAllPipelines", function() {
        function mockPipelineGroups(status, response) {
            nock('http://nebmgttgo01.ath.cdi.bskyb.com')
                .get('/go/api/config/pipeline_groups')
                .reply(status, response);
        }

        it("should return pipeline group with one pipeline", function(done) {
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

            gocdClient.getAllPipelines()
                .then(function(pipelines) {
                    should.exist(pipelines);
                    pipelines.should.eql({"Application": ["Dev"]});
                    done()
                });
        });

        it("should return pipeline group with one pipeline for pipeline with multiple stages", function(done) {
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

            gocdClient.getAllPipelines()
                .then(function(pipelines) {
                    should.exist(pipelines);
                    pipelines.should.eql({"Application": ["Dev"]});
                    done()
                });
        });

        it("should return pipeline group with multiple pipelines for group with multiple pipelines", function(done) {
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

            gocdClient.getAllPipelines()
                .then(function(pipelines) {
                    should.exist(pipelines);
                    pipelines.should.eql({
                        "Restler": ["Build", "Test"],
                        "Ingester": ["Publish"]
                    });
                    done()
                });
        });

        it("should return all pipeline groups with pipelines", function(done) {
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

            gocdClient.getAllPipelines()
                .then(function(pipelines) {
                    should.exist(pipelines);
                    pipelines.should.eql({
                        "Restler": ["Build", "Test"],
                        "Ingester": ["Compile", "Publish"]
                    });
                    done()
                });
        })
    });
});