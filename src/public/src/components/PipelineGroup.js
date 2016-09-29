import React from 'react';
import Graph from './Graph';
import Pipeline from './Pipeline';

const PipelineGroup = ({name, group}) => (
    <div className="pipeline-group">
        <div className="pipeline-group-name">
            {name}
        </div>
        {Object.keys(group).map((source, index) => {
            const graph = new Graph();
            graph.fromJson(group[source]);
            const [, ...pipelines] = graph.breadthFirstSearch(graph.getSource());
            return (
                <div className="pipeline-container" key={index}>
                    {pipelines.map((pipelineName, index) =>
                        <Pipeline key={index} pipeline={graph.getNode(pipelineName).data}/>
                    )}
                </div>
            )}
        )}
    </div>
);

export default PipelineGroup;