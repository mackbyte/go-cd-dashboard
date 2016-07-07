var gocdClient = require('./gocdClient'),
    pipelinesState = {},
    pipelinesService = {};

pipelinesService.update = function() {
    gocdClient.getAllPipelines(function(pipelineGroups) {
        if(pipelineGroups) {
            for (var pipelineGroup in pipelineGroups) {
                var pipelines = pipelineGroups[pipelineGroup];
                for (var i = 0; i < pipelines.length; i++) {
                    gocdClient.getPipelineStatus(pipelines[i], function(pipelineStatus) {
                        if(!pipelinesState[pipelineGroup]) {
                            pipelinesState[pipelineGroup] = {}
                        }
                        pipelinesState[pipelineGroup][pipelines[i]] = pipelineStatus;
                    })
                }
            }
        }
    });
};

pipelinesService.getPipelines = function() {
    return pipelinesState;
};

pipelinesService.update();

module.exports = pipelinesService;