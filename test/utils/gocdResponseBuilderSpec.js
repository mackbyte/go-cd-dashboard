var gocdResponseBuilder = require('../utils/gocdResponseBuilder'),
    PipelineGroupsBuilder = gocdResponseBuilder.PipelineGroupsBuilder,
    PipelineGroupBuilder = gocdResponseBuilder.PipelineGroupBuilder,
    PipelineSummaryBuilder = gocdResponseBuilder.PipelineSummaryBuilder,
    PipelineHistoryBuilder = gocdResponseBuilder.PipelineHistoryBuilder,
    PipelineBuilder = gocdResponseBuilder.PipelineBuilder,
    StageBuilder = gocdResponseBuilder.StageBuilder,
    MaterialBuilder = gocdResponseBuilder.MaterialBuilder;
    should = require('chai').should();

describe('GoCD Response Builder', function() {
    describe("Pipeline Groups Builder", function() {
        it("should default to array of one pipeline group", function() {
            var pipelineGroups = new PipelineGroupsBuilder().build();
            var expected = [
                {
                    "name": "Application",
                    "pipelines": [
                        {
                            "name": "Dev",
                            "stages": [
                                {
                                    "name": "Build"
                                }
                            ]
                        }
                    ]
                }
            ];
            pipelineGroups.should.deep.equal(expected);
        });

        it("should be able to set group with stages", function() {
            var pipelineGroups = new PipelineGroupsBuilder()
                .withGroup(new PipelineGroupBuilder()
                    .withPipeline(new PipelineSummaryBuilder()
                        .withStage("Build")
                        .addStage("Test")
                    )
                ).build();

            var expected = [
                {
                    "name": "Application",
                    "pipelines": [
                        {
                            "name": "Dev",
                            "stages": [
                                {
                                    "name": "Build"
                                },
                                {
                                    "name": "Test"
                                }
                            ]
                        }
                    ]
                }
            ];

            pipelineGroups.should.deep.equal(expected);
        });
    });

    describe("Pipeline Group Builder", function() {
        it("should default to group of one pipeline with one stage", function() {
            var pipelineGroup = new PipelineGroupBuilder().build();
            var expected = {
                "name": "Application",
                "pipelines": [
                    {
                        "name": "Dev",
                        "stages": [
                            {
                                "name": "Build"
                            }
                        ]
                    }
                ]
            };
            pipelineGroup.should.deep.equal(expected)
        });

        it("should be able to set Pipeline group name", function() {
            var pipelineGroup = new PipelineGroupBuilder()
                .withName("MyApp")
                .build();

            pipelineGroup.name.should.equal("MyApp");
        });
        
        it("should be able to add pipeline", function() {
            var pipelineGroup = new PipelineGroupBuilder()
                .addPipeline(new PipelineSummaryBuilder())
                .build();
            var expected = {
                "name": "Application",
                "pipelines": [
                    {
                        "name": "Dev",
                        "stages": [
                            {
                                "name": "Build"
                            }
                        ]
                    },
                    {
                        "name": "Dev",
                        "stages": [
                            {
                                "name": "Build"
                            }
                        ]
                    }
                ]
            };
            pipelineGroup.should.deep.equal(expected)
        });
    });
    
    describe("Pipeline History Builder", function() {
        it("should default to pipeline history with one pipeline with one stage", function() {
            var pipelineHistory = new PipelineHistoryBuilder().build();
            var expected = {
                "pipelines": [
                    {
                        "name": "Dev",
                        "counter": 1,
                        "stages": [
                            {
                                "name": "Build",
                                "result": "Passed"
                            }
                        ],
                        "build_cause": {
                            "material_revisions": []
                        }
                    }
                ]
            };

            pipelineHistory.should.deep.equal(expected);
        });

        it("should be able to build empty pipeline history", function() {
            var pipelineHistory = new PipelineHistoryBuilder().withNoPipelines().build();
            var expected = {
                "pipelines": []
            };

            pipelineHistory.should.deep.equal(expected);
        });
    });
    
    describe("Pipeline Builder", function() {
        it("should default to pipeline with one stage", function() {
            var pipeline = new PipelineBuilder().build();
            var expected = {
                "name": "Dev",
                "counter": 1,
                "stages": [
                    {
                        "name": "Build",
                        "result": "Passed"
                    }
                ],
                "build_cause": {
                    "material_revisions": []
                }
            };
            pipeline.should.deep.equal(expected);
        });
        
        it("should be able to add stages", function() {
            var pipeline = new PipelineBuilder()
                .addStage(new StageBuilder())
                .build();
            var expected = {
                "name": "Dev",
                "counter": 1,
                "stages": [
                    {
                        "name": "Build",
                        "result": "Passed"
                    },
                    {
                        "name": "Build",
                        "result": "Passed"
                    }
                ],
                "build_cause": {
                    "material_revisions": []
                }
            };
            pipeline.should.deep.equal(expected);
        });
        
        it("should be able to set stages", function() {
            var pipeline = new PipelineBuilder()
                .withStage(new StageBuilder()
                    .withName("Other")
                )
                .build();
            var expected = {
                "name": "Dev",
                "counter": 1,
                "stages": [
                    {
                        "name": "Other",
                        "result": "Passed"
                    }
                ],
                "build_cause": {
                    "material_revisions": []
                }
            };
            pipeline.should.deep.equal(expected);
        });

        it("should be able to set and add stages", function() {
            var pipeline = new PipelineBuilder()
                .withStage(new StageBuilder()
                    .withName("One")
                )
                .addStage(new StageBuilder()
                    .withName("Two")
                )
                .build();
            var expected = {
                "name": "Dev",
                "counter": 1,
                "stages": [
                    {
                        "name": "One",
                        "result": "Passed"
                    },
                    {
                        "name": "Two",
                        "result": "Passed"
                    }
                ],
                "build_cause": {
                    "material_revisions": []
                }
            };
            pipeline.should.deep.equal(expected);
        });

        it("should be able to set pipeline counter", function() {
            var pipeline = new PipelineBuilder()
                .withCounter(5)
                .build();

            pipeline.counter.should.equal(5);
        });
        
        it("should be able to add materials", function() {
            var pipeline = new PipelineBuilder()
                .withMaterial(new MaterialBuilder())
                .build();

            should.exist(pipeline.build_cause.material_revisions);
            pipeline.build_cause.material_revisions.should.have.length(1);

            var material = pipeline.build_cause.material_revisions[0].material;
            material.should.have.property("description", "upstream-pipeline");
            material.should.have.property("type", "Pipeline");
        });

        it("should be able to add materials", function() {
            var pipeline = new PipelineBuilder()
                .withMaterial(new MaterialBuilder())
                .addMaterial(new MaterialBuilder()
                    .withDescription("github.com")
                    .withType("git")
                )
                .build();

            should.exist(pipeline.build_cause.material_revisions);
            pipeline.build_cause.material_revisions.should.have.length(2);

            var material = pipeline.build_cause.material_revisions[0].material;
            material.should.have.property("description", "upstream-pipeline");
            material.should.have.property("type", "Pipeline");

            var material2 = pipeline.build_cause.material_revisions[1].material;
            material2.should.have.property("description", "github.com");
            material2.should.have.property("type", "git");
        });
    });

    describe("Stage Builder", function() {
        it("should default to stage with result as passed and counter as 1", function() {
            var stage = new StageBuilder().build();
            var expected = {
                "name": "Build",
                "result": "Passed"
            };

            stage.should.deep.equal(expected);
        });
        
        it("should be able to set stage name", function() {
            var stage = new StageBuilder()
                .withName("Test")
                .build();

            stage.name.should.equal("Test")
        });

        it("should be able to set stage result", function() {
            var stage = new StageBuilder()
                .withResult("Failed")
                .build();

            stage.result.should.equal("Failed");
        });
    });

    describe("Material Builder", function() {
        it("should default to material with description and type", function() {
            var material = new MaterialBuilder().build();

            material.should.deep.equal({
                "description": "upstream-pipeline",
                "type": "Pipeline"
            })
        });

        it("should be able to set description", function() {
            var material = new MaterialBuilder()
                .withDescription("my-description")
                .build();

            material.should.deep.equal({
                "description": "my-description",
                "type": "Pipeline"
            })
        });

        it("should be able to set type", function() {
            var material = new MaterialBuilder()
                .withType("my-type")
                .build();

            material.should.deep.equal({
                "description": "upstream-pipeline",
                "type": "my-type"
            })
        });
    });
});
