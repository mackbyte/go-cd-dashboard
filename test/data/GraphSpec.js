var should = require('chai').should(),
    Graph = require('../../src/data/Graph');

describe("Graph", function() {
    var graph;
    beforeEach(function() {
        graph = new Graph();
    });

    describe("getNodes", function() {
        it("should return empty list if there are no nodes", function() {
            graph.getNodes().should.be.empty;
        });

        it("should return list of node ids when there are some available", function() {
            graph.addNode("a", {}, []);
            graph.addNode("b", {}, []);

            graph.getNodes().should.have.members(["a", "b"])
        });
    });

    describe("getNode", function() {
        it("should return node with given id", function() {
            graph.addNode("id", {"name": "George","age": 25}, ["another", "one-more"]);

            graph.getNode("id").should.deep.equal({
                "data": {"name": "George", "age": 25},
                "links": ["another", "one-more"]
            })
        });

        it("should return undefined for non existant id", function() {
            should.equal(graph.getNode("unknown"), undefined);
        });
    });

    describe("getLinks", function() {
        it("should return all ids of nodes that are linked to this node", function() {
            graph.addNode("a", {}, ["b", "c", "d"]);

            graph.getLinks("a").should.have.members(["b", "c", "d"])
        });

        it("should return empty list if node is not linked to any other node", function() {
            graph.addNode("b", {},[]);

            graph.getLinks("b").should.be.empty;
        });

        it("should return undefined if node id does not exist in graph", function() {
            should.equal(graph.getLinks("c"), undefined);
        });
    });

    describe("addNode", function() {
        it("should add node to graph with given id and data", function() {
            graph.addNode("a", {"some": "value"}, ["b", "c"]);

            graph.getNode("a").should.deep.equal({
                "data": {"some":"value"},
                "links": ["b","c"]
            });
        });

        it("should update node if id already present in graph", function() {
            graph.addNode("a", {"some": "value"}, ["b", "c"]);
            graph.addNode("a", {"new": "updated-value"}, ["d", "e"]);

            graph.getNode("a").should.deep.equal({
                "data": {"new": "updated-value"},
                "links": ["d", "e"]
            });
        });

        it("should create empty nodes for links if not already specified", function() {
            graph.addNode("a", {"some": "value"}, ["b","c"]);

            graph.getNodes().should.have.members(["a", "b", "c"]);
            graph.getNode("b").should.deep.equal({
                data: {},
                links: []
            });
            graph.getNode("c").should.deep.equal({
                data: {},
                links: []
            });
        });

        it("should not update linked node if already exists", function() {
            graph.addNode("a", {"dont": "update"}, ["c"]);
            graph.addNode("b", {}, ["a"]);

            graph.getNode("a").should.deep.equal({
                data: {"dont": "update"},
                links: ["c"]
            });
        });
    });

    describe("removeNode", function() {
        it("should remove node with given id", function() {
            graph.addNode("a", {}, []);
            graph.removeNode("a");

            should.equal(graph.getNode("a"), undefined);
        });

        it("should do nothing if id does not exist", function() {
            graph.addNode("a", {}, []);
            graph.removeNode("b");

            graph.getNodes().should.have.members(["a"]);
        });

        it("should remove all links to the removed node", function() {
            graph.addNode("a", {}, ["c"]);
            graph.addNode("b", {}, ["c"]);
            graph.removeNode("c");

            graph.getNodes().should.have.members(["a", "b"]);
            graph.getNode("a").should.deep.equal({
                data: {},
                links: []
            });

            graph.getNode("b").should.deep.equal({
                data: {},
                links: []
            });
        });
    });
});
