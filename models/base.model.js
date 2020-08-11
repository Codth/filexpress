const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var fileSchema = new mongoose.Schema({
    name: {
        type: String
    },
    size:{
        type: Number
    },
    date:{
        type:String
    },
    createdAt: {
        type: Date,
        expires: String,
        default: Date.now
    },
    mime:{
        type: String
    },
    code:{
        type: Number
    },
    front_type:{
        type: String
    }
});


var roomSchema = new mongoose.Schema({
    code: {
        type: String
    },
    password:{
        type: String
    },
    item : [{type: Schema.Types.ObjectID, ref:'File'}]
});





mongoose.model('File', fileSchema);
mongoose.model('Room', roomSchema);



