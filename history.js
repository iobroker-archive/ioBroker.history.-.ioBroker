var adapter = require('.././adapter.js')({

    name:           'history',

    objectChange: function (id, obj) {
        if (obj.history) {
            history[id] = obj.history;
        } else {
            delete history[id];
        }
    },

    stateChange: function (id, state) {
        pushHistory(id, state);
    },

    unload: function (callback) {
        callback();
    },

    ready: function () {
        main();
    }

});

var history = {};

function main() {

    adapter.objects.getObjectView('history', 'state', {}, function (err, doc) {
        if (doc.rows) {
            for (var i = 0, l = doc.rows.length; i < l; i++) {
                if (doc.rows[i].value) {
                    adapter.log.info('history push ' + doc.rows[i].id);
                    history[doc.rows[i].id] = doc.rows[i].value;
                }
            }
        }
    });

    adapter.subscribeForeignStates('*');

}

function pushHistory(id, state) {

    // Push to fifo
    if (history[id] && history[id].fifo && history[id].fifo.enabled) {
        if (history[id].changesOnly && state.ts !== state.lc) return;
        setTimeout(function (_id, _state) {
            adapter.states.pushFifo(_id, _state);

            if (history[id].fifo.maxLength) {
                adapter.states.lenFifo(_id, function (len) {
                    if (len > history[_id].fifo.maxLength) {
                        adapter.states.trimFifo(_id, history[_id].fifo.minLength || 0);
                    }
                });
            }

        }, 1000, id, state);
    }

    // Todo other Targets

}

