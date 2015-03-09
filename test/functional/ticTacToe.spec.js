/*jshint node: true */
'use strict';
var webdriverio = require('webdriverio');
var enableDestroy = require('server-destroy');
var http = require('http');
var server = require('../../server/server');
var async = require('async')
var assert = require('assert')
var closeBrowsers = true;
var environment = process.env.TESTENV || 'local';
var url;

function getBrowser() {
    var options;
    if (environment === 'local') {
        options = { browserName: 'chrome' };
        url = 'http://localhost:5678/modules/tic-tac-toe/index.html'
    } else if (environment === 'browserstack') {
        url = 'http://origineil02.github.io/respoke-tictactoe/app/modules/tic-tac-toe/index.html'
        options = {
            host: 'hub.browserstack.com',
            port: 80,
            user: process.env.BROWSERSTACK_USERNAME,
            key: process.env.BROWSERSTACK_ACCESS_KEY,
            desiredCapabilities: {
                browser: 'chrome',
                browser_version: '38.0',
                os: 'OS X',
                os_version: 'Mavericks',
                resolution: '1280x1024',
                args: [ 'incognito' ],
                'browserstack.debug': true,
                'browserstack.selenium_version': '2.43.1'
            }            
        };
    }
 
    return webdriverio.remote(options).addCommand('finish', function (cb) {
        if (closeBrowsers) {
            this.end(cb);
            return;
        }
        cb();
    });
}

describe("tic tac toe", function () {
    this.timeout(30 * 1000);
    var httpServer;
    var client;

    before(function (done) {
        // start static site
        httpServer = http.createServer(server);
        enableDestroy(httpServer);
        httpServer.listen(5678, function () {
            // instantiate webdriver client
            client = getBrowser().init(done);
        });
    });

    after(function (done) {
        // close webdriver browser
        client.finish(function () {

            // stop static site
            httpServer.destroy(done);
        })
    });

    describe("upon login", function () {

        it("shows logout button", function (done) {
            client.url(url)
                    .setValue('div#login input', 'bob')
                    .click('div#login button')
                    .waitForExist('button[data-selenium-hook="logout"]', 2 * 1000, done);
        });
    });

    describe("with two clients connected", function () {
        var opponent;

        before(function (done) {

            opponent = getBrowser().init(function () {

                async.parallel([
                    function (next) {
                        client.url(url)
                          .setValue('div#login input', 'client')
                          .click('div#login button')
                          .waitForExist('button[data-selenium-hook="logout"]', 2 * 1000, next);
                        },
                    function (next) {
                        opponent.url(url)
                            .setValue('div#login input', 'opponent')
                            .click('div#login button')
                            .waitForExist('button[data-selenium-hook="logout"]', 2 * 1000, next);
                        }
                ], done);
            });
        });

        after(function (done) {
            // close webdriver browser
            opponent.finish(done)
        });
        
        it("has an opponent available", function (done) {
            client.waitForExist('//td[contains(text(), "opponent")]', 3000, done)
        });
        
       it("can challenge opponent to a match of tic tac toe", function (done) {
           client.waitForExist('//td[contains(text(), "opponent")]', 2000).click('//td[contains(text(), "opponent")]', function(){
               opponent.waitForExist('div[data-selenium-hook="accept-invitation-client"]', 2000).click('div[data-selenium-hook="accept-invitation-client"]', function(){
                   client.waitForExist('table[data-selenium-hook="game-board-opponent"]', 2000, function () {
                       opponent.waitForExist('table[data-selenium-hook="game-board-opponent"]', 2000, done);
                   });                   
               })
           });
       })
    });
    
    describe("with two clients playing", function () {
        var opponent;

        before(function (done) {

            opponent = getBrowser().init(function () {

                async.parallel([
                    function (next) {
                        client.url(url)
                          .setValue('div#login input', 'client')
                          .click('div#login button')
                          .waitForExist('button[data-selenium-hook="logout"]', 2 * 1000, next);
                        },
                    function (next) {
                        opponent.url(url)
                            .setValue('div#login input', 'opponent')
                            .click('div#login button')
                            .waitForExist('button[data-selenium-hook="logout"]', 2 * 1000, next);
                        }
                ], function (err) {
                    if (err) {
                        done(err);
                        return;
                    }
                    
                    client.waitForExist('//td[contains(text(), "opponent")]', 2000).click('//td[contains(text(), "opponent")]', function(){
                        opponent.waitForExist('div[data-selenium-hook="accept-invitation-client"]', 2000).click('div[data-selenium-hook="accept-invitation-client"]', function(){
                            client.waitForExist('table[data-selenium-hook="game-board-opponent"]', 6000, function () {
                                opponent.waitForExist('table[data-selenium-hook="game-board-opponent"]', 6000, done);
                            });                   
                        })
                    });                    
                });
            });
        });

        after(function (done) {
            // close webdriver browser
            opponent.finish(done)
        });
        
        it('allows the client to quit', function (done) {           
            client.click("button[data-selenium-hook='quit-button']")
                    .waitForExist('button[data-selenium-hook="logout"]', 2 * 1000, function(){
                        opponent.alertAccept().waitForExist('button[data-selenium-hook="logout"]', 2 * 1000, done);
                })
        });
    });
    
});
