/*jshint node: true */
'use strict';
var webdriverio = require('webdriverio');
var enableDestroy = require('server-destroy');
var http = require('http');
var server = require('../../server/server');

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
            client = webdriverio.remote({
                desiredCapabilities: { browserName: 'chrome' }
            }).init(done);
        });
    });

    after(function (done) {
        // close webdriver browser
        client.end(function () {

            // stop static site
            httpServer.destroy(done);
        })
    });

    describe("upon login", function () {

        it("shows logout button", function (done) {
            client.url('http://localhost:5678/modules/tic-tac-toe/index.html')
                .setValue('div#login input', 'bob')
                .click('div#login button')
                .waitForExist('button[data-selenium-hook="logout"]', 2 * 1000, done);
        });
    });
});
