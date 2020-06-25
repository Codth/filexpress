require('./models/db');
const exphbs = require('express-handlebars');
const bodyparser = require('body-parser');

var express = require('express');
var app = express();
var path = require('path');

var server = require('http').createServer(app);
var io = require('socket.io')(server);
global._io = io;

var port = process.env.PORT || 3000;
var router = express.Router();

server.listen(port, () => {
    console.log('Server listening at port %d', port);
});


const indexController = require('./controllers/indexController');

// Add static media to the express
app.use(express.static(__dirname + '/views/'));

app.use(bodyparser.urlencoded({
    extended: true
}));
app.use(bodyparser.json());
app.set('views', path.join(__dirname, '/views/'));
app.engine('hbs', exphbs({ extname: 'hbs', defaultLayout: 'mainLayout', layoutsDir: __dirname + '/views/layouts/' }));
app.set('view engine', 'hbs');
app.use('/', indexController);

// ---------------------- SOCKET. IO ----------------------------------------------------------------------------------

const SELECTIONS = [
    {
        name: 'rock',
        beats: 'scissor'
    },
    {
        name: 'paper',
        beats: 'rock'
    },
    {
        name: 'scissor',
        beats: 'paper'
    }
];

var room = [];

function setRoom(code,name,method,socket){
    let obj = {
        id:socket.id,
        name: name,
        choice: null
    };

    if((room.length==0) || (method == "create")){
        room.push({
            code: code,
            size: 1,
            call: 0,
            player1: obj
        });
    }else{

        for(var i =0; i<room.length; i++){
            if(room[i].code == code){
                room[i].size += 1;    // Increment Size of Room
                room[i]['player2'] = obj;
                break;
            }
        }
    }
}

function judge(a,b){
    for(var i =0; i< 3; i++){
        if( (SELECTIONS[i].name == a) && (SELECTIONS[i].beats == b)){
            // Player1 Won
            return 1;
        }else if ( (SELECTIONS[i].name == b) && (SELECTIONS[i].beats == a)){
            // Player2 Won
            return 2;
        }
    }
    // Tie
    return 3;
}



io.sockets.on('connection', function(socket) {
    // once a client has connected, we expect to get a ping from them saying what room they want to join

    // Global variable
    var timeleft = 15;
    var downloadTimer;


    socket.on('code', function(cipher) {
        let code = cipher[0];
        let name = cipher[1];
        let method = cipher[2];
        let time_left = cipher[3];

        socket.join(code);
        setRoom(code,name,method,socket);
        console.log(room);

        for(var i =0; i<room.length; i++){
            if(room[i].code == code){
                if(room[i].size == 2){
                    io.sockets.in(code).emit('start', code);
                }
            }
        }

        // io.sockets.in(code).emit('message', code);
    });


    socket.on('select', function(item) {
        let position;
        let code = Object.keys(io.sockets.adapter.sids[socket.id])[0];
        for(var i =0; i<room.length; i++){
            if(room[i].code == code)  position = i;
        }

        let cur = room[position];
        if(cur.player1.id == socket.id){
            cur.player1.choice = item;
            cur.call += 1;
        } else if(cur.player2.id == socket.id){
            cur.player2.choice = item;
            cur.call += 1;
        }

        // var timeleft = 15;
        downloadTimer = setInterval(function(){
            if(timeleft <= 0){

                if(cur.call < 2){
                    if(cur.player1.choice() == null){
                        // player1 Won
                        io.sockets.in(cur.code).emit('1', [cur.player1.name, cur.player1.choice,cur.player2.choice]);
                    }else{
                        // player2 Won
                        io.sockets.in(cur.code).emit('2', [cur.player2.name, cur.player2.choice,cur.player1.choice]);
                    }
                }


                clearInterval(downloadTimer);
                console.log('finish');
            } else {
                console.log(timeleft);
                if(cur.call == 2){
                    let result = judge(cur.player1.choice, cur.player2.choice);
                    console.log("result: " + result);
                    switch (true) {
                        case (result == 1):
                            io.sockets.in(cur.code).emit('result', [cur.player1.name, cur.player1.choice,cur.player2.choice]);
                            clearInterval(downloadTimer);
                            break;
                        case (result == 2):
                            io.sockets.in(cur.code).emit('result', [cur.player2.name, cur.player2.choice,cur.player1.choice]);
                            clearInterval(downloadTimer);
                            break;
                        case (result == 3):
                            io.sockets.in(cur.code).emit('result', ["", cur.player1.choice,cur.player2.choice]);
                            clearInterval(downloadTimer);
                            break;
                    }

                }

            }
            timeleft -= 1;
        }, 1000);





        console.log(room);
    });

});
















module.exports = io;
