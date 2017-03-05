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

    setAge: function(value) {
        this.set({age: value});
    },

    setGender: function(value) {
        this.set({gender: value});
    },

    setThresholdCalories: function(value) {
        if (!isNaN(value) && value < 50000) {
            this.set({threshold_calories: value});
            return true;
        } else {
            return false;
        }
    },

    getThresholdCalories: function() {
        return this.get('threshold_calories');
    },


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

    checkThresholdCalories: function() {
        var thresholdsExceeded = {
            calories     : false,
            saturated_fat: false,
            sodium       : false
        };

        var totals = this.get('model').getTotals();

        var caloriesAccordingProfile = this.getCaloriesAccordingProfile();
        console.log(this.get('age'));
        console.log(this.get('gender'));
        console.log(caloriesAccordingProfile);
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
     * Listens on change event to render the profile
     */
    initialize: function() {
        this.$inputsAge     = this.$el.find('#profile-age');
        this.$inputsGender  = this.$el.find('#profile-gender');
        this.$inputThreshold= this.$el.find('#max-calories');
        this.listenTo(this.model, 'change', this.render);
        this.setAge();
        this.setGender();
        this.render();
    },

    setAge: function() {
        this.model.setAge(this.$inputsAge.find('input[type="radio"]:checked').val());
    },

    setGender: function() {
        this.model.setGender(this.$inputsGender.find('input[type="radio"]:checked').val());
    },

    setThresholdCalories: function () {
        var boolean = this.model.setThresholdCalories(Math.round(this.$inputThreshold.val()));
        if (boolean != true) {
            toastr.error('You gave an invalid value for calories threshold.');
        }
    }
});