const gocdResponseBuilder = require('./GocdResponseBuilder'),
    { PipelineGroupsBuilder, PipelineGroupBuilder, PipelineSummaryBuilder, PipelineHistoryBuilder, PipelineBuilder, StageBuilder, MaterialBuilder } = gocdResponseBuilder,
    should = require('chai').should();

describe('GoCD Response Builder', () => {
    describe("Pipeline Groups Builder", () => {
        it("should default to array of one pipeline group", () => {
            let pipelineGroups = new PipelineGroupsBuilder().build();
            let expected = [
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

        it("should be able to set group with stages", () => {
            let pipelineGroups = new PipelineGroupsBuilder()
                .withGroup(new PipelineGroupBuilder()
                    .withPipeline(new PipelineSummaryBuilder()
                        .withStage("Build")
                        .addStage("Test")
                    )
                ).build();

            let expected = [
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

    describe("Pipeline Group Builder", () => {
        it("should default to group of one pipeline with one stage", () => {
            let pipelineGroup = new PipelineGroupBuilder().build();
            let expected = {
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

        it("should be able to set Pipeline group name", () => {
            let pipelineGroup = new PipelineGroupBuilder()
                .withName("MyApp")
                .build();

            pipelineGroup.name.should.equal("MyApp");
        });
        
        it("should be able to add pipeline", () => {
            let pipelineGroup = new PipelineGroupBuilder()
                .addPipeline(new PipelineSummaryBuilder())
                .build();
            let expected = {
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
    
    describe("Pipeline History Builder", () => {
        it("should default to pipeline history with one pipeline with one stage", () => {
            let pipelineHistory = new PipelineHistoryBuilder().build();
            let expected = {
                "pipelines": [
                    {
                        "name": "Dev",
                        "label": 1,
                        "stages": [
                            {
                                "name": "Build",
                                "result": "Passed"
                            }
                        ],
                        "materials": []
                    }
                ]
            };

            pipelineHistory.should.deep.equal(expected);
        });

        it("should be able to build empty pipeline history", () => {
            let pipelineHistory = new PipelineHistoryBuilder().withNoPipelines().build();
            let expected = {
                "pipelines": []
            };

            pipelineHistory.should.deep.equal(expected);
        });
    });
    
    describe("Pipeline Builder", () => {
        it("should default to pipeline with one stage", () => {
            let pipeline = new PipelineBuilder().build();
            let expected = {
                "name": "Dev",
                "label": 1,
                "stages": [
                    {
                        "name": "Build",
                        "result": "Passed"
                    }
                ],
                "materials": []
            };
            pipeline.should.deep.equal(expected);
        });
        
        it("should be able to add stages", () => {
            let pipeline = new PipelineBuilder()
                .addStage(new StageBuilder())
                .build();
            let expected = {
                "name": "Dev",
                "label": 1,
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
                "materials": []
            };
            pipeline.should.deep.equal(expected);
        });
        
        it("should be able to set stages", () => {
            let pipeline = new PipelineBuilder()
                .withStage(new StageBuilder()
                    .withName("Other")
                )
                .build();
            let expected = {
                "name": "Dev",
                "label": 1,
                "stages": [
                    {
                        "name": "Other",
                        "result": "Passed"
                    }
                ],
                "materials": []
            };
            pipeline.should.deep.equal(expected);
        });

        it("should be able to set and add stages", () => {
            let pipeline = new PipelineBuilder()
                .withStage(new StageBuilder()
                    .withName("One")
                )
                .addStage(new StageBuilder()
                    .withName("Two")
                )
                .build();
            let expected = {
                "name": "Dev",
                "label": 1,
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
                "materials": []
            };
            pipeline.should.deep.equal(expected);
        });

        it("should be able to set pipeline counter", () => {
            let pipeline = new PipelineBuilder()
                .withLabel(5)
                .build();

            pipeline.label.should.equal(5);
        });
        
        it("should be able to set materials", () => {
            let pipeline = new PipelineBuilder()
                .withMaterial(new MaterialBuilder())
                .build();

            should.exist(pipeline.materials);
            pipeline.materials.should.have.length(1);

            let material = pipeline.materials[0];
            material.should.have.property("description", "upstream-pipeline");
            material.should.have.property("type", "Pipeline");
        });

        it("should be able to add multiple materials", () => {
            let pipeline = new PipelineBuilder()
                .withMaterial(new MaterialBuilder())
                .addMaterial(new MaterialBuilder()
                    .withDescription("github.com")
                    .withType("git")
                )
                .build();

            should.exist(pipeline.materials);
            pipeline.materials.should.have.length(2);

            let material = pipeline.materials[0];
            material.should.have.property("description", "upstream-pipeline");
            material.should.have.property("type", "Pipeline");

            let material2 = pipeline.materials[1];
            material2.should.have.property("description", "github.com");
            material2.should.have.property("type", "git");
        });
    });

    describe("Stage Builder", () => {
        it("should default to stage with result as passed and counter as 1", () => {
            let stage = new StageBuilder().build();
            let expected = {
                "name": "Build",
                "result": "Passed"
            };

            stage.should.deep.equal(expected);
        });
        
        it("should be able to set stage name", () => {
            let stage = new StageBuilder()
                .withName("Test")
                .build();

            stage.name.should.equal("Test")
        });

        it("should be able to set stage result", () => {
            let stage = new StageBuilder()
                .withResult("Failed")
                .build();

            stage.result.should.equal("Failed");
        });
    });

    describe("Material Builder", () => {
        it("should default to material with description and type", () => {
            let material = new MaterialBuilder().build();

            material.should.deep.equal({
                "description": "upstream-pipeline",
                "type": "Pipeline"
            })
        });

        it("should be able to set description", () => {
            let material = new MaterialBuilder()
                .withDescription("my-description")
                .build();

            material.should.deep.equal({
                "description": "my-description",
                "type": "Pipeline"
            })
        });

        it("should be able to set type", () => {
            let material = new MaterialBuilder()
                .withType("my-type")
                .build();

            material.should.deep.equal({
                "description": "upstream-pipeline",
                "type": "my-type"
            })
        });
    });
});
