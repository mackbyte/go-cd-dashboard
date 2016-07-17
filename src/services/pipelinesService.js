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

/*
* Only use links to source node when there are no others available otherwise the extra links which
* cause searching issues. This is because every pipeline has an upstream dependency of the build phase.
* NOTE: Currently assumes no node links to multiple sources.
*/
function getActualUpstream(links, sources) {
    if(links.indexOf('GIT') < 0 && sources.length === 0) {return [];}
    if(links.length === 1) {return links;}

    return links.filter(function(link) {
        return sources.indexOf(link) < 0
    })
}

function insertPipeline(group, pipelineName, pipeline) {
    group.addNode(pipelineName, pipeline);
    var pipelineSourceNodes = getPipelineSourceNodes(group);
    getActualUpstream(pipeline.upstream, pipelineSourceNodes).forEach(function(dependency) {
        if(!group.getNode(dependency)) {
            group.addNode(dependency, {})
        }
        group.addLinks(dependency, [pipelineName])
    });
}

function getPipelineSourceNodes(pipelineGraph) {
    if(pipelineGraph.nodes.hasOwnProperty("GIT")) {
        return pipelineGraph.nodes.GIT.links;
    }
    return [];
}

pipelinesService.getPipelines = function() {
    var pipelines = {};
    for (var groupName in pipelinesState) {
        var pipelineGraph = pipelinesState[groupName];
        var sources = getPipelineSourceNodes(pipelineGraph);
        sources.forEach(function(source) {
            var result = pipelineGraph.breadthFirstSearch(source);
            pipelines[groupName] = pipelines[groupName] || {};
            result.forEach(function(node, index) {
                var pipeline = pipelineGraph.getNode(node);
                pipelines[groupName][node] = {
                    "order": index,
                    "build-number": pipeline.data["build-number"],
                    "status": pipeline.data.status
                };
            });
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