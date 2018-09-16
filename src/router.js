const express = require('express');
const bodyParser = require('body-parser'); 
const router = express.Router();
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({  
  extended: true
})); 

router.route('/login')
.post(async function(req,res,next) {
    console.log('In login');
    var authHeader = req.headers.authorization;
    if (!authHeader) {
        console.log('error', 'User are not authenticated!');
        var err = new Error('You are not authenticated!');
        res.setHeader('WWW-Authenticate', 'Basic');
        err.status = 401;
        next(err);
        return;
    }
    var auth = new Buffer(authHeader.split(' ')[1], 'base64').toString().split(':');
    var userName = auth[0];
    var pass = auth[1];
    var isValid = await global.main.userDict.isValid(userName, pass);
    if (isValid){
        res.cookie('user', userName ,{signed: true});
        res.send(`${userName}, you successfully signed in.`);
        res.status = 200;
    } else {
        var err = new Error('You are not authenticated!');
        res.setHeader('WWW-Authenticate', 'Basic');      
        err.status = 401;
        next(err);
    }
});

router.route('/getByTime')
.get(async function(req,res) {
    res.setHeader('Content-Type', 'application/json');
    res.json({ 'message': `` });
});

module.exports = router;