/**
 * @module durations
 * @dependency core
 * @description Natural language processing for Durations of time.
 */
(function (exports) {
    'use strict';

    var Locales = {
        'en-US': {
            'year': {
                'full': 'year',
                'short': 'yr',
                'symbol': 'y'
            },
            'day': {
                'full': 'day',
                'short': 'dy',
                'symbol': 'd'
            },
            'hour': {
                'full': 'hour',
                'short': 'hr',
                'symbol': 'h',
            },
            'minute': {
                'full': 'minute',
                'short': 'min',
                'symbol': 'm',
            },
            'second': {
                'full': 'second',
                'short': 'sec',
                'symbol': 's',
            },
            'millisecond': {
                'full': 'millisecond',
                'short': 'msec',
                'symbol': 'ms',
            },
            'timeJoiners': [',','and',''],
            'modifierJoiners': ['of an','an','a',''],
            'modifiers': {
                'quarter': 0.25,
                'half': 0.5
            },
            /**
             * Pluralizes a word based on how many
             */
            formatNoun: function (noun, howMany) {

                var plural = function (noun) {
                    var vowels = ['a','e','i','o','u'];
                    if (noun[noun.length - 1] === 'y' && vowels.indexOf(noun[noun.length - 2].toLowerCase()) === -1) {
                        return noun.substring(0, noun.length - 1) + 'ies';
                    } else {
                        return noun + 's';
                    }
                }

                if (howMany === 0) {
                    return 'no ' + plural(noun);
                } else if (howMany === 1) {
                    return noun;
                } else {
                    return plural(noun);
                }
            }
        },

    };
//    Locales['de-DE'] = {
//        'hours': [
//            'h', 'hr', 'ohre'
//        ],
//        'minutes': [
//            'm','min','minuten'   
//        ]
//    };

    /**
     * Module variables for duration calculations
     */
    var secondInt = 1000;
    var minuteInt = 60 * secondInt;
    var hourInt = 60 * minuteInt;
    var dayInt = 24 * hourInt;
    var yearInt = 365 * dayInt;
    
    /**
     * Create Duration object
     */
    exports.Duration = function (milliseconds) {
        
        this.value = milliseconds;
        
        this.milliseconds = 0;
        this.seconds = 0;
        this.minutes = 0;
        this.hours = 0;
        this.days = 0;
        this.years = 0;

        var leftOver = milliseconds;
        if (leftOver >= yearInt) {
            this.years = Math.floor(leftOver / yearInt);;
            leftOver -= this.years * yearInt;
        }
        if (leftOver >= dayInt) {
            this.days = Math.floor(leftOver / dayInt);;
            leftOver -= this.days * dayInt;
        }
        if (leftOver >= hourInt) {
            this.hours = Math.floor(leftOver / hourInt);;
            leftOver -= this.hours * hourInt;
        }
        if (leftOver >= minuteInt) {
            this.minutes = Math.floor(leftOver / minuteInt);;
            leftOver -= this.minutes * minuteInt;
        }
        if (leftOver >= secondInt) {
            this.seconds = Math.floor(leftOver / secondInt);;
            leftOver -= this.seconds * secondInt;
        }
        this.milliseconds = leftOver;
    }
    
    
    exports.Duration.prototype.hoomanize = function (unitOfSpecificity, locale) {
        
        /**
         * Set the locale used for matching
         * and default to the CurrentLocale
         * if not specified.
         */
        if (locale && Locales[locale]) {
            locale = Locales[locale];
        } else {
            locale = Locales[defaultLocale];
        }
        
        if (typeof unitOfSpecificity === 'undefined' || unitOfSpecificity === null || !this.hasOwnProperty(unitOfSpecificity)) {
            unitOfSpecificity = 'milliseconds';
        }
        
        var info = [];
        if (this.days) {
            info.push(this.days + ' ' + locale.formatNoun(locale.day.full, this.days));   
        }
        if (unitOfSpecificity === 'days') {
            return info.join(', ');
        }
        if (this.hours) {
            info.push(this.hours + ' ' + locale.formatNoun(locale.hour.full, this.hours));   
        }
        if (unitOfSpecificity === 'hours') {
            return info.join(', ');
        }
        if (this.minutes) {
            info.push(this.minutes + ' ' + locale.formatNoun(locale.minute.full, this.minutes));   
        }
        if (unitOfSpecificity === 'minutes') {
            return info.join(', ');
        }
        if (this.seconds) {
            info.push(this.seconds + ' ' + locale.formatNoun(locale.second.full, this.seconds));   
        }
        if (unitOfSpecificity === 'seconds') {
            return info.join(', ');
        }
        if (this.milliseconds) {
            info.push(this.milliseconds + ' ' + locale.formatNoun(locale.millisecond.full, this.milliseconds));   
        }
        return info.join(', ');
    }
        
    exports.Duration.prototype.toMinutes = function () {
        if (this.value > 60000) {
            return Math.floor((this.value / 1000) / 60);
        } else {
            return 0;   
        }
    }
    
    exports.Duration.prototype.toString = function (milliseconds) {
        return this.value;
    }

    
    /**
     * This takes any string, locates groups of 
     * durations and returns results
     */
    var parse = function (input, locale) {
    
        /**
         * Set the locale used for matching
         * and default to the CurrentLocale
         * if not specified.
         */
        if (locale && Locales[locale]) {
            locale = Locales[locale];
        } else {
            locale = Locales[defaultLocale];
        }
        
        /**
         * Run pre-parsing dependencies
         */
        var preParse = this.passToAssistants(input, locale);
        var preParsedOutput = preParse.preParsedOutput, preParsedResults = preParse.preParsedResults;
        
        /**
         * These formats come from a project that used a unique approach to parsing,
         * splitting whitespaces and building up the string until it finds a match.
         * This might still be the best way, but trying to avoid that method for now.
         */
        
        var formats = [
            // match positive integers
            // /(\d+)/gi, // add this in when in 'expect' mode - a mode where we know in advance that we are getting duration type input
            // match positive decimal numbers (optional numbers 
            // after decimal and optional hours nouns)
            // /(\d+)\.(\d+)?(hours|hour|hrs|hr|h)?/gi,
            // match #d#h#m format, each part is optional
            // /((\d)+ *?(days|day|dys|dy|d){1})? *?((\d)+ *?(hours|hour|hrs|hr|h){1})? *?((\d)+ *?(minutes|minute|mins|min|m){1})?/gi,
            
            /(((\d)+|half of an|half of a|half an|half a|half|quarter|an|a) *?(days|day|dys|dy|d){1})?/gi,
            /(((\d)+|half of an|half of a|half an|half a|half|quarter|an|a) *?(hours|hour|hrs|hr|h){1})?/gi,
            /(((\d)+|half of an|half of a|half an|half a|half|quarter|an|a) *?(minutes|minute|mins|min|m){1})?/gi,
            /(((\d)+|half of an|half of a|half an|half a|half|quarter|an|a) *?(seconds|second|secs|sec|s){1})?/gi,
            /((\d)+ *?(milliseconds|millisecond|millisecs|millisec|msecs|msec|ms){1})?/gi,
            // match #:#:# format
            /(\d+)?:?(\d+):(\d+)/gi
        ];
        
        /**
         * Function keeps the matches in order by the position
         * so processing doesn't have to worry about sorting it
         */
        var insertMatch = function (arr, obj) {
            if (arr.length === 0 || arr[arr.length - 1].pos < obj.pos) {
                arr.push(obj);   
            } else {
                for (var i = 0; i < arr.length; i++) {
                    if (arr[i].pos > obj.pos) {
                        arr.splice(i, 0, obj);
                        break;
                    } else if (arr[i].pos === obj.pos && arr[i].len < obj.len) {
                        arr.splice(i, 1, obj);
                        break;
                    }
                }
            }
        };

        /**
         * Array for holding number matches
         */
        var matches = [];

        /**
         * Add duration language matches
         */
        for (var i = 0; i < formats.length; i++) {
            preParsedOutput.replace(formats[i], function () {
                //console.log(arguments);
                if (arguments[0].trim() !== '') {
                    insertMatch(matches, {
                        pos: arguments[arguments.length - 2],
                        len: arguments[0].length,
                        value: arguments[0]
                    });
                }
            });
        }
        
        /**
         * Add numerical language matches
         */
        if (matches.length === 0) {
            return new core.ParsedResult(input, [], preParsedOutput, preParsedResults); 
        }

        var segments = [];
        for (var i = 0; i < matches.length; i++) {
            var text = preParsedOutput.slice(matches[i].pos, matches[i].pos + matches[i].len);
            segments.push({ 
                kind: 'duration', 
                pos: matches[i].pos, 
                value: 0, 
                text: text
            });
            
            var reDays = / *?^(days|day|dys|dy|d)$/gi;
            var reHours = / *?(hours|hour|hrs|hr|h)$/gi;
            var reMinutes = / *?(minutes|minute|mins|min|m)$/gi;
            var reSeconds = / *?(seconds|second|secs|sec|s)$/gi;
            var reMilliseconds = / *?(milliseconds|millisecond|millisecs|millisec|msecs|msec|ms)$/gi;
            var reHalf = /(half an|half a|half of an|half of a|half of|half)/gi;
            var reQuarter = /(quarter of an|quarter of a|quarter of|quarter)/gi;
            var reOne = /(an|a)/gi;
            

            
            
            text = text.replace(reSeconds, ' * (1000)');
            text = text.replace(reDays, ' * (24 * 60 * 60 * 1000)');
            text = text.replace(reHours, ' * (60 * 60 * 1000)');
            text = text.replace(reMinutes, ' * (60 * 1000)');
            text = text.replace(reMilliseconds, '');
            
            text = text.replace(reHalf, '0.5 ');
            text = text.replace(reQuarter, '0.25 ');
            text = text.replace(reOne, '1 ');
            segments[i].value = parseFloat(eval(text));
        }
        
        var results = [];
        var prev = null;
        var next = null;
        for (var i = 0; i < segments.length; i++) {
            next = segments[i];
            if (prev) {
                var joiner = preParsedOutput.slice(prev.pos + prev.text.length, next.pos);
                if (locale.timeJoiners.indexOf(joiner.trim()) > -1) {
                    next.value += prev.value;
                    next.text = preParsedOutput.slice(prev.pos, next.pos + next.text.length);
                    next.pos = prev.pos;
                } else {
                    results.push(prev);
                }
            }
            prev = segments[i];
        }
        results.push(next);
        
        for (var i = 0; i < results.length; i++) {
            results[i].value = new exports.Duration(results[i].value);
        }
        
        /**
         * Create parsed results object and Bind functions to the parsed results for sugar
         */
        return new core.ParsedResult(input, results, preParsedOutput, preParsedResults);
    };
    
                
    /**
     * This takes any string, locates groups of 
     * durations and returns results
     */
    exports.parseOld = function (input, locale) {

        /**
         * Set the locale used for matching
         * and default to the CurrentLocale
         * if not specified.
         */
        if (locale && Locales[locale]) {
            locale = Locales[locale];
        } else {
            locale = Locales[defaultLocale];   
        }
        
        /**
         * Run pre-parsing dependencies
         */
        var pp = core.preParse();
        
        /**
         * These formats come from a project that used a unique approach to parsing,
         * splitting whitespaces and building up the string until it finds a match.
         * This might still be the best way, but trying to avoid that method for now.
         */
        
        var formats = [
            // match positive integers
            // /(\d+)/gi, // add this in when in 'expect' mode - a mode where we know in advance that we are getting duration type input
            // match positive decimal numbers (optional numbers 
            // after decimal and optional hours nouns)
            // /(\d+)\.(\d+)?(hours|hour|hrs|hr|h)?/gi,
            // match #d#h#m format, each part is optional
            // /((\d)+ *?(days|day|dys|dy|d){1})? *?((\d)+ *?(hours|hour|hrs|hr|h){1})? *?((\d)+ *?(minutes|minute|mins|min|m){1})?/gi,
            
            /(((\d)+|half of an|half of a|half an|half a|half|quarter|an|a) *?(days|day|dys|dy|d){1})?/gi,
            /(((\d)+|half of an|half of a|half an|half a|half|quarter|an|a) *?(hours|hour|hrs|hr|h){1})?/gi,
            /(((\d)+|half of an|half of a|half an|half a|half|quarter|an|a) *?(minutes|minute|mins|min|m){1})?/gi,
            /(((\d)+|half of an|half of a|half an|half a|half|quarter|an|a) *?(seconds|second|secs|sec|s){1})?/gi,
            /((\d)+ *?(milliseconds|millisecond|millisecs|millisec|msecs|msec|ms){1})?/gi,
            // match #:#:# format
            /(\d+)?:?(\d+):(\d+)/gi
        ];
        
        /**
         * Function keeps the matches in order by the position
         * so processing doesn't have to worry about sorting it
         */
        var insertByPosition = function (arr, obj) {
            if (arr.length === 0 || arr[arr.length - 1].pos < obj.pos) {
                arr.push(obj);   
            } else {
                for (var i = 0; i < arr.length; i++) {
                    if (arr[i].pos > obj.pos) {
                        arr.splice(i, 0, obj);
                        break;
                    } else if (arr[i].pos === obj.pos && arr[i].len < obj.len) {
                        arr.splice(i, 1, obj);
                        break;
                    }
                }
            }
        };

        /**
         * Array for holding number matches
         */
        var matches = [];

        /**
         * Add duration language matches
         */
        for (var i = 0; i < formats.length; i++) {
            preParsedOutput.replace(formats[i], function () {
                //console.log(arguments);
                if (arguments[0].trim() !== '') {
                    insertByPosition(matches, {
                        pos: arguments[arguments.length - 2],
                        len: arguments[0].length,
                        value: arguments[0]
                    });
                }
            });
        }
        
        /**
         * Add numerical language matches
         */
        if (matches.length === 0) {
            return new core.ParsedResult(input, [], preParsedOutput, preParsedResults); 
        }

        var segments = [];
        for (var i = 0; i < matches.length; i++) {
            var text = preParsedOutput.slice(matches[i].pos, matches[i].pos + matches[i].len);
            segments.push({ 
                kind: 'duration', 
                pos: matches[i].pos, 
                value: 0, 
                text: text
            });
            
            var reDays = / *?(days|day|dys|dy|d)$/gi;
            var reHours = / *?(hours|hour|hrs|hr|h)$/gi;
            var reMinutes = / *?(minutes|minute|mins|min|m)$/gi;
            var reSeconds = / *?(seconds|second|secs|sec|s)$/gi;
            var reMilliseconds = / *?(milliseconds|millisecond|millisecs|millisec|msecs|msec|ms)$/gi;
            var reHalf = /(half an|half a|half of an|half of a|half of|half)/gi;
            var reQuarter = /(quarter of an|quarter of a|quarter of|quarter)/gi;
            var reOne = /(an|a)/gi;
            

            
            
            text = text.replace(reSeconds, ' * (1000)');
            text = text.replace(reDays, ' * (24 * 60 * 60 * 1000)');
            text = text.replace(reHours, ' * (60 * 60 * 1000)');
            text = text.replace(reMinutes, ' * (60 * 1000)');
            text = text.replace(reMilliseconds, '');
            
            text = text.replace(reHalf, '0.5 ');
            text = text.replace(reQuarter, '0.25 ');
            text = text.replace(reOne, '1 ');
            segments[i].value = parseFloat(eval(text));
        }
        
        var results = [];
        var prev = null;
        var next = null;
        for (var i = 0; i < segments.length; i++) {
            next = segments[i];
            if (prev) {
                var joiner = preParsedOutput.slice(prev.pos + prev.text.length, next.pos);
                if (locale.timeJoiners.indexOf(joiner.trim()) > -1) {
                    next.value += prev.value;
                    next.text = preParsedOutput.slice(prev.pos, next.pos + next.text.length);
                    next.pos = prev.pos;
                } else {
                    results.push(prev);
                }
            }
            prev = segments[i];
        }
        results.push(next);
        
        for (var i = 0; i < results.length; i++) {
            results[i].value = new exports.Duration(results[i].value);
        }
        
        /**
         * Create parsed results object and Bind functions to the parsed results for sugar
         */
        return new core.ParsedResult(input, results, preParsedOutput, preParsedResults);
    };
    
    /**
     * Define core and preparse dependencies
     */
    if (typeof require !== 'undefined') {
        var core = require('./core.js');
        var numbers = require('./numbers.js');
    } else {
        var core = window['babelchip'];
        var numbers = window['babelchip'];
    }
    
    /**
     * Define DurationTranslator class
     */
    var DurationTranslator = function (onTranslate, locale) {
        this.name = 'durations';
        this.parse = parse;
        this.assistants = ['numbers'];
        core.BaseTranslator.call(this, onTranslate, locale);
    }
    DurationTranslator.prototype = Object.create(core.BaseTranslator.prototype);
    DurationTranslator.prototype.constructor = DurationTranslator;
    exports.DurationTranslator = DurationTranslator;
    
    /**
     * Register this translator with the core list
     */
    var defaultLocale = 'en-US';
    var locales = [];
    for (var name in Locales) {
      locales.push(name);
    }
    core.register('durations', DurationTranslator, defaultLocale, locales);

}(typeof exports === 'undefined' ? this['babelchip'] = this['babelchip'] || {} : exports));