
(function () {
    'use strict';
    /*globals App:true, assert:true */
    describe('The Client Model when we connect to a client', function () {
        it('should make a connection', function (done) {
            App.models.client('darth-vader', function (client) {
                assert.equal(client.endpointId, 'darth-vader');
                done();
            });
        });
    });
})();

