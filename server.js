require('./models/db');
const exphbs = require('express-handlebars');
const bodyparser = require('body-parser');

var express = require('express');
var app = express();
var path = require('path');

var server = require('http').createServer(app);
var port = process.env.PORT || 3000;
var router = express.Router();
const fileUpload = require('express-fileupload');



server.listen(port, () => {
    console.log('Server listening at port %d', port);
});


const indexController = require('./controllers/indexController');

// Add static media to the express
app.use(express.static(__dirname + '/views/'));
app.use(fileUpload());
app.use(bodyparser.urlencoded({
    extended: true
}));
app.use(bodyparser.json());
app.set('views', path.join(__dirname, '/views/'));
app.engine('hbs', exphbs({ extname: 'hbs', defaultLayout: 'mainLayout', layoutsDir: __dirname + '/views/layouts/' }));
app.set('view engine', 'hbs');
app.use('/', indexController);
