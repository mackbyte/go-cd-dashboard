goCdResponseBuilder = {};

var StageBuilder = function() {
    this.name = "Build";
    this.result = "Passed";
};

StageBuilder.prototype.withName = function(name) {
    this.name = name;
    return this;
};

StageBuilder.prototype.withResult = function(result) {
    this.result = result;
    return this;
};

StageBuilder.prototype.withLabel = function(counter) {
    this.counter = counter;
    return this;
};

StageBuilder.prototype.build = function() {
    var stage = this;
    return {
        name: stage.name,
        result: stage.result
    }
};

var PipelineHistoryBuilder = function() {
    this.pipelines = [new PipelineBuilder()]
};

PipelineHistoryBuilder.prototype.withPipeline = function(pipeline) {
    this.pipelines = [pipeline];
    return this;
};

PipelineHistoryBuilder.prototype.withNoPipelines = function() {
    this.pipelines = [];
    return this;
};

PipelineHistoryBuilder.prototype.build = function() {
    var pipelines = [];
    this.pipelines.forEach(function(pipeline) {
        pipelines.push(pipeline.build())
    });
    return {
        pipelines: pipelines
    }
};

var PipelineBuilder = function() {
    this.name = "Dev";
    this.stages = [new StageBuilder()];
    this.label = 1;
    this.materials = [];
};

PipelineBuilder.prototype.withName = function(name) {
    this.name = name;
    return this;
};

PipelineBuilder.prototype.withLabel = function(label) {
    this.label = label;
    return this;
};

PipelineBuilder.prototype.withStage = function(stage) {
    this.stages = [stage];
    return this;
};

PipelineBuilder.prototype.addStage = function(stage) {
    this.stages.push(stage);
    return this;
};

PipelineBuilder.prototype.withMaterial = function(material) {
    this.materials = [material];
    return this;
};

PipelineBuilder.prototype.addMaterial = function(material) {
    this.materials.push(material);
    return this;
};

PipelineBuilder.prototype.build = function() {
    var pipeline = this;
    var stages = [];
    this.stages.forEach(function(stage) {
        stages.push(stage.build())
    });

    var materials = [];
    this.materials.forEach(function(material) {
        materials.push({material: material.build()})
    });

    return {
        name: pipeline.name,
        stages: stages,
        label: pipeline.label,
        build_cause: {
            material_revisions: materials
        }
    }
};

var PipelineSummaryBuilder = function() {
    this.name = "Dev";
    this.stages = [{name: "Build"}];
};

PipelineSummaryBuilder.prototype.withName = function(name) {
    this.name = name;
};

PipelineSummaryBuilder.prototype.withStage = function(stage) {
    this.stages = [{name: stage}];
    return this;
};

PipelineSummaryBuilder.prototype.addStage = function(stage) {
    this.stages.push({name: stage});
    return this;
};

PipelineSummaryBuilder.prototype.build = function() {
    var pipelineSummary = this;
    return {
        name: pipelineSummary.name,
        stages: pipelineSummary.stages
    }
};

var PipelineGroupBuilder = function() {
    this.name = "Application";
    this.pipelines = [new PipelineSummaryBuilder()]
};

PipelineGroupBuilder.prototype.withName = function(name) {
    this.name = name;
    return this;
};

PipelineGroupBuilder.prototype.addPipeline = function(pipeline) {
    this.pipelines.push(pipeline);
    return this;
};

PipelineGroupBuilder.prototype.withPipeline = function(pipeline) {
    this.pipelines = [pipeline];
    return this;
};

PipelineGroupBuilder.prototype.build = function() {
    var group = this;
    var pipelines = [];
    this.pipelines.forEach(function(pipeline) {
        pipelines.push(pipeline.build())
    });
    return {
        name: group.name,
        pipelines: pipelines
    }
};

var PipelineGroupsBuilder = function() {
    this.groups = [new PipelineGroupBuilder()]
};

PipelineGroupsBuilder.prototype.addGroup = function(group) {
    this.groups.push(group);
    return this;
};

PipelineGroupsBuilder.prototype.withGroup = function(group) {
    this.groups = [group];
    return this;
};


PipelineGroupsBuilder.prototype.build = function() {
    var groups = [];
    this.groups.forEach(function(group) {
        groups.push(group.build())
    });
    return groups
};

var MaterialBuilder = function() {
    this.description = "upstream-pipeline";
    this.type = "Pipeline";
};

MaterialBuilder.prototype.withDescription = function(description) {
    this.description = description;
    return this;
};

MaterialBuilder.prototype.withType = function(type) {
    this.type = type;
    return this;
};

MaterialBuilder.prototype.build = function() {
    var material = this;
    return {
        "description": material.description,
        "type": material.type
    }
};

module.exports = {
    StageBuilder: StageBuilder,
    PipelineBuilder: PipelineBuilder,
    PipelineHistoryBuilder: PipelineHistoryBuilder,
    PipelineSummaryBuilder: PipelineSummaryBuilder,
    PipelineGroupBuilder: PipelineGroupBuilder,
    PipelineGroupsBuilder: PipelineGroupsBuilder,
    MaterialBuilder: MaterialBuilder
};

