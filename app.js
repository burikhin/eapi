var express = require('express');
var app = express();
var MongoClient = require('mongodb').MongoClient;
var co = require('co');

app.get('/', function (req, res) {
    var help = "Api usage: " +
        "\n/user/:id, " +
        "\n/friends/:id/invite/:friend, " +
        "\n/friends/:id/confirm/:friend, " +
        "\n/friends/:id/decline/:friend" +
        "\n/user/:id/invites" +
        "\n/friends/:id" +
        "\n/friends/:id/depth/:depth";
    res.send(help);
});

app.get('/user/:id([0-9]+)', function (req, res) {
    MongoClient.connect('mongodb://localhost:27017/rest', function (err, db) {
        if (err) {
            throw err;
        }
        db.collection('user').find({'id': req.params.id}).limit(1).next(function (err, doc) {
            res.send(doc);
        });
    });
});

app.post('/friends/:id([0-9]+)/invite/:friend([0-9]+)', function (req, res) {
    MongoClient.connect('mongodb://localhost:27017/rest', function (err, db) {
        if (err) {
            throw err;
        }
        var col = db.collection('user');
        var result = {ok: []};
        col.findOneAndUpdate({'id': req.params.id}
            , {$addToSet: {'sent_invites': req.params.friend}}
            , {})
            .then(function (r) {
                result.ok.push(r.ok);
                col.findOneAndUpdate({'id': req.params.friend}
                    , {$addToSet: {'my_invites': req.params.id}}
                    , {}
                    , function (err, r) {
                        result.ok.push(r.ok);
                        console.log(r);
                        res.send(result);
                    });
            });
    });
});

app.post('/friends/:id([0-9]+)/confirm/:friend([0-9]+)', function (req, res) {
    MongoClient.connect('mongodb://localhost:27017/rest', function (err, db) {
        if (err) {
            throw err;
        }
        var col = db.collection('user');
        var result = {ok: []};
        col.findOneAndUpdate({'id': req.params.id, 'my_invites': {$in: [req.params.friend]}}
            , {$addToSet: {'friends': req.params.friend}, $pull: {'my_invites': req.params.friend}}
            , {})
            .then(function (r) {
                result.ok.push(r.ok);
                col.findOneAndUpdate({'id': req.params.friend, 'sent_invites': {$in: [req.params.id]}}
                    , {$addToSet: {'friends': req.params.id}, $pull: {'sent_invites': req.params.id}}
                    , {}
                    , function (err, r) {
                        result.ok.push(r.ok);
                        console.log(r);
                        res.send(result);
                    });
            });
    });
});

app.post('/friends/:id([0-9]+)/decline/:friend([0-9]+)', function (req, res) {
    MongoClient.connect('mongodb://localhost:27017/rest', function (err, db) {
        if (err) {
            throw err;
        }
        var col = db.collection('user');
        var result = {ok: []};
        col.findOneAndUpdate({'id': req.params.id, 'my_invites': {$in: [req.params.friend]}}
            , {$pull: {'my_invites': req.params.friend}}
            , {})
            .then(function (r) {
                result.ok.push(r.ok);
                col.findOneAndUpdate({'id': req.params.friend, 'sent_invites': {$in: [req.params.id]}}
                    , {$pull: {'sent_invites': req.params.id}}
                    , {}
                    , function (err, r) {
                        result.ok.push(r.ok);
                        console.log(r);
                        res.send(result);
                    });
            });
    });
});

app.get('/user/:id([0-9]+)/invites', function (req, res) {
    MongoClient.connect('mongodb://localhost:27017/rest', function (err, db) {
        if (err) {
            throw err;
        }
        db.collection('user').find({'id': req.params.id}).limit(1).next(function (err, doc) {
            db.collection('user').find({'id': {$in: doc.my_invites}}).toArray(function (err, docs) {
                res.send(docs);
            });
        });
    });
});

app.get('/friends/:id([0-9]+)', function (req, res) {
    MongoClient.connect('mongodb://localhost:27017/rest', function (err, db) {
        if (err) {
            throw err;
        }
        db.collection('user').find({'id': req.params.id}).limit(1).next(function (err, doc) {
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
        var uniq = yield uniqObj(result);
        res.send(uniq);
    });
});


var findFriends = function (collection, ids) {
    return co(function*() {
        var docs = yield collection.find({'id': {$in: ids}}).toArray();
        var all_friends = [];
        for (var i = 0; i < docs.length; i++) {
            all_friends = all_friends.concat(docs[i].friends);
        }

        return yield collection.find({'id': {$in: all_friends}}).toArray();
    });
};

function uniqObj(a) {
    var ids = [];
    var uniq = [];
    var i = a.length;
    while (i--) {
        console.log("123", a[i]);
        if (ids.indexOf(a[i].id) == -1) {
            console.log("IF");
            ids.push(a[i].id);
            uniq.push(a[i]);
        }
    }
    console.log("uniqObj", ids, uniq);
    return uniq;
}

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('App listening at http://%s:%s', host, port);
});
