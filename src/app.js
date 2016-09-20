let express = require('express'),
    path = require('path'),
    index = require('./routes/index'),
    pipelines = require('./routes/pipelines'),
    app = express();

app.use('/static', express.static(path.join(__dirname, 'public/build/static')));

app.use('/', index);
app.use('/pipelines', pipelines);

module.exports = app;
