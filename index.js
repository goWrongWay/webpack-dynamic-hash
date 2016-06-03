/**
 * @file
 * @auther Created by malin on 15/12/30.
 */
var path = require('path');

function WebpackDynamicHash(options, init, app, lib) {
    this.__dirname = options;
    this.init = init;
    this.app = app;
    this.lib = lib;
}

WebpackDynamicHash.prototype.apply = function(compiler) {
    var fs = require('fs');
    try {
        var __dirname = this.__dirname;
        var init = this.init;
        var app = this.app;
        var lib = this.lib;
        //如果存在build目录则继续
        var foo = function (stats) {
            var json = stats.toJson();  //webpack build的输出文件
            var libHash = '';       //commons.js的 hash
            var appHash = '';        //stdapp.js的 hash
            var cssHash = '';           //css.js的 hash
            var initHash = '';           //init.js的 hash
            // node 命令中包涵 -dev
            var isDev = (function () {
                var argv = process.argv;
                for (var i = 0, l = argv.length; i < l; i += 1) {
                    if (argv[i] === '-dev') {
                        return true;
                    }
                }
            })();
            var libStats = json.assetsByChunkName['lib'];
            var initStats = json.assetsByChunkName['init'];
            if (libStats) {
                // -dev commons输出的是数组
                if (isDev) {
                    libHash = '-' + libStats[0].split('.js')[0].split('-')[1];
                    initHash = '-' + initStats[0].split('.js')[0].split('-')[1];
                } else {
                    libHash = '-' + libStats.split('.js')[0].split('-')[1];
                    initHash = '-' + initStats.split('.js')[0].split('-')[1];
                }
            }
            var getAppHash = function (appname) {
                var appStats = json.assetsByChunkName[appname];
                var appStatsLength = appStats.length;
                if (appStatsLength) {
                    for (var i = 0; i < appStatsLength; i += 1) {
                        if (appStats[i].indexOf('.js') > -1 && appStats[i].indexOf('.js.map') === -1) {
                            appHash = '-' + appStats[i].split('.js')[0].split('-')[1];
                        } else if (appStats[i].indexOf('.css') > -1 && appStats[i].indexOf('.css.map') === -1) {
                            cssHash = '-' + appStats[i].split('.css')[0].split('-')[1];
                        }
                    }
                }
            };
            var changeFile = function (init) {
                //read init.js
                var text = fs.readFileSync(path.join(__dirname, init), 'utf8');
                // .js'$
                var out = text.replace(/(lib-)([^-]*)(\.js)/, "lib" + libHash + ".js");
                out = out.replace(/(app-)([^-]*)(\.js)/, "app" + appHash + ".js");
                out = out.replace(/(app-)([^-]*)(\.css)/, "app" + cssHash + ".css");
                fs.writeFileSync(path.join(__dirname, init), out);
            };

            getAppHash(app);
            fs.exists(path.join(__dirname, 'build/js/' + init + '.js'), function(result) {
                if (!result) {
                    fs.rename('build/js/' + init  + initHash + '.js', 'build/js/' + init + '.js', function (err) {
                        if (err) {
                            console.log(err);
                        } else {
                            changeFile('build/js/' + init + '.js');
                        }
                    })
                } else {
                    changeFile('build/js/' + init + '.js');
                }
            })

        }
        fs.exists(path.join(__dirname, 'build'), function(result) {
            compiler.plugin('done', function (stats) {
                if (result) {
                    foo(stats)
                } else {
                    setTimeout(function () {
                        foo(stats)
                    }, 0)
                }
            });
        })


    } catch (e) {
        console.log(e);
    }
};

module.exports = WebpackDynamicHash;