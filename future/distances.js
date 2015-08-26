/**
 * @module distances
 * @dependency core
 * @description Natural language processing for distances.
 */
(function (exports) {
    'use strict';
    
    var convert = {
        yard: {
            to: {
                kilometer: function (yards) {
                    return yards * 0.0009144;
                },
                meter: function (yards) {
                    return yards * 0.9144;
                },
                centimeter: function (yards) {
                    return yards * 91.44;
                },
                millimeter: function (yards) {
                    return yards * 914.4;
                },
                mile: function (yards) {
                    return yards * 0.000568182;
                },
                foot: function (yards) {
                    return yards * 3;
                },
                inch: function (yards) {
                    return yards * 36;
                },
                mile: function (yards) {
                    return yards * 0.000568182;
                },
                nauticalMile: function (yards) {
                    return yards * 0.000493737;
                }
            }
        },
    };
    
    var Locales = {
        'en-US': {
            'code': 'en-US',
            'mile': {
                'full': ['miles', 'mile'],
                'symbol': ['mi']
            },
            'yard': {
                'full': ['yards', 'yard'],
                'abbrev': ['ft','\''],
            },
            'foot': {
                'full': ['foot', 'feet'],
                'abbrev': ['ft','\''],
            },
            'inch': {
                'full': ['inches', 'inch'],
                'abbrev': ['in','"']
            },
            'kilometer': {
                'full': ['kilometers', 'kilometer'],
                'abbrev': ['km'],
            },
            'meter': {
                'full': ['meters', 'meter'],
                'abbrev': ['m'],
            },
            'centimeter': {
                'full': ['centimeters', 'centimeter'],
                'abbrev': ['cm'],
            },
            'millimeter': {
                'full': ['millimeters', 'millimeter'],
                'abbrev': ['mm'],
            },
            'distanceJoiners': [',',', and',',and','and',''],
            'modifierJoiners': ['of an','of a','an','a',''],
        },

    };
    
    /**
     * This takes any string, locates groups of 
     * durations and returns results
     */
    exports.parse = function (input, locale) {

        /**
         * Set the locale used for matching
         * and default to the CurrentLocale
         * if not specified.
         */
//        if (locale && Locales[locale]) {
//            locale = Locales[locale];
//        } else {
//            locale = Locales['en-US'];
//        }
//        
    };
    
    /**
     * Define core and preparse dependencies
     */
    if (typeof require !== 'undefined') {
        var core = require('./core.js');
    } else {
        var core = window['babble'];
    }

    /**
     * Define MomentTranslator class
     */
    var DistanceTranslator = function (onTranslate, locale) {
        this.name = 'distances';
        this.parse = parse;
        core.BaseTranslator.call(this, onTranslate, locale);
    }
    DistanceTranslator.prototype = Object.create(core.BaseTranslator.prototype);
    DistanceTranslator.prototype.constructor = MomentTranslator;
    exports.DistanceTranslator = DistanceTranslator;
    
    /**
     * Register translator with the core list
     */
//    var defaultLocale = 'en-US';
//    var locales = [];
//    for (var name in Locales) {
//      locales.push(name);
//    }
//    core.register('moments', MomentTranslator, defaultLocale, locales);

}(typeof exports === 'undefined' ? this['babble'] = this['babble'] || {} : exports));