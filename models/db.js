const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/Filexpress', { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
    if (!err) { console.log('MongoDB Connection Succeeded.') }
    else { console.log('Error in DB connection : ' + err) }
});


require('./base.model');







// const mongoose = require('mongoose');
//
// const uri = "mongodb+srv://dbUser:Fuckyou123%40@cluster0-oqegn.mongodb.net/RPC?retryWrites=true&w=majority";
// mongoose.connect(uri, {
//     useNewUrlParser: true
// });
//
// require('./rpc.model');
