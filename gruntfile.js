/* jshint node: true */
'use strict';
var path = require('path'),
    _ = require('underscore');

module.exports = function (grunt) {

    grunt.loadNpmTasks('grunt-injector');
    grunt.loadNpmTasks('grunt-express');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-browser-sync');
    grunt.loadNpmTasks('grunt-jscs');
    grunt.loadNpmTasks('grunt-contrib-stylus');
    grunt.loadNpmTasks('grunt-autoprefixer');

    var files = [
        'app/js/app.js',
        'app/js/lib/**/*.js',
        'app/js/models/**/*.js',
        //'app/js/collections/**/*.js',
        'app/css/**/*.css'
    ];

    grunt.initConfig({

        stylus: {
            compile: {
                files: {
                    'app/css/tictactoe.css': 'app/css/tictactoe.styl'
                }
            }
        },

        autoprefixer: {
            styles: {
                expand: true,
                flatten: true,
                src: 'app/css/*.css',
                dest: 'app/css/'
            }
        },

//        jshint: {
//            files: ['app/js/**/*.js', 'app/modules/**/*.js'],
//            options: {
//                force: true,
//                jshintrc: './.jshintrc',
//                ignores: ['app/js/transporter/**/*.js']
//            }
//        },
        watch: {
            options: {
                livereload: process.env.LIVERELOAD || 1338
            },
            scripts: {
                files: [
                    'app/js/**/*.js',
                    'test/**/*.js',
                    'app/modules/**/*.js',
                    '!app/js/transporter/**/*.js'
                ],
                tasks: ['injector']
            },
//            templates: {
//                files: [
//                    'app/templates/**/*.html'
//                ]
//            },
            css: {
                files: ['app/css/*.styl'],
                tasks: ['stylus', 'autoprefixer']
            }
        },

        express: {
            server: {
                options: {
                    hostname: 'localhost',
                    port: 5678,
                    server: path.resolve('./server/server'),
                    debug: true
                }
            }
        },

        injector: {
            options: {
                relative: true,
                addRootSlash: false,
                ignorePath: 'app'
            },
            tictactoe: {
                template: 'app/modules/tic-tac-toe/index.html',
                files: {
                    'app/modules/tic-tac-toe/index.html': (function () {
                        var arr = _.clone(files);
                        arr.push('app/modules/tic-tac-toe/**/*.js');
                        return arr;
                    }())
                }
            },
            test: {
                template: 'test/index.html',
                files: {
                    'test/index.html': (function () {
                        var arr = _.clone(files);
                        //arr.push('app/modules/video-call/**/*.js');
                        arr.push('app/modules/**/*.js');
                        arr.push('test/specs/**/*.js');
                        return arr;
                    }())
                }
            }
        },

        browserSync: {
            dev: {
                bsFiles: {
                    src: 'app/js/**/*.js'
                },
                options: {
                    watchTask: true
                }
            }
        },

        jscs: {
            src: 'app/js/**/*.js',
            options: {
                config: '.jscsrc'
            }
        }

    });
    grunt.registerTask('server', ['injector', 'express', 'browserSync', 'watch']);
    grunt.registerTask('build', ['stylus', 'autoprefixer', 'injector']);
    grunt.registerTask('default', ['build']);
};
