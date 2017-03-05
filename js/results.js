/**
 * This object represents one result of the Nutritionix search.
 * It has and id, a name, a number of calories, saturated fat and sodium.
 *
 * @type Backbone.Model
 */
var ResultModel = Backbone.Model.extend({
    defaults    : {
        id      : null,
        name    : 'Random name',
        calories: 0,
        saturated_fat: 0,
        sodium  : 0
    }
});

/**
 * A collection of ResultModel.
 * @see ResultModel
 *
 * @type Backbone.Collection
 */
var ResultCollection = Backbone.Collection.extend({
    model      : ResultModel,
    comparator : 'name',

    /**
     * Listens on search event to fetch the results of search.
     */
    initialize: function () {
        this.on('search', this.fetchResults);
    },

    /**
     * Url to call for search.
     * Add the parameter for the maximum of calories if needed.
     *
     * @returns {string}
     */
    url  : function() {
        var url = "https://api.nutritionix.com/v1_1/search/{SEARCH}?appId=8b6d67af&appKey="+
            "2f197817e5021992074aace0da567fca&results=0:50&fields=item_name,item_id,nf_calories,nf_saturated_fat,nf_sodium";

        var maxCalories = App.getThresholdCalories();
        if (maxCalories != null && !isNaN(maxCalories) && maxCalories > 0) {
            url += "&cal_max="+maxCalories;
        }

        return url.replace("{SEARCH}", App.getSearchValue());
    },

    /**
     * Parses the answer of the API to keep only items.
     *
     * @param {Object} response
     *      The Nutritionix object response.
     * @returns {Array}
     *      Only the items of the API response.
     */
    parse: function (response) {
        var array = [];
        var uniqueness = {};

        // Items are stored in the hits attribute
        response.hits.forEach(function(result) {
            if (!uniqueness.hasOwnProperty(result.fields.item_name) || uniqueness[result.fields.item_name] > result.fields.nf_calories) {
                uniqueness[result.fields.item_name] = result.fields.nf_calories;
                array.push({
                    id      : result.fields.item_id,
                    name    : result.fields.item_name,
                    calories: result.fields.nf_calories,
                    saturated_fat: result.fields.nf_saturated_fat,
                    sodium  : result.fields.nf_sodium
                });
            }
        });
        return array;
    },

    /**
     * Fetches results of the search, synchronously, with the parameter reset, to properly empty the collection
     * and repopulates it.
     * In case of error, a callback is executed to log the response in console.
     */
    fetchResults: function () {
        this.fetch({
            async : true,
            reset : true,
            error : function(collection, response, options) {
                toastr.remove();
                toastr.error('An error occured during retrieving of results. Check the console.');
                console.log(response);
            }
        });
    }
});

/**
 * This view represents a single ResultModel under a li tag.
 * @see ResultModel
 *
 * @type Backbone.View
 */
var ResultView = Backbone.View.extend({
    tagName  : 'li',
    className: "list-group-item",
    events   : {
        'click .content': 'select'
    },
    template : _.template($('#result-template').html()),

    /**
     * Listens on remove event, and remove itself.
     */
    initialize: function () {
        this.listenTo(this.model, 'remove', this.remove);
    },

    /**
     * Render its model
     *
     * @returns {ResultView}
     */
    render: function () {
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    },

    /**
     * On click on the model, add it to the pantry
     */
    select: function () {
        App.addToPantry(this.model);
    }
});

/**
 * This view represents a list of results.
 * @see ResultCollection
 *
 * @type Backbone.View
 */
var ResultListView = Backbone.View.extend({
    el: '#search-result',

    /**
     * On reset event of its model, render the list.
     */
    initialize: function () {
        this.listenTo(this.model, 'reset', this.render);
        this.render();
    },

    /**
     * Render the list, or, if the list is empty, render a single badge to inform the user there is no result for his search.
     */
    render: function () {
        this.$el.html('');
        if (this.model.models.length > 0) {
            var _this = this;
            this.model.models.forEach(function (result) {
                var view = new ResultView({model: result});
                _this.$el.append(view.render().el);
            });
        } else {
            this.$el.append($('<span class="badge">No result</span>'));
        }
    }
});