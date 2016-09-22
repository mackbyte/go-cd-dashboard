let express = require('express'),
    path = require('path'),
    bodyParser = require('body-parser'),
    index = require('./routes/index'),
    pipelines = require('./routes/pipelines'),
    app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/static', express.static(path.join(__dirname, 'public/build/static')));

app.use('/', index);
app.use('/api/pipelines', pipelines);

module.exports = app;
