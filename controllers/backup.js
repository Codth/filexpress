var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const Room = mongoose.model('Room');
const File = mongoose.model('File');
var fs = require('fs');
var atob = require('atob');
var Blob = require('blob');

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
            res.render("view/room", {
                viewTitle: "Room",
                code: code,
                username : username,
                method: method
            });
        });
    }else if(method == 'join'){
        code = req.body.room;
        Room.findOne({code: code},(err, docs) => {
            if(docs){

                Room.find({code: code}).populate('item', 'id name date size')
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
                            method: method,
                            data: arr
                        });

                    });







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


router.post('/room', (req, res) => {
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

    item = req.body.item;
    if(typeof item == "string"){
        let upload = JSON.parse(req.body.item);
        // let data = "data:" + upload.type + ";charset=utf-8;base64," + upload.data.toString('base64');
        let data = upload;
        let type = upload.type;
        let name = upload.name;
        let size = upload.size;
        saveData(data,name,expire,code,size);
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
});

function dataURItoBlob(dataURI) {
    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
    else
        byteString = unescape(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], {type:mimeString});
}
//
//
router.get('/download/:id', (req,res) => {
    let id = req.params.id;
    File.findOne({_id: id}, function (err,file) {
        res.set('Content-Type','text/plain');
        res.set('Content-Disposition','attachment; filename=' + file.name );
        res.set('Content-Length',file.size);

        let content = Buffer.from(file.obj.split(',')[1], 'base64').toString()
        res.send();
    });

});


// router.post('/download', (req,res) => {
//     req.on('data',function(data) {
//         obj=JSON.parse(data);
//         let id =obj.id;
//
//         File.findOne({_id: id}, function (err,file) {
//             // var stream = fs.createWriteStream(file.name, {flags: 'a'});
//             // var data = file.obj;
//             // stream.write(data, function() {
//             //     // Now the data has been written.
//             // });
//             res.send(file.obj);
//
//         });
//
//     });
//
// });
//
// router.get('/route', (req, res) => {
//
//
//     File.findOne({_id: res.body }, function (err,file) {
//
//         res.send(file.obj);
//
//     });
//     //
//     // fs.readFile('./myPDF.pdf', (err, data) => {
//     //     if (err) res.status(500).send(err);
//     //     res.contentType('application/pdf')
//     //         .send(`data:application/pdf;base64,${new Buffer.from(data).toString('base64')}`);
//     // });
//
// });
//



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


