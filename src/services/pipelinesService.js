var gocdClient = require('./gocdClient'),
    Graph = require('../data/Graph'),
    pipelinesState = {},
    pipelinesService = {};

pipelinesService.update = function() {
    gocdClient.getAllPipelines(function(pipelineGroups) {
        if(pipelineGroups) {
            for (var groupName in pipelineGroups) {
                updatePipelineGroup(groupName, pipelineGroups[groupName]);
            }
        }
    });
};

function initialiseGroup(groupName) {
    if(!pipelinesState[groupName]) {
        pipelinesState[groupName] = new Graph();
    }
}

function updatePipelineGroup(groupName, pipelineNames) {
    initialiseGroup(groupName);
    pipelineNames.forEach(function(pipelineName) {
        updatePipeline(pipelineName, groupName);
    });
}

function updatePipeline(pipelineName, groupName) {
    gocdClient.getPipelineStatus(pipelineName, function(state) {
        insertPipeline(pipelinesState[groupName], pipelineName, state)
    })
}

function insertPipeline(group, pipelineName, pipeline) {
    group.addNode(pipelineName, pipeline, pipeline.upstream);
}

function getPipelineSource(pipelineGraph) {
    for (var pipelineName in pipelineGraph.nodes) {
        if(pipelineGraph.nodes[pipelineName].links.length == 0) {
            return pipelineName;
        }
    }
}

pipelinesService.getPipelines = function() {
    var pipelines = {};
    for (var groupName in pipelinesState) {
        var pipelineGraph = pipelinesState[groupName];
        var origin = getPipelineSource(pipelineGraph);
        var result = [origin];
        var queue = [];

        pipelineGraph.getNodes().sort().forEach(function(node) {
            var links = pipelineGraph.nodes[node].links.sort();

            if(links.length === 1 && links.indexOf(origin) > -1) {
                result.push(node);
                queue.push(node);
            }
        });

        while (queue.length > 0) {
            var current = queue.shift();
            pipelineGraph.getNodes().sort().forEach(function(node) {
                var links = pipelineGraph.nodes[node].links.sort();

                if(links.indexOf(current) > -1 && result.indexOf(node) < 0) {
                    result.push(node);
                    queue.push(node);
                }
            });
        }

        pipelines[groupName] = {};
        result.forEach(function(node, index) {
            var pipeline = pipelineGraph.getNode(node);
            pipelines[groupName][node] = {
                "order": index,
                "build-number": pipeline.data["build-number"],
                "status": pipeline.data.status
            };
        });
    }
    return pipelines;
};

pipelinesService.update();

function refresh() {
    setTimeout(function() {
        pipelinesService.update();
        refresh()
    }, 30000);
}
refresh();

module.exports = pipelinesService;