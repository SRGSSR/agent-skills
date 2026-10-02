// Deprecated: imports archive XML exports into the articles table.
var fs = require('fs');

function parseArticles(xml) {
  var out = [];
  var re = /<article id="(\d+)">([\s\S]*?)<\/article>/g;
  var m;
  while ((m = re.exec(xml))) {
    var title = /<title>([\s\S]*?)<\/title>/.exec(m[2]);
    out.push({ id: Number(m[1]), title: title ? title[1] : '' });
  }
  return out;
}

module.exports = { parseArticles: parseArticles };
