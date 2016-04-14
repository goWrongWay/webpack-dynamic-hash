/**
 * @file
 * @auther Created by malin on 15/12/30.
 */
var path = require('path');

function WebpackDynamicHash(options, arr) {
    this.__dirname = options;
    this.arr = arr;
}

WebpackDynamicHash.prototype.apply = function(compiler) {
    var __dirname = this.__dirname;
    var arr = this.arr;
    compiler.plugin('done', function(stats) {
        var fs = require('fs');
        var json = stats.toJson();  //webpack build的输出文件
        var commonshash = '';       //commons.js的 hash
        var apphash = '';        //stdapp.js的 hash
        var csshash = '';           //css.js的 hash
        // node 命令中包涵 -dev
        var isDev = (function () {
            var argv = process.argv;
            for (var i = 0, l = argv.length; i < l; i += 1) {
                if (argv[i] === '-dev') {
                    return true;
                }
            }
        })();
        var commonsStats = json.assetsByChunkName['commons'];
        if (commonsStats) {
            // -dev commons输出的是数组
            if (isDev) {
                commonshash = '?' + commonsStats[0].split('?')[1];
            } else {
                commonshash = '?' + commonsStats.split('?')[1];
            }
        }
        var appHash = function (appname) {
            var appStats = json.assetsByChunkName[appname];
            var appStatsLength = appStats.length;
            if (appStatsLength) {
                for (var i = 0; i < appStatsLength; i += 1) {
                    if (appStats[i].indexOf(appname + '.js') > -1 && appStats[i].indexOf(appname + '.js.map') === -1) {
                        apphash = '?' + appStats[i].split('?')[1];
                    } else if (appStats[i].indexOf(appname + '.css') > -1 && appStats[i].indexOf(appname + '.css.map') === -1) {
                        csshash = '?' + appStats[i].split('?')[1];
                    }
                }
            }
        };
        var changeFile = function (init, app, css) {
            var text = fs.readFileSync(path.join(__dirname, init), 'utf8');
            var out = text.replace('?commonshash', commonshash);
            out = out.replace(app, apphash);
            out = out.replace(css, csshash);
            fs.writeFileSync(path.join(__dirname, init), out);
        };

        arr.map(function(v, i) {
            appHash(v + '-app');
            changeFile('build/js/' + v + '-init.js', '?apphash', '?csshash');
        })
    });
};

module.exports = WebpackDynamicHash;