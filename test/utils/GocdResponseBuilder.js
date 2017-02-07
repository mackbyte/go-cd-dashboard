class StageBuilder {
    constructor() {
        this.name = "Build";
        this.result = "Passed";
    }

    withName(name) {
        this.name = name;
        return this;
    }

    withResult(result) {
        this.result = result;
        return this;
    }

    build() {
        return {
            name: this.name,
            result: this.result
        }
    }
}

class PipelineHistoryBuilder {
    constructor() {
        this.pipelines = [new PipelineBuilder()]
    }

    withPipeline(pipeline) {
        this.pipelines = [pipeline];
        return this;
    }

    withNoPipelines() {
        this.pipelines = [];
        return this;
    }

    build() {
        return {
            pipelines: this.pipelines.map(pipeline => pipeline.build())
        }
    }
}

class PipelineBuilder {
    constructor() {
        this.name = "Dev";
        this.stages = [new StageBuilder()];
        this.label = 1;
        this.materials = [];
    }

    withName(name) {
        this.name = name;
        return this;
    }

    withLabel(label) {
        this.label = label;
        return this;
    }

    withStage(stage) {
        this.stages = [stage];
        return this;
    }

    addStage(stage) {
        this.stages.push(stage);
        return this;
    }

    withMaterial(material) {
        this.materials = [material];
        return this;
    }

    addMaterial(material) {
        this.materials.push(material);
        return this;
    }

    build() {
        return {
            name: this.name,
            stages: this.stages.map(stage => stage.build()),
            label: this.label,
            materials: this.materials.map(material => material.build())
        }
    }
}

class PipelineSummaryBuilder {
    constructor() {
        this.name = "Dev";
        this.stages = [{name: "Build"}];
    }

    withName(name) {
        this.name = name;
    }

    withStage(stage) {
        this.stages = [{name: stage}];
        return this;
    }

    addStage(stage) {
        this.stages.push({name: stage});
        return this;
    }

    build() {
        return {
            name: this.name,
            stages: this.stages
        }
    }
}

class PipelineGroupBuilder {
    constructor() {
        this.name = "Application";
        this.pipelines = [new PipelineSummaryBuilder()]
    }

    withName(name) {
        this.name = name;
        return this;
    }

    addPipeline(pipeline) {
        this.pipelines.push(pipeline);
        return this;
    }

    withPipeline(pipeline) {
        this.pipelines = [pipeline];
        return this;
    }

    build() {
        return {
            name: this.name,
            pipelines: this.pipelines.map(pipeline => pipeline.build())
        }
    }
}

class PipelineGroupsBuilder {
    constructor() {
        this.groups = [new PipelineGroupBuilder()]
    }

    addGroup(group) {
        this.groups.push(group);
        return this;
    }

    withGroup(group) {
        this.groups = [group];
        return this;
    }


    build() {
        return this.groups.map(group => group.build())
    }
}

class MaterialBuilder {
    constructor() {
        this.description = "upstream-pipeline";
        this.type = "Pipeline";
    }

    withDescription(description) {
        this.description = description;
        return this;
    }

    withType(type) {
        this.type = type;
        return this;
    }

    build() {
        return {
            description: this.description,
            type: this.type
        }
    }
}

module.exports = {
    StageBuilder,
    PipelineBuilder,
    PipelineHistoryBuilder,
    PipelineSummaryBuilder,
    PipelineGroupBuilder,
    PipelineGroupsBuilder,
    MaterialBuilder
};

