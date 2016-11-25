import React from 'react';
import Graph from '../../../../src/data/Graph';
import Pipeline from './Pipeline';
import { splitOnDashes } from '../util/NameFormatting';

const PipelineGroup = ({name, group}) => (
    <div className="pipeline-group">
        <div className="pipeline-group-name">
            {splitOnDashes(name)}
        </div>
        {Object.keys(group).map((source, index) => {
            const graph = new Graph();
            graph.fromJson(group[source]);
            const [, ...pipelines] = graph.breadthFirstSearch(graph.getSource());
            return (
                <div className="pipeline-container" key={index}>
                    {pipelines.map((pipelineName, index) =>
                        <Pipeline key={index} pipeline={graph.getNode(pipelineName).data} groupName={name}/>
                    )}
                </div>
            )}
        )}
    </div>
);

export default PipelineGroup;