var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const Room = mongoose.model('Room');
const File = mongoose.model('File');


const bcrypt = require('bcryptjs');
const passport = require('passport');
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');

var Readable = require('stream').Readable;


const AWS = require('aws-sdk');
var s3 = new AWS.S3();




router.get('/',  forwardAuthenticated, (req, res) => {
    res.render("view/lobby", {
        viewTitle: "Lobby",
        layout: false,
        indicator: false
    });
});


router.post('/', (req, res,next) => {
    let username = req.body.username;
    let password;

    if (req.body.password) {
        password = req.body.password;
        let code = req.body.username;

        passport.authenticate('local', {
            successRedirect: '/room',
            failureRedirect: '/users/login',
            failureFlash: true
        })(req, res, next);


    } else {
        let password = req.body.password_create;
        let code;

        var arr = [];
        Room.find((err, docs) => {
            for (var i = 0; i < docs.length; i++) {
                arr.push(docs[i].set);
            }

            while (true) {
                let hasExisted = false;
                code = Math.floor(Math.random() * 8999) + 1000; // returns a random integer from 1 to 100
                for (var i = 0; i < arr.length; i++) {
                    if (arr[i] == code) {
                        hasExisted = true;
                        break;
                    }
                }
                if (!hasExisted) break;
            }

            var room = new Room();
            room.code = code;
            room.password = password;

            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(room.password, salt, (err, hash) => {
                    if (err) throw err;
                    room.password = hash;
                    room.save();
                });
            });

            res.render("view/lobby", {
                viewTitle: "Lobby",
                layout: false,
                username: code,
                password: password,
                indicator: true
            });




        });
    }

});





router.get('/room', ensureAuthenticated, (req, res) => {
    let code = req.user.code;
    let username = req.query.username;

    Room.find({code: code}).populate('item')
        .exec(function (err, doc) {
            console.log(doc)
            var arr = [];
            if(doc.length != 0){
                let length = doc[0].item.length;
                for(var i =0; i<length; i++){
                    arr.push(doc[0].item[i])
                }
            }
            res.render("view/room", {
                viewTitle: "Room",
                code: code,
                username : username,
                data: arr
            });

        });

});


router.post('/api', async (req, res) => {
    let code = req.user.code;

    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

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

    Object.keys(req.files).forEach(function(key) {
        var sampleFile = req.files[key];

        let name = sampleFile.name;
        let size = sampleFile.size;
        let dataName = name;
        let mime = sampleFile.mimetype;
        let front_type = name.split('.')[1];


        console.log(front_type)


        // let data_real = "data:" + sampleFile.mimetype + ";charset=utf-8;base64," + sampleFile.data.toString('base64');
        let data_real = sampleFile.data.toString('base64');

        var bucketName = code;
        var keyName = name;


        s3.headBucket({ Bucket: bucketName}, function(err, data) {
            if(err){
                s3.createBucket({Bucket: bucketName}, function() {
                    var params = {Bucket: bucketName, Key: keyName, Body: data_real};
                    s3.putObject(params, function(err, data) {
                        if (err)
                            console.log(err)
                        else
                            console.log("Successfully uploaded data to " + bucketName + "/" + keyName);
                    });
                });
            }else{
                var params = {Bucket: bucketName, Key: keyName, Body: data_real};
                s3.putObject(params, function(err, data) {
                    if (err)
                        console.log(err)
                    else
                        console.log("Successfully uploaded data to " + bucketName + "/" + keyName);
                });
            }
        });


        saveData(name,expire,code,size,mime,code,front_type);
        res.redirect('/room');
    });

});


router.get('/room/logout', (req, res) =>{
    req.logout();
    res.redirect('/');
});





router.get('/download/:id',ensureAuthenticated, (req,res) => {
    let id = req.params.id;

    File.findOne({_id: id}, function (err,file) {
        let name = file.name;
        var code = file.code

        var s3Params = {
            Bucket: code.toString(),
            Key: file.name
        };

        s3.getObject(s3Params, function(err,data){
            const url =unescape(encodeURIComponent( Buffer.from(data.Body)));
            let content = Buffer.from(url, 'base64');
            let temp = file.mime + ";charset=UTF-8";
            res.set('Content-Type', temp);
            try{
                res.set('Content-Disposition','attachment; filename=' + file.name );
            }catch{
            }
            res.send(content);
        })

    });

});



router.delete('/download', (req,res) => {

    req.on('data', function (data) {
        obj = JSON.parse(data);

        let id = obj.id;
        let code = obj.code;

        File.findOneAndRemove({ _id: id }, function (err, file) {

            if (err){
                return handleError(err);
            } else{
                var code = file.code
                var s3Params = {
                    Bucket: code.toString(),
                    Key: file.name
                };

                s3.deleteObject(s3Params, function(err, data) {
                    if (err) console.log(err, err.stack);
                });
            }
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
function saveData(name, expire,code,size, mime,code, front_type){
    var file = new File();

    file.name = name;
    file.createdAt.expires = expire.toString();
    file.date = Date();
    file.size = size;
    file.mime = mime;
    file.code = code;
    file.front_type = front_type


    file.save(function (err, doc1){
        if(!err){
            console.log(code);
            Room.findOne({code: code}, function(err,doc2){
                doc2.item.push(doc1.id);
                doc2.save();
            });
        }
    });
}




module.exports = router;


