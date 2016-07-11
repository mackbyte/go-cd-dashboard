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
    pipelineNames.forEach(function(pipelineName, index) {
        updatePipeline(pipelineName, groupName, index);
    });
}

function updatePipeline(pipelineName, groupName, order) {
    gocdClient.getPipelineStatus(pipelineName, function(state) {
        state.order = order;
        pipelinesState[groupName][pipelineName] = state;
    })
}

pipelinesService.getPipelines = function() {
    return pipelinesState;
};

pipelinesService.update();

function refresh() {
    setTimeout(function() {
        pipelinesService.update();
        refresh()
    }, 30000);
}
refresh();

module.exports = pipelinesService;