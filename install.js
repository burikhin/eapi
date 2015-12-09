var MongoClient = require('mongodb').MongoClient;
var users = require('./users');

MongoClient.connect('mongodb://localhost:27017/rest', function (err, db) {
    if (err) {
        throw err;
    }
    var col = db.collection('user');
    col.insertMany(users)
        .then(function (r) {
            console.log(r);
            db.close();
        });
});
