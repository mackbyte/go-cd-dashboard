const request = require('request'),
      gocdClient = {};

function getGitUrlFromDescription(description) {
    const GIT_URL_REGEX = /URL: (.+\.git), Branch: .+/;
    let match = GIT_URL_REGEX.exec(description);
    return match ? match[1] : description;
}

function getRepoUrlFromDescription(description) {
    const RPM_URL_REGEX = /Repository: \[repo_url=(.+)] - Package: \[package_spec=.+\.\*]/;
    let match = RPM_URL_REGEX.exec(description);
    return match ? match[1] : description;
}

function getAllUpstreamPipelines(material_revisions) {
    let materials = material_revisions.filter(function(mat_rev) {
        return mat_rev.material.type === "Pipeline" || mat_rev.material.type === "Git" || mat_rev.material.type === "Package";
    }).map(function(mat_rev) {
        switch (mat_rev.material.type) {
            case "Pipeline":
                return {type: "pipeline", name: mat_rev.material.description};
            case "Git":
                return {type: "git", name: getGitUrlFromDescription(mat_rev.material.description)};
            case "Package":
                return {type: "package", name: getRepoUrlFromDescription(mat_rev.material.description)};
        }
    });

    if(materials.length > 1) {
        materials = materials.filter(material => {
            return material.type !== "git";
        })
    }

    return materials;
}

gocdClient.getPipelineStatus = function(pipeline) {
    return new Promise(function(resolve, reject) {
        request
            .get('http://nebmgttgo01.ath.cdi.bskyb.com/go/api/pipelines/'+ pipeline +'/history', function(error, response, body) {
                if(!error && response.statusCode == 200) {
                    let pipelineResult = JSON.parse(body).pipelines[0];
                    if(pipelineResult) {
                        let lastStage = pipelineResult.stages.slice(-1).pop();
                        resolve({
                            "name": pipeline,
                            "status": lastStage.result,
                            "build-number": pipelineResult.label,
                            "upstream": getAllUpstreamPipelines(pipelineResult.build_cause.material_revisions)
                        });
                    } else {
                        resolve({
                            "name": pipeline,
                            "status": "Unknown",
                            "build-number": -1,
                            "upstream": []
                        })
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
                    let groups = JSON.parse(body);
                    if(groups && groups.length > 0) {
                        let pipelines = {};
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