var Graph = function() {
    this.nodes = {};
    this.source = undefined;
};

Graph.prototype.getNodes = function() {
    return Object.keys(this.nodes);
};

Graph.prototype.getNode = function(id) {
    return this.nodes[id];
};

Graph.prototype.getLinks = function(id) {
    if(this.nodes.hasOwnProperty(id)) {
        return this.nodes[id].links;
    }
};

function createNodesThatDontExist(graph, links) {
    links.forEach(function(link) {
        if(!graph.nodes.hasOwnProperty(link)) {
            graph.addNode(link, {});
        }
    });
}

Graph.prototype.addLinks = function(id, links) {
    if(this.nodes.hasOwnProperty(id)) {
        createNodesThatDontExist(this, links);
        var node = this.nodes[id];
        links.forEach(function(link) {
            if(node.links.indexOf(link) < 0) {
               node.links.push(link);
            }
        })
    }
};

Graph.prototype.addData = function(id, newData) {
    if(this.nodes.hasOwnProperty(id)) {
        let currentData = this.nodes[id].data;
        Object.assign(currentData, newData);
    }
};

Graph.prototype.addNode = function(id, data, links) {
    if(links) {
        createNodesThatDontExist(this, links);
    }

    if(this.nodes[id]) {
        this.nodes[id] = {
            data: data,
            links: links || this.nodes[id].links
        }
    } else {
        this.nodes[id] = {
            data: data,
            links: links || []
        }
    }
};

Graph.prototype.removeNode = function(id) {
    for(var nodeId in this.nodes) {
        var node = this.nodes[nodeId];
        var idx = node.links.indexOf(id);
        if(idx > -1) {
            node.links.splice(idx, 1);
        }
    }

    delete this.nodes[id];
};

Graph.prototype.breadthFirstSearch = function(origin) {
    var result = [origin];
    var queue = [origin];
    while(queue.length > 0) {
        this.nodes[queue.shift()].links.sort().forEach(function(link) {
            if(result.indexOf(link) < 0) {
                result.push(link);
                queue.push(link);
            }
        });
    }

    return result;
};

Graph.prototype.size = function() {
    return Object.keys(this.nodes).length;
};

Graph.prototype.addSourceNode = function(id, data, links) {
    this.addNode(id, data, links);
    this.source = id;
};

Graph.prototype.getSource = function() {
    return this.source;
};

Graph.prototype.toJson = function() {
    return {
        nodes: JSON.parse(JSON.stringify(this.nodes)),
        source: this.source
    }
};

Graph.prototype.fromJson = function(graph) {
    this.nodes = JSON.parse(JSON.stringify(graph.nodes));
    this.source = graph.source;
};

module.exports = Graph;
