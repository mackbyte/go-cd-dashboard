var gocdClient = require('./gocdClient'),
    pipelinesState = {},
    pipelinesService = {};

pipelinesService.update = function() {
    gocdClient.getAllPipelines(function(pipelineGroups) {
        if(pipelineGroups) {
            for (var groupName in pipelineGroups) {
                updatePipelineGroup(groupName, pipelineGroups[groupName]);
            }
        }
    });
};

function initialiseGroup(groupName) {
    if(!pipelinesState[groupName]) {
        pipelinesState[groupName] = {}
    }
}

function updatePipelineGroup(groupName, pipelineNames) {
    initialiseGroup(groupName);
    for (var i = 0; i < pipelineNames.length; i++) {
        updatePipeline(pipelineNames[i], groupName);
    }
}

function updatePipeline(pipelineName, groupName) {
    gocdClient.getPipelineStatus(pipelineName, function(state) {
        pipelinesState[groupName][pipelineName] = state;
    })
}

pipelinesService.getPipelines = function() {
    return pipelinesState;
};

pipelinesService.update();

module.exports = pipelinesService;