var gocdClient = require('./gocdClient'),
    Graph = require('../data/Graph'),
    pipelinesState = new Map(),
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

function getPipelineGraph(groupName, pipelineName) {
    if(pipelinesState.has(groupName)) {
        let pipelineGroup = pipelinesState.get(groupName);
        if(pipelineGroup.has(pipelineName)) {
            return pipelineGroup.get(pipelineName);
        } else {
            let pipelineGraph = new Graph();
            pipelineGroup.set(pipelineName, pipelineGraph);
            return pipelineGraph;
        }
    } else {
        let pipelineGraph = new Graph();
        let pipeline = new Map();
        pipeline.set(pipelineName, pipelineGraph);
        pipelinesState.set(groupName, pipeline);
        return pipelineGraph;
    }
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

function getPipelineData(pipeline) {
    return {
        "build-number": pipeline["build-number"],
        "name": pipeline.name,
        "status": pipeline.status
    };
}

function addPipelineToGraph(graph, pipelines, allLinks, name) {
    let pipeline = pipelines.filter(pl => {
        return pl.name === name;
    })[0];

    let pipelineLinks = getLinksForNode(allLinks, name);
    graph.addNode(pipeline.name, getPipelineData(pipeline), pipelineLinks);
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
                let pipelineGraph = getPipelineGraph(groupName, source.url);
                pipelineGraph.addSourceNode("GIT", {url: source.url}, source.links);
                source.links.forEach(link => {
                    addPipelineToGraph(pipelineGraph, pipelines, allLinks, link);
                });
            });
        });
}

pipelinesService.getPipelines = function() {
    let result = {};

    for(let [group, pipelines] of pipelinesState) {
        result[group] = {};
        for(let [name, graph] of pipelines) {
            result[group][name] = graph.toJson();
        }
    }
    return result;
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