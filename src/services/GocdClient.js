const request = require('request'),
      gocdClient = {};

const getGitUrlFromDescription = (description) => {
    const GIT_URL_REGEX = /URL: (.+\.git), Branch: .+/;
    let match = GIT_URL_REGEX.exec(description);
    return match ? match[1] : description;
};

const getRepoUrlFromDescription = (description) => {
    const RPM_URL_REGEX = /Repository: \[repo_url=(.+)] - Package: \[package_spec=.+\.\*]/;
    let match = RPM_URL_REGEX.exec(description);
    return match ? match[1] : description;
};

const getAllUpstreamPipelines = (materials) => {
    let upstreamPipelines = materials.filter(material => {
        return material.type === "Pipeline" || material.type === "Git" || material.type === "Package";
    }).map(material => {
        switch (material.type) {
            case "Pipeline":
                return {type: "pipeline", name: material.description};
            case "Git":
                return {type: "git", name: getGitUrlFromDescription(material.description)};
            case "Package":
                return {type: "package", name: getRepoUrlFromDescription(material.description)};
        }
    });

    if(upstreamPipelines.length > 1) {
        upstreamPipelines = upstreamPipelines.filter(material => {
            return material.type !== "git";
        });
    }

    return upstreamPipelines;
};

gocdClient.getPipelineStatus = (pipeline) => {
    return new Promise((resolve, reject) => {
        request
            .get('http://nebmgttgo01.ath.cdi.bskyb.com/go/api/pipelines/'+ pipeline +'/history', (error, response, body) => {
                if(!error && response.statusCode == 200) {
                    let pipelineResult = JSON.parse(body).pipelines[0];
                    if(pipelineResult) {
                        let lastStage = pipelineResult.stages.slice(-1).pop();
                        resolve({
                            "name": pipeline,
                            "status": lastStage.result,
                            "build-number": pipelineResult.label,
                        });
                    } else {
                        resolve({
                            "name": pipeline,
                            "status": "Unknown",
                            "build-number": -1,
                        })
                    }
                } else {
                    reject(error);
                }
            })
            .auth('nebapi', '1fe568jtxJPCmKJD', false)
    });
};

gocdClient.getAllPipelines = () => {
    return new Promise((resolve, reject) => {
        request
            .get('http://nebmgttgo01.ath.cdi.bskyb.com/go/api/config/pipeline_groups', (error, response, body) => {
                if(!error && response.statusCode == 200) {
                    let groups = JSON.parse(body);
                    if(groups && groups.length > 0) {
                        let pipelines = {};
                        groups.forEach(pipelineGroup => {
                            pipelines[pipelineGroup.name] = pipelineGroup.pipelines.map(pipeline => {
                                return {
                                    name: pipeline.name,
                                    upstream: getAllUpstreamPipelines(pipeline.materials)
                                }
                            });
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