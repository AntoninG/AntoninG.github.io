/**
 * This object represents a food stored in the pantry.
 * It has an id, a name, a quantity and some calories, saturated fat and sodium.
 *
 * @type Backbone.Model
 */
var FoodModel = Backbone.Model.extend({
    defaults: {
        id      : null,
        name    : 'Random name',
        calories: 0,
        saturated_fat: 0,
        sodium  : 0,
        quantity: 1
    },

    /**
     * Decrement by one the total quantity of the food, until a minimum of 0
     */
    decrementQuantity: function() {
        if (this.get('quantity') - 1 >= 0) {
            this.set({quantity: this.get('quantity') - 1});
        }
    },

    /**
     * Increment by one the total quantity of the food, until a maximum of 50
     */
    incrementQuantity: function() {
        if (this.get('quantity') + 1 <= 50) {
            this.set({quantity: this.get('quantity') + 1});
        }
    }
});

/**
 * This object represents the pantry.
 * This is a collection of FoodModel.
 *
 * @type Backbone.Collection
 */
var FoodCollection = Backbone.Collection.extend({
    model   : FoodModel,
    comparator : 'name',

    /**
     * Listen on change (of a model) event to update the locally stored pantry and inform the profile of its changes
     */
    initialize: function() {
        this.on('change', function() {
            App.savePantry();
            this.trigger('update');
        }, this)
    },

    getTotals: function() {
        var calories = 0;
        var fat      = 0;
        var sodium   = 0;


        this.models.forEach(function (food) {
            if (!isNaN(food.get('quantity')) && food.get('quantity') > 0) {
                var quantity = food.get('quantity');

                if (!isNaN(food.get('calories'))) {
                    calories += quantity * food.get('calories');
                }

                if (!isNaN(food.get('saturated_fat'))) {
                    fat += quantity * food.get('saturated_fat');
                }

                if (!isNaN(food.get('sodium'))) {
                    sodium += quantity * food.get('sodium')
                }
            }
        });

        return {
            calories: Math.round(calories * 100) / 100,
            saturated_fat: Math.round(fat * 100) / 100,
            sodium  : Math.round(sodium * 100) / 100
        }
    }
});

/**
 * This view represent one FoodModel.
 * Listens on clicks for removal, increment and decrement.
 *
 * @type Backbone.View
 */
var FoodView = Backbone.View.extend({
    tagName : 'tr',
    events  : {
        'click .remove'   : 'removeModel',
        'click .decrement': 'decrementQuantity',
        'click .increment': 'incrementQuantity'
    },
    template: _.template($('#food-template').html()),

    /**
     * Listen on remove and change event
     */
    initialize: function() {
        this.listenTo(this.model, 'remove', this.remove);
        this.listenTo(this.model, 'change', this.render);
        this.render();
    },

    /**
     * Render the FoodModel
     *
     * @returns {FoodView}
     */
    render: function () {
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    },

    /**
     * Remove its model
     */
    removeModel: function () {
        App.removeFromPantry(this.model);
    },

    /**
     * Triggers the decrement of its model
     */
    decrementQuantity: function() {
        this.model.decrementQuantity();
    },

    /**
     * Triggers the increment of its model
     */
    incrementQuantity: function() {
        this.model.incrementQuantity();
    }

});

/**
 * This view represents the collection FoodCollection.
 * It listens on add event to render
 *
 * @type Backbone.View
 */
var FoodListView = Backbone.View.extend({
    el: '#pantry-detail',

    /**
     * Listens on add event to render only the new FoodModel freshly added
     */
    initialize: function() {
        this.$tbody = this.$el.find('tbody');
        this.$tfoot = this.$el.find('tfoot');
        this.listenTo(this.model, 'add', this.renderOne);
        this.listenTo(this.model, 'update', this.renderTotals);
        this.render();
    },

    /**
     * Render the FoodModel in parameter, appends it to the list
     *
     * @param {FoodModel} food
     */
    renderOne: function(food) {
        var view = new FoodView({model: food});
        this.$tbody.append(view.render().el);

        this.renderTotals();
    },

    /**
     * Render all FoodModel.
     * Supposed to be called only one time, on initialize, for performance purposes.
     */
    render: function() {
        this.$tbody.html('');
        var _tbody = this.$tbody;

        this.model.models.forEach(function(food){
            var view = new FoodView({model: food});
            _tbody.append(view.render().el)
        });

        this.renderTotals();
    },

    renderTotals: function() {
        var totals = this.model.getTotals();
        var thresholdsExceeded = App.checkThresholdCalories();


        var classSodiumDanger = "";
        if (thresholdsExceeded['sodium']) {
            classSodiumDanger = 'class="text-danger"';
        }

        var classCaloriesDanger = "";
        if (thresholdsExceeded['calories']) {
            classCaloriesDanger = 'class="text-danger"';
        }

        var row = $('<tr></tr>');
        row.append('<td><strong>Total</strong></td>')
            .append('<td><strong ' + classCaloriesDanger + '>' + totals['calories'] + '</strong></td>')
            .append('<td><strong>' + totals['saturated_fat'] + '</strong></td>')
            .append('<td><strong ' + classSodiumDanger+'>' + totals['sodium'] + '</strong></td>')
            .append('<td></td>');
        this.$tfoot.html(row);
    }
});