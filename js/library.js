/**
 * The application model.
 * Contains all models and associated views.
 *
 * This object is also the "hub" allowing all models to communicate without speaking directly.
 * E.g : The ResultCollection has no reason to speak directly to the FoodCollection, it only inform the application
 * that there is a new food to add to the pantry.
 */
var App = {
    results : null,
    profile : null,
    view    : {},

    /**
     * Initializes the application
     * Creates the locally stored pantry if it does not already exist
     *
     * Instantiates two collections : one for results and the other for the pantry plus their view
     * Instantiates the profile manager and the search view
     */
    initialize: function () {
        if (!localStorage.pantry) {
            localStorage.pantry = JSON.stringify([]);
        }

        this.results      = new ResultCollection();
        this.pantry       = new FoodCollection(this.getStoredPantry());
        this.profile      = new ProfileModel({model: this.pantry});

        this.view.search  = new SearchView({model: this.results});
        this.view.profile = new ProfileView({model: this.profile});
        this.view.pantry  = new FoodListView({model: this.pantry});
        this.view.results = new ResultListView({model: this.results});
    },

    /**
     * Add a new result model to the application pantry.
     * If the result already exists in the pantry, nothing is added and a warning toaster is raised to inform the user.
     *
     * @param {ResultModel} result
     */
    addToPantry: function(result) {
        if (this.pantry.get(result.attributes.id) === undefined) {
            this.pantry.add(result.attributes);
            this.results.remove(result);
            this.savePantry();
        } else {
            toastr.warning('You already have this food in your pantry.');
        }
    },

    /**
     * Remove a specific FoodModel from the pantry.
     * Update the locally stored pantry.
     *
     * @param {FoodModel} food
     */
    removeFromPantry: function(food) {
        food.collection.remove(food);
        this.savePantry();
    },

    /**
     * Save the pantry locally
     */
    savePantry: function() {
        localStorage.pantry = JSON.stringify(this.pantry.models);
    },

    /**
     * Returns the value of the search
     * @see SearchView.getSearch
     *
     * @returns {string}
     */
    getSearchValue: function() {
        return this.view.search.getSearch().val();
    },

    /**
     * Returns the locally stored pantry
     *
     * @returns {Array}
     */
    getStoredPantry: function () {
        return JSON.parse(localStorage.pantry);
    },

    getThresholdCalories: function() {
        return this.profile.getThresholdCalories();
    },

    checkThresholdCalories: function() {
        return this.profile.checkThresholdCalories();
    }
};