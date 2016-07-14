var request = require('request');

var gocdClient = {};

function getAllUpstreamPipelines(material_revisions) {
    return material_revisions.filter(function(mat_rev) {
        return mat_rev.material.type == "Pipeline";
    }).map(function(mat_rev) {
        return mat_rev.material.description;
    })
}

gocdClient.getPipelineStatus = function(pipeline, callback) {
    request
        .get('http://nebmgttgo01.ath.cdi.bskyb.com/go/api/pipelines/'+ pipeline +'/history', function(error, response, body) {
            if(!error && response.statusCode == 200) {
                var pipelineResult = JSON.parse(body).pipelines[0];
                if(pipelineResult) {
                    var lastStage = pipelineResult.stages.slice(-1).pop();
                    callback({
                        "status": lastStage.result,
                        "build-number": pipelineResult.counter,
                        "upstream": getAllUpstreamPipelines(pipelineResult.build_cause.material_revisions)
                    });
                }
            } else {
                callback(null);
            }
        })
        .auth('nebapi', '1fe568jtxJPCmKJD', false)
};

gocdClient.getAllPipelines = function(callback) {
    request
        .get('http://nebmgttgo01.ath.cdi.bskyb.com/go/api/config/pipeline_groups', function(error, response, body) {
            if(!error && response.statusCode == 200) {
                var groups = JSON.parse(body);
                if(groups && groups.length > 0) {
                    var pipelines = {};
                    groups.forEach(function(pipelineGroup) {
                        pipelines[pipelineGroup.name] = pipelineGroup.pipelines.map(function(pipeline) {return pipeline.name;})
                    });
                    callback(pipelines);
                } else {
                    callback(null);
                }
            } else {
                callback(null);
            }
        })
        .auth('nebapi', '1fe568jtxJPCmKJD', false)
};

module.exports = gocdClient;