var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const Room = mongoose.model('Room');
const File = mongoose.model('File');


const bcrypt = require('bcryptjs');
const passport = require('passport');
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');

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

router.post('/api', (req, res) => {
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
        let data = "data:" + sampleFile.mimetype + ";charset=utf-8;base64," + sampleFile.data.toString('base64');
        let name = sampleFile.name;
        let size = sampleFile.size;

        saveData(data,name,expire,code,size);
        res.redirect(req.get('referer'));

    });



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

router.get('/room/logout', (req, res) =>{
    req.logout();
    res.redirect('/');
});





router.get('/download/:id',ensureAuthenticated, (req,res) => {
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
    file.front_type = name.split(".")[1];


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


