let express = require('express'),
    path = require('path'),
    bodyParser = require('body-parser'),
    index = require('./routes/index'),
    app = express();

app.io = require('socket.io')();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/static', express.static(path.join(__dirname, 'public/build/static')));

app.use('/', index);
app.use('/api/pipelines', require('./routes/pipelines')(app.io));

module.exports = app;
