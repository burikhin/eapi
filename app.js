var express = require('express');
var app = express();
var MongoClient = require('mongodb').MongoClient;
var co = require('co');

app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.get('/user/:id([0-9]+)', function (req, res) {
    //req.params.id;
    MongoClient.connect('mongodb://localhost:27017/rest', function (err, db) {
        if (err) {
            throw err;
        }
        db.collection('user').find({'id': req.params.id}).limit(1).next(function (err, doc) {
            res.send(doc);
        });
    });
});

app.post('/friends/:id([0-9]+)/add/:friend([0-9]+)', function (req, res) {
    //req.params.id;
    MongoClient.connect('mongodb://localhost:27017/rest', function (err, db) {
        if (err) {
            throw err;
        }
        db.collection('user').findOneAndUpdate({'id': req.params.id}).limit(1).next(function (err, doc) {
            res.send(doc);
        });
    });
});

app.get('/friends/:id([0-9]+)', function (req, res) {
    //req.params.id;
    MongoClient.connect('mongodb://localhost:27017/rest', function (err, db) {
        if (err) {
            throw err;
        }
        db.collection('user').find({'id': req.params.id}).limit(1).next(function (err, doc) {
            //console.log(doc.friends);
            db.collection('user').find({'id': {$in: doc.friends}}).toArray(function (err, docs) {
                res.send(docs);
            });
        });
    });
});

app.get('/friends/:id([0-9]+)/depth/:depth([0-9]+)', function (req, res) {
    console.log(req.params.id, req.params.depth);

    co(function*() {
        var db = yield MongoClient.connect('mongodb://localhost:27017/rest');
        var collection = db.collection('user');
        var result = [];
        var user_ids = [req.params.id];
        //var user_ids = ['1', '2'];
        for (var i = 0; i < req.params.depth; i++) {
            var docs = yield findFriends(collection, user_ids);
            //console.log('Y1', docs);
            var all_friends = [];
            for (var j = 0; j < docs.length; j++) {
                console.log("J LOG", docs[j].friends);
                all_friends = all_friends.concat(docs[j].friends);
            }
            console.log("ALL FRIENDS", all_friends);
            user_ids = all_friends;

            result = result.concat(docs);
            console.log("RESULT SET", result);
        }
        db.close();

        //result = result.reduce(function (a, b) {
        //    if (a.indexOf(b) < 0) a.push(b);
        //    return a;
        //}, []);

        //console.log(result);
        var uniq = yield uniqObj(result);
        res.send(uniq);
    });
});


var findFriends = function (collection, ids) {
    return co(function*() {
        var docs = yield collection.find({'id': {$in: ids}}).toArray();
        //console.log(docs);
        var all_friends = [];
        for (var i = 0; i < docs.length; i++) {
            all_friends = all_friends.concat(docs[i].friends);
        }
        console.log("FF", all_friends);
        //console.log("INCLUDES", all_friends.indexOf('3') != -1);
        //console.log("UNIQ", uniq(all_friends));
        //console.log(all_friends);
        return yield collection.find({'id': {$in: all_friends}}).toArray();
    });
};

//function onlyUnique(value, index, self) {
//    return self.indexOf(value) === index;
//}
//
//function uniq(a) {
//    var prims = {"boolean": {}, "number": {}, "string": {}}, objs = [];
//
//    return a.filter(function (item) {
//        var type = typeof item;
//        if (type in prims)
//            return prims[type].hasOwnProperty(item) ? false : (prims[type][item] = true);
//        else
//        return objs.indexOf(item) >= 0 ? false : objs.push(item);
//    });
//}

function uniqObj(a) {
    var ids = [];
    var uniq = [];
    var i = a.length;
    while (i--) {
        console.log("123",a[i]);
        if (ids.indexOf(a[i].id) == -1) {
            console.log("IF");
            ids.push(a[i].id);
            uniq.push(a[i]);
        }
    }
    console.log("uniqObj", ids, uniq);
    return uniq;
}

//app.get('/friends/:id([0-9]+)/depth/:depth([0-9]+)', function (req, res) {
//    console.log(req.params.id, req.params.depth);
//
//    co(function*() {
//        var db = yield MongoClient.connect('mongodb://localhost:27017/rest');
//        var collection = db.collection('user');
//        var result = [];
//        for (var i = 0; i < req.params.depth; i++) {
//            var docs = yield collection.find().toArray();
//            result = result.concat(docs);
//            console.log(docs, result);
//        }
//        db.close();
//        console.log(result);
//        res.send(result);
//    });
//});

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});
