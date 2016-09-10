var request = require('request');

var gocdClient = {};

function getAllUpstreamPipelines(material_revisions) {
    var materials = material_revisions.filter(function(mat_rev) {
        return mat_rev.material.type === "Pipeline" || mat_rev.material.type === "Git";
    }).map(function(mat_rev) {
        if(mat_rev.material.type == "Pipeline") {
            return mat_rev.material.description;
        } else {
            return "GIT"
        }
    });

    if(materials.length > 1 && materials.indexOf("GIT") > -1) {
        materials.splice(materials.indexOf("GIT"), 1);
    }

    return materials;
}

gocdClient.getPipelineStatus = function(pipeline) {
    return new Promise(function(resolve, reject) {
        request
            .get('http://nebmgttgo01.ath.cdi.bskyb.com/go/api/pipelines/'+ pipeline +'/history', function(error, response, body) {
                if(!error && response.statusCode == 200) {
                    var pipelineResult = JSON.parse(body).pipelines[0];
                    if(pipelineResult) {
                        var lastStage = pipelineResult.stages.slice(-1).pop();
                        resolve({
                            "name": pipeline,
                            "status": lastStage.result,
                            "build-number": pipelineResult.counter,
                            "upstream": getAllUpstreamPipelines(pipelineResult.build_cause.material_revisions)
                        });
                    }
                } else {
                    reject(error);
                }
            })
            .auth('nebapi', '1fe568jtxJPCmKJD', false)
    });
};

gocdClient.getAllPipelines = function() {
    return new Promise(function(resolve, reject) {
        request
            .get('http://nebmgttgo01.ath.cdi.bskyb.com/go/api/config/pipeline_groups', function(error, response, body) {
                if(!error && response.statusCode == 200) {
                    var groups = JSON.parse(body);
                    if(groups && groups.length > 0) {
                        var pipelines = {};
                        groups.forEach(function(pipelineGroup) {
                            pipelines[pipelineGroup.name] = pipelineGroup.pipelines.map(function(pipeline) {return pipeline.name;})
                        });
                        resolve(pipelines);
                    } else {
                        reject({message: "No groups found"});
                    }
                } else {
                    reject(error);
                }
            })
            .auth('nebapi', '1fe568jtxJPCmKJD', false)
    });
};

module.exports = gocdClient;