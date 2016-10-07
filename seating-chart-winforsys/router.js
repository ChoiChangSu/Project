const querystring = require("querystring"),
    //formidable = require("formidable"),
    url = require("url"),
    fs = require("fs");

//cyberccs 날짜 + 시간 표시
const dt = require('date-utils');

//Add by cyberccs 2016-08-29 이벤트 강제 발생
var customEvent = new process.EventEmitter();

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

//Add by cyberccs 2016-09-08 NickName 추가
//fs.appendFile("./occupied.csv", "date,uid,uname,x,y,dept\n", (err) => {
fs.appendFile("./occupied.csv", "date,uid,uname,nickname,x,y,dept\n", (err) => {
    if (err) {
        console.log(err);
        return;
    }

    console.log("Appended header into occupied.csv");
});

//Add by cyberccs 2016-09-02 팀 별 색상 변경
var g_styleMap_group = {
    '영업부': 'BusinessDept',
    '기획실': 'PlanningDept',
    '비전사업팀': 'VisionDept',
    '연구소': 'ResearchDept',
    'ALPHA팀': 'AlphaDept',
    'CMS팀': 'CmsDept',
    'FDS팀': 'FdsDept',
    'SPNS팀': 'SpnsDept',
    '해외지원팀': 'SupportDept',
    'DNI팀': 'DniDept',
    'SAPS팀': 'SapsDept',
    'SMES팀': 'SmesDept',
    '경영지원부': 'ManagementDept',
    '디자인팀': 'DesignDept',
    'SPIDER팀': 'SpiderDept',
    '응용기술팀': 'AtiDept',
    'DKEC': 'DKEC'
};
/*
var g_styleMap_group = {
    '기획실': 'btn-default',
    '비전사업팀': 'btn-primary',
    '연구소': 'btn-warning',
    '영업부': 'btn-danger',
    'SMARTFA그룹': 'btn-info',
    '전략개발그룹': 'btn-success',
    'DKEC': 'btn-default'
};
*/

/////////////////////////////////////////////////////////////
// index
exports.index = function(req, res) {
    console.log("GET Request handler '/' was called.");
    //res.sendFile(__dirname + '/views/template.html');
    //console.log(g_userInfo);

    console.log("uid: " + req.session.uid + ", uname: " + req.session.uname + ", dept: " + req.session.dept + ", nickname: " + req.session.nickname);
    //console.log("uid: " + req.session.uid + ", uname: " + req.session.uname + ", dept: " + req.session.dept);
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
        
        //console.log('TODAY : ' + today);
        var dt = new Date();
        var d = dt.toFormat('YYYY-MM-DD HH24:MI:SS');
        console.log('[' + d + '] ' + '현재 시간');
        //console.log((new Date).toString());

        //Add by cyberccs 2016-09-08 NickName 추가
        var en_name = {};
        var ko_name = {};

        var uniqResult = [];
        var validResult = result.filter((item) => {
                console.log('ITEM DATE : ' + item.date);

                return item.date == today; 
            }).forEach((element, idx, array) => {
                console.log('element');
                console.log(element);
                //console.log('element id : ' + element.uid);

                var foundIndex = uniqResult.findIndex((elem, i, a) => {
                    console.log('elem id : ' + elem.uid);

                    console.log(i);
                    console.log(a);

                    console.log("foundIndex1 = " + foundIndex);

                    return elem.uid == element.uid;
                });

                console.log("foundIndex2 = " + foundIndex);

                console.log("uniqResult1");
                console.log(uniqResult);

                uniqResult.push(element);

                if (foundIndex >= 0) {
                    //uniqResult.splice(foundIndex, 1, element);
                    uniqResult.splice(foundIndex, 1);
                }

                console.log("uniqResult2");
                console.log(uniqResult);

                foundIndex = uniqResult.findIndex((elem, i, a) => {
                    return elem.uid != element.uid && elem.x == element.x && elem.y == element.y;
                });

                //console.log("foundIndex=" + foundIndex);
                if (foundIndex >= 0) {
                    //uniqResult.splice(foundIndex, 1, element);
                    uniqResult.splice(foundIndex, 1);
                }

                console.log('uniqResult3');
                console.log(uniqResult);
            });

        //console.log("Unique Result: " + uniqResult.length);
        //console.log(uniqResult);

        //Add by cyberccs 2016-09-08 NickName 추가
        for(var i = 0; i < uniqResult.length; i++){
            en_name[uniqResult[i].uname] = uniqResult[i].nickname;
            ko_name[uniqResult[i].nickname] = uniqResult[i].uname;
        };

        var localVals = {
            uid: req.session.uid, 
            uname: req.session.uname,
            nickname: req.session.nickname,
            dept: req.session.dept,
            login: loggedin, 
            coords: g_mapCoords, 
            occupied: uniqResult,
            stylemap: g_styleMap_group,

            //Add by cyberccs 2016-09-08 NickName 추가
            en_name: JSON.stringify(en_name),
            ko_name: JSON.stringify(ko_name)
        };
        
        //console.log(localVals);

        console.log("GET Request handler '/' was called End. " + req.session.uname);

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

    console.log("found user: ");
    console.log(found);

    if (found.length > 0 && 'uname' in found[0] && found[0].uname != undefined && found[0].uname != "") {
        req.session.uid = req.body.emailid;
        req.session.uname = found[0].uname;
        req.session.dept = found[0].dept;

        //Add by cyberccs 2016-09-08 NickName 추가
        req.session.nickname = found[0].nickname;

        res.redirect('/');
    } else {
        req.session.uid = undefined;
        req.session.uname = undefined;
        req.session.dept = undefined;

        //Add by cyberccs 2016-09-08 NickName 추가
        req.session.nickname = undefined;

        res.sendStatus(403);
    }
}

