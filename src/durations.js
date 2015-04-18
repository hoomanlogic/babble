/**
 * @module durations
 * @dependency core
 * @description Natural language processing for Durations of time.
 */
(function (exports) {
    'use strict';

    var Locales = {
        'en-US': {
            'millennium': {
                'full': ['millennium', 'millennia']
            },
            'century': {
                'full': ['centuries', 'century']
            },
            'decade': {
                'full': ['decades', 'decade']
            },
            'year': {
                'full': ['years', 'year'],
                'short': ['yr'],
                'symbol': ['y']
            },
            'day': {
                'full': ['days', 'day'],
                'short': ['dys', 'dy'],
                'symbol': ['d']
            },
            'hour': {
                'full': ['hours', 'hour'],
                'short': ['hrs', 'hr'],
                'symbol': ['h'],
            },
            'minute': {
                'full': ['minutes', 'minute'],
                'short': ['mins', 'min'],
                'symbol': ['m'],
            },
            'second': {
                'full': ['seconds', 'second'],
                'short': ['secs', 'sec'],
                'symbol': ['s'],
            },
            'millisecond': {
                'full': ['milliseconds', 'millisecond'],
                'short': ['millisecs', 'millisec', 'msecs', 'msec'],
                'symbol': ['ms'],
            },
            'timeJoiners': [',',', and',',and','and',''],
            'modifierJoiners': ['of an','of a','an','a',''],
            
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
    var decadeInt = 10 * yearInt;
    var centuryInt = 10 * decadeInt;
    var millenniumInt = 10 * centuryInt;
    
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
            this.years = Math.floor(leftOver / yearInt);
            leftOver -= this.years * yearInt;
        }
        if (leftOver >= dayInt) {
            this.days = Math.floor(leftOver / dayInt);
            leftOver -= this.days * dayInt;
        }
        if (leftOver >= hourInt) {
            this.hours = Math.floor(leftOver / hourInt);
            leftOver -= this.hours * hourInt;
        }
        if (leftOver >= minuteInt) {
            this.minutes = Math.floor(leftOver / minuteInt);
            leftOver -= this.minutes * minuteInt;
        }
        if (leftOver >= secondInt) {
            this.seconds = Math.floor(leftOver / secondInt);
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
        if (this.years) {
            info.push(this.years + ' ' + locale.formatNoun(locale.year.full[1], this.years));   
        }
        if (unitOfSpecificity === 'days') {
            return info.join(', ');
        }
        if (this.days) {
            info.push(this.days + ' ' + locale.formatNoun(locale.day.full[1], this.days));   
        }
        if (unitOfSpecificity === 'days') {
            return info.join(', ');
        }
        if (this.hours) {
            info.push(this.hours + ' ' + locale.formatNoun(locale.hour.full[1], this.hours));   
        }
        if (unitOfSpecificity === 'hours') {
            return info.join(', ');
        }
        if (this.minutes) {
            info.push(this.minutes + ' ' + locale.formatNoun(locale.minute.full[1], this.minutes));   
        }
        if (unitOfSpecificity === 'minutes') {
            return info.join(', ');
        }
        if (this.seconds) {
            info.push(this.seconds + ' ' + locale.formatNoun(locale.second.full[1], this.seconds));   
        }
        if (unitOfSpecificity === 'seconds') {
            return info.join(', ');
        }
        if (this.milliseconds) {
            info.push(this.milliseconds + ' ' + locale.formatNoun(locale.millisecond.full[1], this.milliseconds));   
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
            /(((\d)+|half of an |half of a |half an |half a |half|quarter|an |a ) *?(years|year|yrs|yr|y){1})?/gi,
            /(((\d)+|half of an |half of a |half an |half a |half|quarter|an |a ) *?(days|day|dys|dy|d){1})?/gi,
            /(((\d)+|half of an |half of a |half an |half a |half|quarter|an |a ) *?(hours|hour|hrs|hr|h){1})?/gi,
            /(((\d)+|half of an |half of a |half an |half a |half|quarter|an |a ) *?(minutes|minute|mins|min|m){1})?/gi,
            /(((\d)+|half of an |half of a |half an |half a |half|quarter|an |a ) *?(seconds|second|secs|sec|s){1})?/gi,
            /((\d)+ *?(milliseconds|millisecond|millisecs|millisec|msecs|msec|ms){1})?/gi
        ];
        
        var names = []
            .concat(locale.millennium.full)
            .concat(locale.century.full)
            .concat(locale.decade.full)
            .concat(locale.year.full)
            .concat(locale.day.full)
            .concat(locale.hour.full)
            .concat(locale.minute.full)
            .concat(locale.second.full)
            .concat(locale.millisecond.full)
            .concat(locale.year.short)
            .concat(locale.day.short)
            .concat(locale.hour.short)
            .concat(locale.minute.short)
            .concat(locale.second.short)
            .concat(locale.millisecond.short)
            .concat(locale.year.symbol)
            .concat(locale.day.symbol)
            .concat(locale.hour.symbol)
            .concat(locale.minute.symbol)
            .concat(locale.second.symbol)
            .concat(locale.millisecond.symbol);
        
        var getValue = function (name) {
            var isMillennium = function (name) {
                if (locale.millennium.full.indexOf(name) > -1) {
                    return true;
                }
                return false;
            };
            
            var isCentury = function (name) {
                if (locale.century.full.indexOf(name) > -1) {
                    return true;
                }
                return false;
            };
            
            var isDecade = function (name) {
                if (locale.decade.full.indexOf(name) > -1) {
                    return true;
                }
                return false;
            };
            
            var isYear = function (name) {
                if (locale.year.full.indexOf(name) > -1) {
                    return true;
                }
                if (locale.year.short.indexOf(name) > -1) {
                    return true;
                }
                if (locale.year.symbol.indexOf(name) > -1) {
                    return true;
                }
                return false;
            };
            
            var isDay = function (name) {
                if (locale.day.full.indexOf(name) > -1) {
                    return true;
                }
                if (locale.day.short.indexOf(name) > -1) {
                    return true;
                }
                if (locale.day.symbol.indexOf(name) > -1) {
                    return true;
                }
                return false;
            };

            var isHour = function (name) {
                if (locale.hour.full.indexOf(name) > -1) {
                    return true;
                }
                if (locale.hour.short.indexOf(name) > -1) {
                    return true;
                }
                if (locale.hour.symbol.indexOf(name) > -1) {
                    return true;
                }
                return false;
            };
            
            var isMinute = function (name) {
                if (locale.minute.full.indexOf(name) > -1) {
                    return true;
                }
                if (locale.minute.short.indexOf(name) > -1) {
                    return true;
                }
                if (locale.minute.symbol.indexOf(name) > -1) {
                    return true;
                }
                return false;
            };
            
            var isSecond = function (name) {
                if (locale.second.full.indexOf(name) > -1) {
                    return true;
                }
                if (locale.second.short.indexOf(name) > -1) {
                    return true;
                }
                if (locale.second.symbol.indexOf(name) > -1) {
                    return true;
                }
                return false;
            };
            
            var isMillisecond = function (name) {
                if (locale.millisecond.full.indexOf(name) > -1) {
                    return true;
                }
                if (locale.millisecond.short.indexOf(name) > -1) {
                    return true;
                }
                if (locale.millisecond.symbol.indexOf(name) > -1) {
                    return true;
                }
                return false;
            };
            
            if (isMillennium(name)) {
                return millenniumInt;   
            }
            if (isCentury(name)) {
                return centuryInt;   
            }
            if (isDecade(name)) {
                return decadeInt;   
            }
            if (isYear(name)) {
                return yearInt;   
            }
            if (isDay(name)) {
                return dayInt;
            }
            if (isHour(name)) {
                return hourInt;   
            }
            if (isMinute(name)) {
                return minuteInt;
            }
            if (isSecond(name)) {
                return secondInt;
            }
            if (isMillisecond(name)) {
                return 1;
            }
            throw new Error('Invalid duration name');
        };


        /**
         * Run pre-parsing dependencies
         */
        var preParse = this.passToAssistants(input, locale);
        var preParsedOutput = preParse.preParsedOutput, 
            preParsedResults = preParse.preParsedResults;
        
        /**
         * Array for holding number matches
         */
        var matches = [];
        
        //http://leaverou.github.io/regexplained/
        var match;
        // use negative lookahead to avoid matching partial words 
        // without consuming a digit that could otherwise be a part
        // of the following match
        var re = new RegExp('(\\b|\\d)(' + names.join('|') + ')(?![a-zA-Z])', 'gi')
        while ((match = re.exec(input)) !== null) {
            var truePos = match.index + (match[1] || '').length;
            core.insertMatch(matches, {
                kind: 'duration.name',
                pos: truePos,
                text: match[2],
                value: getValue(match[2])
            });
        };
        
        /**
         * Add numerical language matches
         */
        //input.replace(/((\d)+:(\d)+(:(\d)+)?(:(\d)+)?(\.(\d){1,3})?)/gi, function () {
        re = /((\d)+:(\d)+(:(\d)+)?(:(\d)+)?(\.(\d){1,3})?)/gi;
        while ((match = re.exec(input)) !== null) {
            if (arguments[0].trim() !== '') {
                core.insertMatch(matches, {
                    kind: 'duration.full',
                    pos: match.index,
                    text: match[0],
                    value: null
                });
            }
        };
        
        /**
         * Get token closest to current match that is 
         * between the previous and current match.
         * As always, a collection of tokens is assumed 
         * to already be ordered by pos prop.
         */
        var getTokenModifier = function (tokens, match, previousMatch) {
            
            var lowerBound = 0;
            var upperBound = match.pos;
            if (typeof previousMatch !== 'undefined' && previousMatch !== null) {
                lowerBound = previousMatch.pos + previousMatch.text.length;
            }
            
            var i = 0,
                token = null;
            
            for (var i = 0; i < tokens.length; i++) {
                if (lowerBound <= tokens[i].pos && tokens[i].pos < upperBound) {
                    token = tokens[i];
                } else if (tokens[i].pos >= upperBound) {
                    break;   
                }
            }
            
            return token;
        }
        
        if (matches.length === 0) {
            return new core.ParsedResult(input, [], preParsedOutput, preParsedResults); 
        }

        var results = [];
        var segments = [];
        var previousMatch = null;
        for (var i = 0; i < matches.length; i++) {
            
            if (matches[i].kind === 'duration.full') {
                
                var timeSegments = matches[i].text.split(':');
                var timeSum = 0;
                if (timeSegments.length === 4) {
                    timeSum += parseFloat(timeSegments[0]) * dayInt;
                    timeSum += parseInt(timeSegments[1]) * hourInt;
                    timeSum += parseInt(timeSegments[2]) * minuteInt;
                    timeSum += parseFloat(timeSegments[3]) * secondInt;
                } else if (timeSegments.length === 3) {
                    timeSum += parseInt(timeSegments[0]) * hourInt;
                    timeSum += parseInt(timeSegments[1]) * minuteInt;
                    timeSum += parseFloat(timeSegments[2]) * secondInt;
                } else if (timeSegments.length === 2) {
                    timeSum += parseInt(timeSegments[0] * hourInt);
                    timeSum += parseInt(timeSegments[1] * minuteInt);
                }
                
                
                segments.push({
                    kind: 'duration',
                    pos: matches[i].pos,
                    text: matches[i].text,
                    value: timeSum
                });
                continue;
            }
            
            /**
             * Find number token that modifies this duration match
             */
            var numToken = getTokenModifier(preParsedResults['numbers'].tokens, matches[i], previousMatch);
            
            /**
             * This match segment has no modifier
             */
            if (numToken === null) {
                segments.push({
                    kind: 'segment',
                    pos: matches[i].pos,
                    text: matches[i].text,
                    value: matches[i].value
                });
                continue;
            }
            
            /**
             * Check i
             */
            var theSpaceBetween = input.slice(numToken.pos + numToken.text.length, matches[i].pos);
            if (locale.modifierJoiners.indexOf(theSpaceBetween.trim()) > -1) {
                segments.push({
                    kind: 'segment',
                    pos: numToken.pos,
                    text: input.slice(numToken.pos, matches[i].pos + matches[i].text.length),
                    value: numToken.value * matches[i].value
                });
            }
            
            /**
             * Set previousMatch to current match for use in next iteration
             */
            previousMatch = matches[i];
        }
        
        /**
         * Combine segments
         */
        
        var prev = null;
        var next = null;
        for (var i = 0; i < segments.length; i++) {
            next = segments[i];
            if (prev) {
                var joiner = input.slice(prev.pos + prev.text.length, next.pos);
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
        var core = window['babble'];
        var numbers = window['babble'];
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

}(typeof exports === 'undefined' ? this['babble'] = this['babble'] || {} : exports));