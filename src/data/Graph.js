class Graph {
    constructor() {
        this.nodes = {};
        this.source = undefined;
    }

    getNodes() {
        return Object.keys(this.nodes);
    }

    getNode(id) {
        return this.nodes[id];
    }

    getLinks(id) {
        if(this.nodes.hasOwnProperty(id)) {
            return this.nodes[id].links;
        }
    }

    _createNodesThatDontExist(graph, links) {
        links.forEach(link => {
            if(!graph.nodes.hasOwnProperty(link)) {
                graph.addNode(link, {});
            }
        });
    }

    addLinks(id, links) {
        if(this.nodes.hasOwnProperty(id)) {
            this._createNodesThatDontExist(this, links);
            let node = this.nodes[id];
            links.forEach(link => {
                if(node.links.indexOf(link) < 0) {
                    node.links.push(link);
                }
            });
        }
    }

    addData(id, newData) {
        if(this.nodes.hasOwnProperty(id)) {
            let currentData = this.nodes[id].data;
            Object.assign(currentData, newData);
        }
    }

    addNode(id, data, links) {
        if(links) {
            this._createNodesThatDontExist(this, links);
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
    }

    removeNode(id) {
        for (let nodeId in this.nodes) {
            let node = this.nodes[nodeId],
                idx = node.links.indexOf(id);

            if(idx > -1) {
                node.links.splice(idx, 1);
            }
        }

        delete this.nodes[id];
    }

    breadthFirstSearch(origin) {
        let result = [origin],
            queue = [origin];

        while (queue.length > 0) {
            this.nodes[queue.shift()].links.sort().forEach(link => {
                if(result.indexOf(link) < 0) {
                    result.push(link);
                    queue.push(link);
                }
            });
        }

        return result;
    }

    size() {
        return Object.keys(this.nodes).length;
    }

    addSourceNode(id, data, links) {
        this.addNode(id, data, links);
        this.source = id;
    }

    getSource() {
        return this.source;
    }

    toJson() {
        return {
            nodes: JSON.parse(JSON.stringify(this.nodes)),
            source: this.source
        }
    }

    fromJson(graph) {
        this.nodes = JSON.parse(JSON.stringify(graph.nodes));
        this.source = graph.source;
    }
}

module.exports = Graph;
