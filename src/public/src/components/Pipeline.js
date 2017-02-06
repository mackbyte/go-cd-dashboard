import React from 'react';
import { splitOnDashes } from '../util/NameFormatting';

const getStatusClass = (status) => {
    if(status === 'Passed') {
        return 'pipeline-success';
    } else if(status === 'Unknown') {
        return 'pipeline-unknown';
    } else if(status === 'NoHistory') {
        return 'pipeline-nohistory';
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

const formatBuildNumber = (buildNumber) => {
    if(isNaN(buildNumber)) {
        const RPM_LABEL_REGEX = /.+\.(\d+)-\d+\.noarch/;
        let match = RPM_LABEL_REGEX.exec(buildNumber);
        return match ? match[1] : buildNumber;
    } else if(buildNumber < 0) {
        return ''
    }
    return buildNumber;
};

const Pipeline = ({pipeline, groupName}) => (
    <div className={getClass(pipeline.status)}>
        <p>{splitOnDashes(stripGroupName(groupName, pipeline.name))}</p>
        <p>{formatBuildNumber(pipeline["build-number"])}</p>
    </div>
);

export default Pipeline;