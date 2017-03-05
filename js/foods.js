/**
 * This object represents a food stored in the pantry.
 * It has an id, a name, a quantity and some calories, saturated fat and sodium.
 *
 * @type Backbone.Model
 */
var FoodModel = Backbone.Model.extend({
    defaults    : {
        id      : null,
        name    : 'Random name',
        calories: 0,
        saturated_fat: 0,
        sodium  : 0,
        quantity: 1
    },

    /**
     * Decrement by one the total quantity of the food, until a minimum of 0.
     */
    decrementQuantity: function() {
        if (this.get('quantity') - 1 >= 0) {
            this.set({quantity: this.get('quantity') - 1});
        }
    },

    /**
     * Increment by one the total quantity of the food, until a maximum of 50.
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
 * @see FoodModel
 *
 * @type Backbone.Collection
 */
var FoodCollection = Backbone.Collection.extend({
    model      : FoodModel,
    comparator : 'name',

    /**
     * Listens on change (of a model) event to update the locally stored pantry and inform the profile of its changes.
     */
    initialize: function() {
        this.on('change', function() {
            App.savePantry();
            this.trigger('update');
        }, this)
    },

    /**
     * Returns the total of calories, saturated fat and sodium.
     *
     * @returns {
     *  {
     *      calories: number,
     *      saturated_fat: number,
     *      sodium: number
     *  }
     * }
     */
    getTotals: function() {
        var calories = 0;
        var fat      = 0;
        var sodium   = 0;

        // For each model, we add to the total only if it has a quantity and if the corresponding attribute is not empty
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

        // Rounded to the second decimal
        return {
            calories: Math.round(calories * 100) / 100,
            saturated_fat: Math.round(fat * 100) / 100,
            sodium  : Math.round(sodium * 100) / 100
        }
    }
});

/**
 * This view represent one FoodModel under a li tag.
 * Listens on clicks for removal, increment and decrement.
 * @see FoodModel
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
 * It listens on add event to render only the new model.
 * @see FoodCollection
 *
 * @type Backbone.View
 */
var FoodListView = Backbone.View.extend({
    el: '#pantry-detail',

    /**
     * Listens on add event to render only the new FoodModel freshly added.
     * On update event (the collection changed), the view renders only the total, but this event is compatible with
     * add event, so, no problem.
     */
    initialize: function() {
        this.$tbody = this.$el.find('tbody');
        this.$tfoot = this.$el.find('tfoot');
        this.$remaining = this.$el.parent('div').prev();
        this.listenTo(this.model, 'add', this.renderOne);
        this.listenTo(this.model, 'update', this.renderTotals);
        this.render();
    },

    /**
     * Render the FoodModel in parameter, appends it to the list.
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

    /**
     * Renders the row of totals, at the bottom of the pantry table.
     */
    renderTotals: function() {
        var totals = this.model.getTotals();
        var thresholdsExceeded       = App.checkThresholds();
        var caloriesAccordingProfile = App.getCaloriesAccordingProfile();

        // Checks the remaining calories according to the profile
        var caloriesRemaining = 0;
        var classRemaining    = 'success';
        if (caloriesAccordingProfile != false) {
            caloriesRemaining = Math.round((caloriesAccordingProfile - totals['calories']) * 100) / 100;
            if (caloriesRemaining < 0) {
                classRemaining= 'danger';
            }
        }
        this.$remaining.html('<strong>Calories remaining : <span class="text-' + classRemaining + '">' + caloriesRemaining.toString() + '</span></strong>');

        // Cleans the toastr to display the next without overload the UI
        if (toastr !== null) {
            toastr.remove();
        }

        // Check if the threshold of sodium has been exceeded
        // If yes, a toastr is raised and the text is displayed in red
        var classSodiumDanger = "";
        if (thresholdsExceeded['sodium']) {
            classSodiumDanger = 'class="text-danger"';

            if (toastr !== null) {
                toastr.warning('You exceeded your recommended quantity of sodium (5g).');
            }
        }

        // Check if the threshold of calories has been exceeded
        // If yes, a toastr is raised and the text is displayed in red
        var classCaloriesDanger = "";
        if (thresholdsExceeded['calories']) {
            classCaloriesDanger = 'class="text-danger"';

            if (toastr !== null) {
                toastr.warning('You exceeded your recommended quantity of calories ' +
                    (caloriesAccordingProfile ? '(' + caloriesAccordingProfile + 'kcal)' : ''));
            }
        }

        // Appends the row in table footer
        var row = $('<tr></tr>');
        row.append('<td><strong>Total</strong></td>')
            .append('<td><strong ' + classCaloriesDanger + '>' + totals['calories'] + '</strong></td>')
            .append('<td><strong>' + totals['saturated_fat'] + '</strong></td>')
            .append('<td><strong ' + classSodiumDanger+'>' + totals['sodium'] + '</strong></td>')
            .append('<td></td>');
        this.$tfoot.html(row);
    }
});