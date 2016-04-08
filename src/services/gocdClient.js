var rp = require('request-promise');

var goCdClient = {};
pipelines = {};

goCdClient.refresh = function() {
    rp({
        uri: 'http://nebapi:1fe568jtxJPCmKJD@nebmgttgo01.ath.cdi.bskyb.com/go/api/config/pipeline_groups',
        json: true
    }).then(function(res) {
        res.forEach(function(pipelineGroup) {
            pipelineGroup.pipelines.forEach(function(pipeline) {
                pipelines[pipeline.name] = {};
                pipeline.stages.forEach(function(stage) {
                    rp({
                        uri: 'http://nebapi:1fe568jtxJPCmKJD@nebmgttgo01.ath.cdi.bskyb.com/go/api/stages/'+ pipeline.name +'/'+ stage.name +'/history',
                        json: true
                    }).then(function(resp) {
                        var stageResult = resp.stages[0];
                        if(stageResult) {
                            pipelines[pipeline.name][stageResult.name] = {
                                success: stageResult.result == 'Passed',
                                build_number: stageResult.pipeline_counter
                            };
                        }
                    })
                })
            });
        });
    });
}();

goCdClient.getPipelines = function() {
    return pipelines;    
};

module.exports = goCdClient;