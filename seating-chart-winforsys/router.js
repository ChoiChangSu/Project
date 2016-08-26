const querystring = require("querystring"),
    //formidable = require("formidable"),
    url = require("url"),
    fs = require("fs");
const Converter = require("csvtojson").Converter;

var g_userInfo = undefined;
var g_mapCoords = undefined;

if (g_userInfo == undefined) {
    console.log("converting user.csv .........");
    var converterForUser = new Converter({ workerNum:2 });
    converterForUser.fromFile("./user.csv", (err, result) => {
        g_userInfo = result;
    });
}

if (g_mapCoords == undefined) {
    console.log("converting map_coords.csv .........");
    var converterForMap = new Converter({ workerNum:2 });
    converterForMap.fromFile("./map_coords.csv", (err, result) => {
        g_mapCoords = result;
    });
}

fs.appendFile("./occupied.csv", "date,uid,uname,x,y,dept\n", (err) => {
    if (err) {
        console.log(err);
        return;
    }

    console.log("Appended header into occupied.csv");
});

var g_styleMap_group = {
    '기획실': 'btn-default',
    '비전사업팀': 'btn-primary',
    '연구소': 'btn-warning',
    '영업부': 'btn-danger',
    'SMARTFA그룹': 'btn-info',
    '전략개발그룹': 'btn-success',
    'DKEC': 'btn-default'
};

/////////////////////////////////////////////////////////////
// index
exports.index = function(req, res) {
    console.log("GET Request handler '/' was called.");
    //res.sendFile(__dirname + '/views/template.html');
    //console.log(g_userInfo);

    console.log("uid: " + req.session.uid + ", uname: " + req.session.uname + ", dept: " + req.session.dept);
    //console.log(g_mapCoords);
    var loggedin = false;
    if (req.session.uid != undefined) {
        loggedin = true;
    }

    var converter = new Converter({ workerNum:2 });
    converter.fromFile("./occupied.csv", (err, result) => {
        console.log("Parsed file: occupied.csv")
        //console.log(result);
        //var uSet = new Set(result);
        //console.log("unique?: "); console.log([...uSet]);
        var today = (new Date).toLocaleDateString();
        //console.log(today);
        //console.log((new Date).toString());

        var uniqResult = [];
        var validResult = result
            .filter((item) => { return item.date == today; })
            .forEach((element, idx, array) => {
                var foundIndex = uniqResult.findIndex((elem, i, a) => {
                    return elem.uid == element.uid;
                });
                //console.log("foundIndex=" + foundIndex);
                uniqResult.push(element);
                if (foundIndex >= 0) {
                    //uniqResult.splice(foundIndex, 1, element);
                    uniqResult.splice(foundIndex, 1);
                }

                foundIndex = uniqResult.findIndex((elem, i, a) => {
                    return elem.uid != element.uid && elem.x == element.x && elem.y == element.y;
                });
                //console.log("foundIndex=" + foundIndex);
                if (foundIndex >= 0) {
                    //uniqResult.splice(foundIndex, 1, element);
                    uniqResult.splice(foundIndex, 1);
                }
            });

        //console.log("Unique Result: ");
        //console.log(uniqResult);

        var localVals = {
            uid: req.session.uid, 
            uname: req.session.uname, 
            dept: req.session.dept,
            login: loggedin, 
            coords: g_mapCoords, 
            occupied: uniqResult,
            stylemap: g_styleMap_group
        };
        
        res.render('layout', localVals);
    });    
}

/////////////////////////////////////////////////////////////
// login
exports.login = function(req, res) {
    console.log("POST Request handler '/login' was called.");
    
    //cyberccs
    console.log("[DEBUG] emailID : " + req.body.emailid);

    if (req.body.emailid == undefined || req.body.emailid == "") {
        //cyberccs
        console.log("[DEBUG] Login Fail. " + req.body.emailid);

        res.sendStatus(403);
        //res.redirect('/');
        return;
    }

    var found = g_userInfo.filter((item) => {
        return item.uid == req.body.emailid; 
    });

    //console.log("found user: ");
    //console.log(found);
    if (found.length > 0 && 'uname' in found[0] && found[0].uname != undefined && found[0].uname != "") {
        req.session.uid = req.body.emailid;
        req.session.uname = found[0].uname;
        req.session.dept = found[0].dept;

        res.redirect('/');
    } else {
        req.session.uid = undefined;
        req.session.uname = undefined;
        req.session.dept = undefined;

        res.sendStatus(403);
    }
}

exports.logout = function(req, res) {
    console.log("Request handler '/logout' was called.");

    req.session.uid = undefined;
    req.session.uname = undefined;

    res.redirect('/');
}

/////////////////////////////////////////////////////////////
// register
exports.register = function(req, res) {
    //cyberccs 누르는 시점
    console.log(req.method + " Request handler '/register' was called.");
    //console.log(g_userInfo);
    console.log("uid: " + req.session.uid + ", uname: " + req.session.uname + ", dept: " + req.session.dept);

    if (req.session.uid == undefined) {
        res.sendStatus(403);
        return;
    }
    
    //cyberccs
    /*
    if(req.method == "GET" && req.query.x == 3 && req.query.y == 50)
    {
        var text = '<script language="JavaScript">\n' +
            'var returnValue = confirm("회의실을 예약하시겠습니까?");\n' +
            'if (returnValue) {\n' +
            '  location.href = "/register?x=' + req.query.x + '&y=' + req.query.y + '";\n' +
            '} else {\n' +
            '  location.href = "/"' +
            '}\n' +
            '</script>';
        
        console.log(text);

        res.send(text);        
        
    return;
    }
    */

    if (req.method == "POST") {
        //console.log("POST:: loc: " + req.body.loc);
        var html = '<script language="JavaScript">\n' +
            'var returnValue = confirm("다른 분이 앉아 있습니다. 변경하시겠습니까?");\n' +
            'if (returnValue) {\n' +
            '  location.href = "/register?' + req.body.loc + '";\n' +
            '} else {\n' +
            '  location.href = "/"' +
            '}\n' +
            '</script>';
        
        console.log(html);

        res.send(html);        
        
        return;
    }

    console.log("[DEBUG] GET:: x: " + req.query.x + ", y: " + req.query.y);

    if (req.query.x == undefined || req.query.y == undefined) {
        res.sendStatus(403);
        return;
    }

    var today = (new Date).toLocaleDateString();
    var data = today + "," + req.session.uid + "," + req.session.uname + "," + req.query.x + "," + req.query.y + "," + req.session.dept + "\n";

    //파일에 쓰기
    fs.appendFile("./occupied.csv", data, (err) => {
        if (err)
        { 
            throw err;
        }

        console.log("[DEBUG] Appended data: [" + data + "]");

        res.redirect('/');
    });
}