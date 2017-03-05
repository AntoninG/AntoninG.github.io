/**
 *
 * @type Backbone.Model
 */
var ResultModel = Backbone.Model.extend({
    defaults: {
        id      : null,
        name    : 'Random name',
        calories: 0,
        saturated_fat: 0,
        sodium  : 0
    }
});

/**
 *
 * @type Backbone.Collection
 */
var ResultCollection = Backbone.Collection.extend({
    model: ResultModel,
    comparator : 'name',

    initialize: function () {
        this.on('search', this.fetchResults);
    },

    url  : function() {
        var url = "https://api.nutritionix.com/v1_1/search/{SEARCH}?appId=8b6d67af&appKey="+
            "2f197817e5021992074aace0da567fca&results=0:50&fields=item_name,item_id,nf_calories,nf_saturated_fat,nf_sodium";

        var maxCalories = App.getThresholdCalories();
        if (maxCalories != null && !isNaN(maxCalories) && maxCalories > 0) {
            url += "&cal_max="+maxCalories;
        }

        return url.replace("{SEARCH}", App.getSearchValue());
    },
    parse: function (response) {
        var array = [];
        var uniqueness = {};
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
    fetchResults: function () {
        this.fetch({
            async : true,
            reset : true,
            error : function(collection, response, options) {
                toastr.error('An error occured during retrieving of results. Check the console.');
                console.log(response);
            }
        });
    }
});

/**
 *
 * @type Backbone.View
 */
var ResultView = Backbone.View.extend({
    tagName: 'li',
    className: "list-group-item",
    events: {
        'click .content': 'select'
    },
    template: _.template($('#result-template').html()),

    initialize: function () {
        this.listenTo(this.model, 'remove', this.remove);
    },

    render: function () {
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    },

    select: function () {
        App.addToPantry(this.model);
    }
});

/**
 *
 * @type Backbone.View
 */
var ResultListView = Backbone.View.extend({
    el: '#search-result',

    initialize: function () {
        this.listenTo(this.model, 'reset', this.render);
        this.render();
    },

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