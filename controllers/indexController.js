var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const Room = mongoose.model('Room');
const File = mongoose.model('File');
var fs = require('fs');
var atob = require('atob');
var Blob = require('blob');

var FilePond = require('filepond')

FilePond.setOptions({
    server: {
        chunkUploads: true
    }
});

router.get('/', (req, res) => {
    res.render("view/lobby", {
        viewTitle: "Lobby",
        layout: false
    });
});


router.post('/', (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    let method = req.body.method;
    let code;

    if(method == 'create'){
        var arr = [];
        Room.find((err, docs) => {
            for(var i =0; i<docs.length; i++){
                arr.push(docs[i].set);
            }

            var room = new Room();
            while(true){
                let hasExisted = false;
                code = Math.floor(Math.random() * 8999) + 1000; // returns a random integer from 1 to 100
                for(var i =0; i<arr.length; i++){
                    if(arr[i] == code){
                        hasExisted = true;
                        break;
                    }
                }
                if(!hasExisted) break;
            }

            room.code = code;
            room.password = password;
            room.save();
            res.redirect('/room?code=' + code + '&username=' +username);


        });
    }else if(method == 'join'){
        code = req.body.room;

        Room.findOne({code: code},(err, docs) => {
            if(docs){
                res.redirect('/room?code=' + code + '&username=' +username);
            }else{
                res.render("view/lobby", {
                    viewTitle: "Lobby",
                    code: code,
                    username : username,
                    method: method,
                    error: 'Room does not exist',
                    layout: false
                });
            }
        });
    }
});


router.get('/room', (req, res) => {
    let code = req.query.code;
    let username = req.query.username;

    Room.find({code: code}).populate('item')
        .exec(function (err, doc) {
            var arr = [];
            let length = doc[0].item.length;
            for(var i =0; i<length; i++){
                arr.push(doc[0].item[i])
            }
            res.render("view/room", {
                viewTitle: "Room",
                code: code,
                username : username,
                data: arr
            });

        });

});

router.post('/api', (req, res) => {
    let item = req.files.item;
    console.log(item.data.toString('base64'));

});

router.post('/upload', (req, res) => {
    let code = req.query.num;
    let expire = req.body.expire;

    switch(true){
        case(expire == "0"):
            expire = 86400;
            break;
        case(expire == "1"):
            expire = 10800;
            break;
        case(expire == "2"):
            expire = 86400;
            break;
        case(expire == "3"):
            expire = 259200;
            break;
    }

    let item = req.body.item;
    if(typeof item == "string"){
        let thing = req.files.item;
        console.log(thing);
        let upload =  JSON.parse(item);
        let data = "data:" + upload.type + ";charset=utf-8;base64," + upload.data.toString('base64');
        let type = upload.type;
        let name = upload.name;
        let size = upload.size;
        // saveData(data,name,expire,code,size);

    }else{
        for(var i =0; i<item.length; i++){
            let upload = JSON.parse(item[i]);
            let data = "data:" + upload.type + ";charset=utf-8;base64," + upload.data.toString('base64');
            let type = upload.type;
            let name = upload.name;
            let size = upload.size;
            saveData(data,name,expire,code,size);
        }
    }

    res.redirect('/room?code=' + code);


});



function urltoFile(url, filename, mimeType){
    return (fetch(url)
            .then(function(res){return res.arrayBuffer();})
            .then(function(buf){return new File([buf], filename,{type:mimeType});})
    );
}


//
router.get('/download/:id', (req,res) => {
    let id = req.params.id;
    File.findOne({_id: id}, function (err,file) {
        let mime = file.obj.split(',')[0].split(':')[1].split(';')[0];
        console.log(mime);

        let content = unescape(encodeURIComponent(file.obj.split(',')[1]));

        // content = new Buffer(content, 'base64');
        content = Buffer.from(content, 'base64');

        let temp = mime + ";charset=UTF-8";
        res.set('Content-Type', temp);

        console.log(file.name);

        try{
            res.set('Content-Disposition','attachment; filename=' + file.name );
        }catch{
        }

        res.send(content);

    });

});



router.delete('/download', (req,res) => {

    req.on('data', function (data) {
        obj = JSON.parse(data);

        let id = obj.id;
        let code = obj.code;


        File.deleteOne({ _id: id }, function (err) {
            if (err) return handleError(err);
        });

        Room.findOne({code: code}, function(err,doc){
            const index = doc.item.indexOf(id);
            doc.item.splice(index, 1);
            doc.save();
        });

        res.send('successed');


    });

});



//util functions
function getDate(){
    console.log(Date());
    var d = new Date().toString();
    let arr = d.split(" ");
    let res = "" + arr[1] + " " + arr[2] + ", " + arr[3];
    return res;
}

// Save data to DB
function saveData(data, name, expire,code,size){
    var file = new File();
    file.obj = data;
    file.name = name;
    file.createdAt.expires = expire.toString();
    file.date = Date();
    file.size = size;


    file.save(function (err, doc1){
        if(!err){
            Room.findOne({code: code}, function(err,doc2){
                doc2.item.push(doc1.id);
                doc2.save();
            });
        }
    });
}




module.exports = router;


