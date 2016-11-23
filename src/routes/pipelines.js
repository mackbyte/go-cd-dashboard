module.exports = function(io){
    const express = require('express'),
          router = express.Router(),
          pipelinesService = require('../services/PipelinesService')(io);

    pipelinesService.update();

    /* GET pipelines. */
    router.get('/', function(req, res) {
        res.json(pipelinesService.getPipelines());
    });

    return router;
};
