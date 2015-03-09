(function ($, w) {

    'use strict';

console.log('App js from within module')

    w.App = {
        NO_OP: function () {},
        models: {},
        controllers: {}
    };

}(null, window));