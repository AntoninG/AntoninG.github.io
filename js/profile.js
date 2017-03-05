/**
 * This object represents the user's profile with his age and weight.
 * Based on these two information, the profile calculate if the totals are higher than the recommended values.
 *
 * @type Backbone.Model
 */
var ProfileModel = Backbone.Model.extend({
    defaults : {
        age     : null,
        gender  : null,
        threshold_calories: null,
        threshold_sodium  : 5000
    },

    initialize: function() {
        this.on('change', function() {
            this.get('model').trigger('update');
        }, this);
    },

    /**
     * Set the age of the profile
     *
     * @param {string} value
     */
    setAge: function(value) {
        this.set({age: value});
    },

    /**
     * Set the gender of the profile
     *
     * @param {string} value
     */
    setGender: function(value) {
        this.set({gender: value});
    },

    /**
     * Set the calories threshold
     *
     * @param {number} value
     * @returns {boolean}
     *      true if the value is set
     *      false if the value given is invalid
     */
    setThresholdCalories: function(value) {
        if (!isNaN(value) && value < 50000) {
            this.set({threshold_calories: value});
            return true;
        } else {
            return false;
        }
    },

    /**
     * Returns the threshold_calories of the profile
     *
     * @returns {number|null}
     */
    getThresholdCalories: function() {
        return this.get('threshold_calories');
    },

    /**
     * Returns the max calories recommended according to the age and gender of user
     *
     * @returns {number|boolean}
     *      returns false if age or gender values are not among the allowed values
     */
    getCaloriesAccordingProfile: function() {
        switch (this.get('age')) {
            case '0-15':
                return 1600;
            case '16-20':
                switch (this.get('gender')) {
                    case 'f':
                        return 2400;
                    case 'm':
                        return 2900;
                    default:
                        return false;
                }
            case '21-59':
                switch (this.get('gender')) {
                    case 'f':
                        return 2200;
                    case 'm':
                        return 2800;
                    default:
                        return false;
                }
            case '60+':
                switch (this.get('gender')) {
                    case 'f':
                        return 1800;
                    case 'm':
                        return 200;
                    default:
                        return false;
                }
            default:
                return false;
        }
    },

    /**
     * Check if all the thresholds are respected, according to the profile.
     *
     * @returns {
     *  {
     *      calories: boolean,
     *      saturated_fat: boolean,
     *      sodium: boolean
     *  }
     * }
     */
    checkThresholdCalories: function() {
        var thresholdsExceeded = {
            calories     : false,
            saturated_fat: false,
            sodium       : false
        };

        var totals = this.get('model').getTotals();

        var caloriesAccordingProfile = this.getCaloriesAccordingProfile();
        if (caloriesAccordingProfile != false && totals['calories'] >= caloriesAccordingProfile) {
            thresholdsExceeded['calories'] = true;
        }

        if (totals['sodium'] >= this.get('threshold_sodium')) {
            thresholdsExceeded['sodium'] = true;
        }

        return thresholdsExceeded;
    }

});

/**
 * This view represents the ProfileModel.
 * Listens on change of age, gender and maximum calories inputs
 *
 * @type Backbone.View
 */
var ProfileView = Backbone.View.extend({
    el: '#profile-detail',
    events: {
        'change input[name="input-age"]': 'setAge',
        'change input[name="input-gender"]': 'setGender',
        'change #max-calories': 'setThresholdCalories'
    },

    /**
     * Set the age et the gender on start
     */
    initialize: function() {
        this.$inputsAge     = this.$el.find('#profile-age');
        this.$inputsGender  = this.$el.find('#profile-gender');
        this.$inputThreshold= this.$el.find('#max-calories');
        this.setAge();
        this.setGender();
    },

    /**
     * Set the age of its model
     */
    setAge: function() {
        this.model.setAge(this.$inputsAge.find('input[type="radio"]:checked').val());
    },

    /**
     * Set the gender of its model
     */
    setGender: function() {
        this.model.setGender(this.$inputsGender.find('input[type="radio"]:checked').val());
    },

    /**
     * Set the calories threshold. If the model return false, an alert is raised.
     */
    setThresholdCalories: function () {
        var boolean = this.model.setThresholdCalories(Math.round(this.$inputThreshold.val()));
        if (boolean != true) {
            toastr.remove();
            toastr.error('You gave an invalid value for calories threshold.');
        }
    }
});