const path = require('path');
const fs = require('fs');
const https = require("https");
const URL = require('url').URL;


// 检测死链或代码更新的链接 TODO

const pathFrom = path.resolve(__dirname, '../docs');
const suffix = 'md';
const targetLink = 'github.com/facebook';


readFileWithSuffix(pathFrom, suffix, str => {
  [...str.matchAll(/\[([^\]]+?)\]\(([^\)]+?)\)/g)].forEach(([_, nameWithTag, url]) => {
    if (!url.includes(targetLink)) {
      return;
    }
    const result = nameWithTag.match(/==(.+?)== (.+)/);
    if (!Array.isArray(result)) {
      return;
    }
    const [__, keyword, name] = result;
    checkLinkAlive(name, keyword, url);
  })
});

function readFileWithSuffix(filePath, suffix, cb){
  fs.readdir(filePath, (err,files) => {
    if(err){
        return console.warn(err);
    }

    //遍历读取到的文件列表
    files.forEach(function(filename){
      var filedir = path.join(filePath, filename);

      fs.stat(filedir, (err,stats) => {
        if (err){
            return console.warn('获取文件stats失败');
        }

        const isFile = stats.isFile();
        var isDir = stats.isDirectory();
        if(isFile){
          if (filedir.endsWith(suffix)) {
            cb(fs.readFileSync(filedir, 'utf8'));
          }
        }
        if(isDir){
          readFileWithSuffix(filedir, suffix, cb);
        }
      })
    });
  });
}

function checkLinkAlive(name, keyword, url) {
  setTimeout(() => {

    var req = https.request(new URL(url), res => {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        console.log('BODY: ' + chunk);
      });
    });

    req.on('error', e => {
      console.log('problem with request: ' + e.message);
    });
    req.end();
  }, Math.random() * 500);
}