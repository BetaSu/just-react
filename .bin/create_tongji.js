
const fs = require('fs');
const path = require('path');

const token = process.env.baidu_tongji_token;

function createScript(token) {
  return `
    var _hmt = _hmt || [];
    (function() {
      var hm = document.createElement("script");
      hm.src = "https://hm.baidu.com/hm.js?${token}";
      var s = document.getElementsByTagName("script")[0]; 
      s.parentNode.insertBefore(hm, s);
    })();
  `;
}

const str = createScript(token);
const dist = path.resolve(__dirname, '../dist/assets/js/tj.js');

console.log(dist);

fs.writeFile(dist, str, 'utf8', () => {});
