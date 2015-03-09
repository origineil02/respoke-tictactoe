/* global respoke: true, App: true */

(function (respoke, App) {
    'use strict';

console.log('Loading Client.js')
    /**
     * Establishes a client connection through the respoke API
     * @param {String} endpointId
     * @param {Function} cb
     * @returns {Promise}
     */
    App.models.client = function (endpointId, cb) {

        var client = respoke.createClient({
            appId: 'dc0feacb-13c7-44c8-ad19-0acdd3c6a9dd',
            developmentMode: true
        });

        client.connect({
            endpointId: endpointId,
            presence: 'available'
        }).done(function () {
            cb(client);
        });

        return client;
    };

}(respoke, App));
