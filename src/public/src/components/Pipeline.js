import React from 'react';

const getStatusClass = (status) => {
    if(status === 'Passed') {
        return 'pipeline-success';
    } else if(status === 'Unknown') {
        return 'pipeline-unknown';
    } else {
        return 'pipeline-failed';
    }
};

const getClass = (status) => {
    return `${getStatusClass(status)} pipeline`;
};

const stripGroupName = (group, fullPipelineName) => {
    const replaceString = group+"-";
    return fullPipelineName.indexOf(replaceString) > -1 ? fullPipelineName.replace(replaceString, "") : fullPipelineName;
};

const Pipeline = ({pipeline, groupName}) => (
    <div className={getClass(pipeline.status)}>
        <p>{stripGroupName(groupName, pipeline.name)}{" "}{pipeline["build-number"]}</p>
    </div>
);

export default Pipeline;