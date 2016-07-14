var Graph = function() {
    this.nodes = {};
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


Graph.prototype.addNode = function(id, data, links) {
    var graph = this;
    links.forEach(function(link) {
        if(!graph.nodes.hasOwnProperty(link)) {
            graph.addNode(link, {}, []);
        }
    });

    this.nodes[id] = {
        data: data,
        links: links
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

module.exports = Graph;
