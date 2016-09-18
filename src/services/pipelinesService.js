var gocdClient = require('./gocdClient'),
    Graph = require('../data/Graph'),
    pipelinesState = {},
    pipelinesService = {};

pipelinesService.update = function() {
    gocdClient.getAllPipelines()
        .then(function(pipelineGroups) {
            for (var groupName in pipelineGroups) {
                updatePipelineGroup(groupName, pipelineGroups[groupName]);
            }
        });
};

function getUniqueGitSources(pipelines) {
    let uniqueGitSourceNodes = {};
    pipelines.forEach(pipeline => {
        pipeline.upstream.forEach(dependency => {
            if(dependency.type === 'git') {
                if(uniqueGitSourceNodes.hasOwnProperty(dependency.name)) {
                    uniqueGitSourceNodes[dependency.name].links.push(pipeline.name);
                } else {
                    uniqueGitSourceNodes[dependency.name] = {
                        links: [pipeline.name]
                    }
                }
            }
        });
    });

    return Object.keys(uniqueGitSourceNodes).map(gitUrl => {
        return {url: gitUrl, links: uniqueGitSourceNodes[gitUrl].links}
    })
}

function getPipelineGraph(name) {
    if(!pipelinesState[name]) {
        pipelinesState[name] = new Graph();
    }
    return pipelinesState[name];
}

// Must remove unneeded links to build stage (stage after git)
function getInvertedLinks(pipelines, sourceLinks) {
    let links = [];
    pipelines.forEach(pipeline => {
        if(pipeline.upstream.length > 1) {
            pipeline.upstream.forEach(upstreamLink => {
                if(sourceLinks.indexOf(upstreamLink.name) < 0) {
                    links.push({from: upstreamLink.name, to: pipeline.name});
                }
            });
        } else {
            pipeline.upstream.forEach(upstreamLink => {
                links.push({from: upstreamLink.name, to: pipeline.name});
            })
        }
    });
    return links;
}

function getLinksForNode(links, node) {
    return links.filter(link => {
        return link.from === node;
    }).map(nodeLink => {
        return nodeLink.to;
    });
}

function addPipelineToGraph(graph, pipelines, allLinks, name) {
    let pipeline = pipelines.filter(pl => {
        return pl.name === name;
    })[0];

    let pipelineLinks = getLinksForNode(allLinks, name);
    graph.addNode(pipeline.name, pipeline, pipelineLinks);
    pipelineLinks.forEach(link => {
        addPipelineToGraph(graph, pipelines, allLinks, link);
    });
}

function getSourceLinks(sources) {
    let sourceLinks = [];
    sources.forEach(source => {
        source.links.forEach(link => {
            sourceLinks.push(link);
        })
    });
    return sourceLinks;
}

function updatePipelineGroup(groupName, pipelineNames) {
    let pipelineRequests = pipelineNames.map(pipelineName => {
        return gocdClient.getPipelineStatus(pipelineName);
    });

    Promise.all(pipelineRequests)
        .then(pipelines => {
            let sources = getUniqueGitSources(pipelines);
            let sourceLinks = getSourceLinks(sources);
            let allLinks = getInvertedLinks(pipelines, sourceLinks);

            sources.forEach(source => {
                let pipelineGraph = getPipelineGraph(groupName);
                pipelineGraph.addSourceNode("GIT", {url: source.url}, source.links);
                source.links.forEach(link => {
                    addPipelineToGraph(pipelineGraph, pipelines, allLinks, link);
                });
            });
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