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

const Pipeline = ({pipeline}) => {
    console.log(pipeline);
    return (
    <div className={getClass(pipeline.status)}>
        <p>{pipeline.name}{" "}{pipeline["build-number"]}</p>
    </div>
)};

export default Pipeline;