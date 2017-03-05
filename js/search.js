/**
 * This object represents
 * @type Backbone.View
 */
var SearchView = Backbone.View.extend({
    el      : '#search',
    events  : {
        'click .search' : 'search',
        'keypress'      : 'actionKey'
    },

    initialize : function () {
        this.$button = this.$('.search');
        this.$input  = this.$('#input-saisie');

        var _this = this;
        this.listenTo(this.model, 'reset', function() {
            _this.disableInputs(false);
        });

    },

    disableInputs: function(boolean) {
        this.$input.prop('disabled', boolean);
        this.$button.prop('disabled', boolean);
    },

    /**
     * Triggers the search, only if the value is not empty.
     */
    search : function () {
        if (this.$input.val() != "" && this.$input.val() != null) {
            this.disableInputs(true);
            this.model.trigger('search');
        }
    },

    /**
     * Supposed to answer only to ENTER_KEY (keyCode : 13).
     * Allows the application to use enter key in addition to the click on the search button.
     *
     * @param event
     *      the event fired
     */
    actionKey: function(event) {
        if (event.which == 13) {
            this.search();
        }
    },

    /**
     * Returns the search input (JQuery object)
     *
     * @returns {Object}
     */
    getSearch: function() {
        return this.$input;
    }
});