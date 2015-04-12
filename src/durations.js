/**
 * @module durations
 * @dependency core
 * @description Natural language processing for Durations of time.
 */
(function (exports) {
    'use strict';
    
    /**
     * Define core and preparse dependencies
     */
    if (typeof require !== 'undefined') {
        var core = require('./core.js');
        var numbers = require('./numbers.js');
    } else {
        var core = window['__babelchip_core__']
    }
    var Preparsers = [
        numbers || window['numbers']
    ];
    
    var Locales = {
        'en-US': {
            'hours': [
                'h', 'hr', 'hrs', 'hour', 'hours'
            ],
            'minutes': [
                'm','min','mins','minute', 'minutes'
            ],
            'joiners': [',','and','']
        }
    };
    
    var CurrentLocale = Locales['en-US'];
    
    Locales['de-DE'] = {
        'hours': [
            'h', 'hr', 'ohre'
        ],
        'minutes': [
            'm','min','minuten'   
        ]
    };
    

    /**
     * Create Duration object
     */
    exports.Duration = function (milliseconds) {
        this.value = milliseconds;
        
        this.milliseconds = milliseconds;
        this.seconds = 0;
        this.minutes = 0;
        this.hours = 0;
        this.days = 0;

        if (milliseconds > 999) {
            this.seconds = Math.floor(this.milliseconds / 1000);;
            this.milliseconds = this.milliseconds % 1000;
            if (this.seconds > 59) {
                this.minutes = Math.floor(this.seconds / 60);
                this.seconds -= this.minutes * 60;
                if (this.minutes > 59) {
                    this.hours = Math.floor(this.minutes / 60);
                    this.minutes -= this.hours * 60;
                    if (this.hours > 23) {
                        this.days = Math.floor(this.hours / 24);
                        this.hours -= this.days * 24;
                    }
                }
            }
        }
    }
    
    /**
     * Pluralizes a word (US English) based on the count
     */
    var zeroOneOrMany = function (noun, count) {
        
        var plural = function (noun) {
            if (noun[noun.length - 1] === 'y') {
                return noun.substring(0, noun.length - 1) + 'ies';
            } else {
                return noun + 's';
            }
        }
        
        if (count === 0) {
            return 'no ' + plural(noun);
        } else if (count === 1) {
            return noun;
        } else {
            return plural(noun);
        }
    };
    
    exports.Duration.prototype.hoomanize = function (unitOfSpecificity) {
        
        if (typeof unitOfSpecificity === 'undefined' || unitOfSpecificity === null || !this.hasOwnProperty(unitOfSpecificity)) {
            unitOfSpecificity = 'milliseconds';
        }
        
        var info = [];
        if (this.days) {
            info.push(this.days + ' ' + zeroOneOrMany('day', this.days));   
        }
        if (unitOfSpecificity === 'days') {
            return info.join(', ');
        }
        if (this.hours) {
            info.push(this.hours + ' ' + zeroOneOrMany('hour', this.hours));   
        }
        if (unitOfSpecificity === 'hours') {
            return info.join(', ');
        }
        if (this.minutes) {
            info.push(this.minutes + ' ' + zeroOneOrMany('minute', this.minutes));   
        }
        if (unitOfSpecificity === 'minutes') {
            return info.join(', ');
        }
        if (this.seconds) {
            info.push(this.seconds + ' ' + zeroOneOrMany('second', this.seconds));   
        }
        if (unitOfSpecificity === 'seconds') {
            return info.join(', ');
        }
        if (this.milliseconds) {
            info.push(this.milliseconds + ' ' + zeroOneOrMany('millisecond', this.milliseconds));   
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
    exports.parse = function (input, locale) {

        /**
         * Set the locale used for matching
         * and default to the CurrentLocale
         * if not specified.
         */
        if (locale && Locales[locale]) {
            locale = Locales[locale];
        } else {
            locale = CurrentLocale;   
        }
        
        /**
         * Run pre-parsing dependencies
         */ 
        var preParsedOutput = input, preParsedResults = [];
        if (Preparsers && Preparsers.length > 0) {
            for (var i = 0; i < Preparsers.length; i++) {
                preParsedResults.push(Preparsers[i].parse(preParsedOutput, locale));
                preParsedOutput = preParsedResults[i].digify();
            }
        }
        
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
            
            /((\d)+ *?(days|day|dys|dy|d){1})?/gi,
            /((\d)+ *?(hours|hour|hrs|hr|h){1})?/gi,
            /((\d)+ *?(minutes|minute|mins|min|m){1})?/gi,
            /((\d)+ *?(seconds|second|secs|sec|s){1})?/gi,
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
            
            text = text.replace(reDays, ' * 24 * 60 * 60 * 1000');
            text = text.replace(reHours, ' * 60 * 60 * 1000');
            text = text.replace(reMinutes, ' * 60 * 1000');
            text = text.replace(reMilliseconds, '');
            text = text.replace(reSeconds, ' * 1000');
            segments[i].value = parseFloat(eval(text));
        }
        
        var results = [];
        var prev = null;
        var next = null;
        for (var i = 0; i < segments.length; i++) {
            next = segments[i];
            if (prev) {
                var joiner = preParsedOutput.slice(prev.pos + prev.text.length, next.pos);
                if (locale.joiners.indexOf(joiner.trim()) > -1) {
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

}(typeof exports === 'undefined' ? this['durations'] = {}: exports));