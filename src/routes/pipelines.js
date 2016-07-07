var express = require('express');
var router = express.Router();
var pipelinesService = require('../services/pipelinesService');

/* GET pipelines. */
router.get('/', function(req, res) {
    res.json(pipelinesService.getPipelines());
});

module.exports = router;
