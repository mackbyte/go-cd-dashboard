var gocdResponseBuilder = require('../utils/gocdResponseBuilder'),
    PipelineGroupsBuilder = gocdResponseBuilder.PipelineGroupsBuilder,
    PipelineGroupBuilder = gocdResponseBuilder.PipelineGroupBuilder,
    PipelineSummaryBuilder = gocdResponseBuilder.PipelineSummaryBuilder,
    PipelineHistoryBuilder = gocdResponseBuilder.PipelineHistoryBuilder,
    PipelineBuilder = gocdResponseBuilder.PipelineBuilder,
    StageBuilder = gocdResponseBuilder.StageBuilder;
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
        })
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
                        ]
                    }
                ]
            };

            pipelineHistory.should.deep.equal(expected);
        })
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
                ]
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
                ]
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
                ]
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
                ]
            };
            pipeline.should.deep.equal(expected);
        });

        it("should be able to set pipeline counter", function() {
            var pipeline = new PipelineBuilder()
                .withCounter(5)
                .build();

            pipeline.counter.should.equal(5);
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
    })
});
