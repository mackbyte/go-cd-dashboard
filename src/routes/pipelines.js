var express = require('express');
var router = express.Router();
var gocdClient = require('../services/gocdClient');

/* GET pipelines. */
router.get('/', function(req, res) {
    res.json(gocdClient.getPipelines());
});

module.exports = router;