exports.logout = function(req, res) {
    console.log("Request handler '/logout' was called. Id : " + req.session.uid);
    console.log("Request handler '/logout' was called. Name : " + req.session.uname);

    //Add by cyberccs 2016-08-31
    //UserReplace(req.session.uname, null);
    //customEvent.emit('CsvReplace', req.session.uname, null);

    req.session.uid = undefined;
    req.session.uname = undefined;

    //Add by cyberccs 2016-09-08 NickName 추가
    req.session.nickname = undefined;

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
        
        //console.log(html);

        res.send(html);        
        
        return;
    }

    //console.log("[DEBUG] GET:: x: " + req.query.x + ", y: " + req.query.y);

    if (req.query.x == undefined || req.query.y == undefined) {
        res.sendStatus(403);
        return;
    }

    var today = (new Date).toLocaleDateString();
    var data = today + "," + req.session.uid + "," + req.session.uname + "," + req.session.nickname + "," + req.query.x + "," + req.query.y + "," + req.session.dept + "\n";
    //var data = today + "," + req.session.uid + "," + req.session.uname + "," + req.query.x + "," + req.query.y + "," + req.session.dept + "\n";

    //Add by cyberccs 2016-08-31
    //customEvent.emit('CsvReplace', req.session.uname);
    //customEvent.emit('AddUser', data);
    //UserReplace(req.session.uname, data);
    //AddUser(data);
    //res.redirect('/');
    
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

var UserReplace = function(code, code2){
    console.log('[DEBUG] UserReplace Start. data : ' + code);
    
    try{
        fs.readFile('occupied.csv', 'utf8', function(error, data){
            var string = data;
            
            var temp = [];
            var arr = [];
            var arrUser = [];
            var index = 0;
                
            temp = string.toString().split('\n');
            
            //console.log('Replace Name : ' + code);
            console.log('길이 : ' + temp.length);
            
            fs.openSync('./occupied.csv', 'w', function(err, fd){
                if (err) {
                    console.log(err);
                    
                    throw err;
                }
            });
                
            for(var i = 0; i < temp.length; i++){            
                var result = temp[i].toString().indexOf(code);
                
                console.log('길이 : ' + temp[i].length);
                console.log('[DEBUG] Data : ' + temp[i]);

                if(result == -1 && temp[i].length != 0){
                    arr[index] = temp[i] + '\n';

                    fs.appendFileSync('./occupied.csv', temp[i] + '\n');

                    console.log('[DEBUG] Appended data code : ' + temp[i]);
                    
                    index++;
                }
            }

            if(code2 != null){
                fs.appendFileSync('./occupied.csv', code2);

                console.log('[DEBUG] Appended data code2 : ' + code2);
            }
        });
    } catch(e){
        console.log(e);
    };

    console.log('[DEBUG] UserReplace End');
};

function AddUser(data){
//var AddUser = function(data){
    console.log('[DEBUG] AddUser Start. data : ' + data);

    try{
        if(data != null)
        {
            fs.open('./occupied.csv', 'w', function(err, fd){
                if (err) {
                    console.log(err);
                    
                    throw err;
                }
            });

            //fs.appendFileSync('./occupied.csv', code2);

            fs.appendFile("./occupied.csv", data, (err) => {
                if (err)
                { 
                    throw err;
                }

                console.log("[DEBUG] Appended data AddUser : [" + data + "]");
            });
        }
    } catch(e){
        console.log(e);
    };

    console.log('[DEBUG] AddUser End');
};

//Add by cyberccs 2016-08-29 이벤트 강제 발생
customEvent.on('Test', function(code, error){
});