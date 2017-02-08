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

const formatStageName = (name) => {
    const STAGE_NAME_REGEX = /.+-(.+)/;
    let match = STAGE_NAME_REGEX.exec(name);
    return match ? match[1] : name;
};

const renderStages = (stages) => {
    if(stages.length > 1) {
        return (<div className="stages">
            {stages.map((stage, index) => (<div key={index} className={`${getStatusClass(stage.result)} stage`}>{formatStageName(stage.name)}</div>))}
        </div>)
    }
};

const Pipeline = ({pipeline, groupName}) => (
    <div className={getClass(pipeline.status)}>
        <div className="pipeline-name">{splitOnDashes(stripGroupName(groupName, pipeline.name))}</div>
        <div className="pipeline-number">{formatBuildNumber(pipeline["build-number"])}</div>
        {renderStages(pipeline.stages)}
    </div>
);

export default Pipeline;