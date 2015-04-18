/**
 * @module core
 * @description Natural language processing core objects and methods
 */
(function (exports) {
    'use strict';
    
    /**
     * This takes any string, locates groups of 
     * spelled out numbers and converts them to digits
     * @return {number} Returns the processed input string.
     */
    var digify = function () {
        var input = this.preParsedOutput || this.input;
        for (var i = 0; i < this.tokens.length; i++) {
            input = input.replace(this.tokens[i].text, toStringIfExists(this.tokens[i].value));
        }
        return input;
    };
    
    /**
     * Returns the given object's toString representation
     * if it is defined, otherwise returns the given object.
     * @param {object} The object to get a string if toString exists.
     * @return {string, object} Result of toString or obj is toString does not exist.
     */
    var toStringIfExists = function (obj) {
        if (obj.hasOwnProperty('toString')) {
            return obj.toString();
        } else {
            return obj;   
        }
    };
    
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
     * Create parsed results object and Bind functions to the parsed results for sugar
     */
    var ParsedResult = function (input, tokens, preParsedOutput, preParsedResults) {
        this.input = input;
        this.tokens = tokens;
        this.preParsedOutput = preParsedOutput || null;
        this.preParsedResults = preParsedResults || null;
        this.digify = digify.bind(this);
    };

    var BaseTranslator = function (onTranslate, locale) {

        /**
         * Validate instance
         */ 
        if (
        !this.hasOwnProperty('name') || 
        typeof this.name !== 'string' || 
        !this.hasOwnProperty('parse') || 
        typeof this.parse !== 'function' || 
        this.constructor.toString() === 'function Object() { [native code] }') {
            
            throw new Error('BaseTranslator must be inheritied and properties set for "name" and "parse"');
        }
        
        /**
         * Validate registration
         */ 
        if (typeof translators[this.name] === 'undefined') {
            throw new Error('"' + this.name + '" must be registered before it is instantiated');
        }
        
        /**
         * Validate locale
         */ 
        this.locale = locale || translators[this.name].defaultLocale;
        if (translators[this.name].supportedLocales.indexOf(this.locale) === -1) {
            throw new Error('Locale "' + this.locale + '" is not supported by "' + this.name + '"');
        }
        
        /**
         * Define onTranslate which is called
         * by the listen event
         */ 
        this.onTranslate = onTranslate || null;
        
        /**
         * Define assistants array if derived class
         * has not already defined it
         */ 
        if (!this.hasOwnProperty('assistants')) {
            this.assistants = [];
        }
    };
    
    BaseTranslator.prototype = {
        /**
         * Attaches the translate function to an event listener
         * @param speaker {Element, object, string} 
         */
        listen: function (speaker, event, onTranslate) {
            /**
             * Get object reference to the Element
             * if speaker is a string and document
             * is defined
             */
            if (typeof speaker === 'string' && document && document.getElementById) {
                speaker = document.getElementById(speaker);
            }
            
            /**
             * Default event name to input if not given
             */
            event = event || 'input';
            
            /**
             * Define onTranslate which is called
             * by the listen event
             */
            onTranslate = onTranslate || this.onTranslate;
            
            /**
             * Bind to the input control's oninput event
             */
            if (speaker.addEventListener) {
                speaker.addEventListener(event, this.translate.bind(this, speaker, onTranslate));
            } else if (speaker.attachEvent) {
                speaker.attachEvent('on' + event, this.translate.bind(this, speaker, onTranslate));
            } else if (typeof speaker['on' + event] !== 'undefined') {
                speaker['on' + event] = this.translate.bind(this, speaker, onTranslate);
            } else if (typeof speaker[event] !== 'undefined') {
                speaker[event] = this.translate.bind(this, speaker, onTranslate);
            } else {
                throw new Error('Could not find an appropriate event to bind to');   
            }
        },
        /**
         * Determines accepts multiple arguments and
         * passes appropriate ones to the parse function.
         * Passes the result to callbacks before returning
         * the result. 
         * This can be used directly or by the listen method.
         */
        translate: function () {
            /**
             * Determine the locale
             */
            var localeIndex = arguments.length;
            var locale = this.locale;
            if (translators[this.name].supportedLocales.indexOf(arguments[arguments.length - 1]) !== -1) {
                localeIndex = arguments.length - 1
                locale = arguments[localeIndex];
            }
        
            /**
             * Determine the input
             */
            var input = '';
            var inputIndex = localeIndex - 1;
            if (typeof arguments[inputIndex] === 'string') {
                input = arguments[inputIndex];
            } else if (arguments[inputIndex] && arguments[inputIndex].target && arguments[inputIndex].target.value) {
                input = arguments[inputIndex].target.value;
            }

            /**
             * Parse the input, pass to callbacks, and return the result.
             */
            if (input) {
                var result = this.parse(input, locale);
                if (arguments.length > 2 && typeof arguments[1] === 'function') {
                    arguments[1](result, arguments[0]);
                } else if (this.onTranslate && arguments.length > 1 && typeof arguments[0] !== 'string') {
                    this.onTranslate(result, arguments[0]);
                }
                return result;
            }
        },
        /**
         * Passes the input to the translators 
         * assistants and returns parsed results
         */
        passToAssistants: function (input, locale) {
            var preParsedOutput = input, 
                preParsedResults = {};
            for (var i = 0; i < this.assistants.length; i++) {
                preParsedResults[this.assistants[i]] = get(this.assistants[i]).parse(preParsedOutput, locale);
                preParsedOutput = preParsedResults[this.assistants[i]].digify();
            }
            return {
                preParsedOutput: preParsedOutput,
                preParsedResults: preParsedResults
            };
        }
    };
        
    /**
     * Expose classes used by Translator implementations
     */
    exports.ParsedResult = ParsedResult;
    exports.BaseTranslator = BaseTranslator;
    
    /**
     * Expose method used for registering translators with
     * the core. passToAssistants uses these singleton
     * instances of each translator.
     */
    var translators = {};
    var register = function (name, instance, defaultLocale, supportedLocales) {
        translators[name] = {
            instance: null,
            defaultLocale: defaultLocale,
            supportedLocales: supportedLocales
        };
        
        translators[name].instance = new instance();
    };
    exports.register = register;
    
    /**
     * Expose method used for getting a singleton instance 
     * of a translator.
     */
    var get = function (name, locale) {
        locale = locale || translators[name].instance.locale;
        if (translators[name].supportedLocales.indexOf(locale) === -1) {
            throw new Error('Locale "' + this.locale + '" is not supported by "' + name + '"');
        }
        
        translators[name].locale = locale || translators[name].instance.locale;
        return translators[name].instance;
    };
    exports.get = get;
    
    /**
     * TODO: Describe this
     */
    var assign = function (name, speaker) {
        var event = null, 
            locale = null, 
            onTranslate = null;
        
        if (arguments.length < 3 || typeof arguments[arguments.length - 1] !== 'function') {
            throw new TypeError('Unexpected number of arguments');   
        }
        
        onTranslate = arguments[arguments.length - 1];
        if (arguments.length > 3) {
            event = arguments[2];
        }
        if (arguments.length > 4) {
            locale = arguments[3];
        }
        
        var translator = get(name, locale);
        translator.listen(speaker, event, onTranslate);
    };
    exports.assign = assign;
    
    exports.insertMatch = insertMatch;
    
    exports.theSpaceBetween = function(input, p1, l1, p2) {
        return input.slice(p1 + l1, p2);
    }
    
}(typeof exports === 'undefined' ? this['babble'] = this['babble'] || {}: exports));
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
/**
 * @module moments
 * @dependency core
 * @description Natural language processing for points in time.
 */
(function (exports) {
    'use strict';
    
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
    var MomentTranslator = function (onTranslate, locale) {
        this.name = 'moments';
        this.parse = parse;
        core.BaseTranslator.call(this, onTranslate, locale);
    }
    MomentTranslator.prototype = Object.create(core.BaseTranslator.prototype);
    MomentTranslator.prototype.constructor = MomentTranslator;
    exports.MomentTranslator = MomentTranslator;
    
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
/**
 * @module numbers
 * @dependency core
 * @description Natural language processing for Numbers.
 */
(function (exports) {
    'use strict';
    
    var Locales = {
        'en-US': {
            /**
             * When expanding to support other locales
             * ensure that numbers that contain the words of
             * other numbers are entered AFTER the roots.
             * When a RegEx is built, it reverses this list
             * of mappings so that the ones toward the bottom
             * are evaluated first
             */
            'numbers': {
                'half': 0.5,
                'quarter': 0.25,
                'zero': 0,
                'one': 1,
                'two': 2,
                'three': 3,
                'four': 4,
                'five': 5,
                'six': 6,
                'seven': 7,
                'eight': 8,
                'nine': 9,
                'ten': 10,
                'eleven': 11,
                'twelve': 12,
                'thirteen': 13,
                'fourteen': 14,
                'fifteen': 15,
                'sixteen': 16,
                'seventeen': 17,
                'eighteen': 18,
                'nineteen': 19,
                'twenty': 20,
                'score': 20,
                'thirty': 30,
                'forty': 40,
                'fifty': 50,
                'sixty': 60,
                'seventy': 70,
                'eighty': 80,
                'ninety': 90,
                'hundred': 100,
                'thousand': 1000,
                'million': 1000000,
                'billion': 1000000000,
                'tenth': 0.1,
                'hundredth': 0.01,
                'thousandth': 0.001,
            },
            /**
             * Joiners define what characters
             * may separate words of the same number
             */
            'joiners': [
                '',
                ' ',
                ' and ',
                '-'
            ],
            /**
             * Flippers define what characters between two number-words will
             * cause a smaller number preceeding a larger number to be added 
             * instead of treated as a modifier.
             * Example: Germans write 'five and fifty' instead of 'fifty five'.
             * So, this essentially 'flips' the behavior of processing
             */
            'flippers': [
                
            ]
        }
    };

    Locales['de-DE'] = {
        'numbers': {
            'null': 0,
            'ein': 1,
            'eine': 1,
            'eins': 1,
            'zwei': 2,
            'zwo': 2,
            'drei': 3,
            'vier': 4,
            'fünf': 5,
            'sechs': 6,
            'sieben': 7,
            'acht': 8,
            'neun': 9,
            'zehn': 10,
            'elf': 11,
            'zwölf': 12,
            'dreizehn': 13,
            'vierzehn': 14,
            'fünfzehn': 15,
            'sechzehn': 16,
            'siebzehn': 17,
            'achtzehn': 18,
            'neunzehn': 19,
            'zwanzig': 20,
            'dreißig': 30,
            'vierzig': 40,
            'fünfzig': 50,
            'sechzig': 60,
            'siebzig': 70,
            'achtzig': 80,
            'neunzig': 90,
            'hundert': 100,
            'tausend': 1000,
            'million': 1000000,
            'milliarde': 1000000000
        },
        'joiners': [
            '',' ','und',' und ','-'
        ],
        'flippers': [
            'und',' und '
        ]
    };
    
    /**
     * This takes any string, locates groups of 
     * spelled out numbers and returns results
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
    
        // Build list of numbers and reverse so 
        // it matches the 'teens' before the ones
        var names = [];
        for (var name in locale.numbers) {
          names.push(name);
        }
        names.reverse();

        /**
         * Array for holding number matches
         */
        var matches = [];

        /**
         * Add numerical language matches
         */
        var re = new RegExp('(' + names.join('|') + ')', 'gi');
        
        var match;
        while ((match = re.exec(input)) !== null) {
            core.insertMatch(matches, {
                pos: match.index,
                len: match[0].length,
                value: locale.numbers[match[0].toLowerCase()] || parseFloat(match[0])
            });
        };
        
        /**
         * Add digit matches
         */
        re = /([+-]{0,1}\d+)/gi;
        while ((match = re.exec(input)) !== null) {
            core.insertMatch(matches, {
                pos: match.index,
                len: match[0].length,
                value: parseFloat(match[0])
            });
        };
        
        /**
         * Return empty result when there are
         * no matches
         */
        if (matches.length === 0) {
            return new core.ParsedResult(input, []); 
        }
        
        var numDigits = function(val) {
            if (val < 1) return '';
            return String(val).length;
        }

        var result = [{ kind: 'number', pos: 0, value: 0, text: '', segments: [0] }];
        var resultIndex = 0;
        var segmentIndex = 0;
        var previous = null;
        for (var i = 0; i < matches.length; i++) {

            // first lets check to see what characters
            // are joining this result with the last result
            if (previous) {
                var joiner = input.slice(previous.pos + previous.len, matches[i].pos);
                if (locale.joiners.indexOf(joiner) === -1) {
                    result[resultIndex].value = result[resultIndex].segments.reduce(function (prev, next) { return (prev || 0) + next; });
                    result[resultIndex].text = input.slice(result[resultIndex].pos, previous.pos + previous.len);
                    result.push({ kind: 'number', pos: 0, value: 0, text: '', segments: [0] });
                    resultIndex++;
                    segmentIndex = 0;
                    previous = null;
                    result[resultIndex].pos = matches[i].pos;
                }
            } else {
                result[resultIndex].pos = matches[i].pos;
            }

            if (previous && (numDigits(result[resultIndex].segments[segmentIndex]) < numDigits(matches[i].value) || matches[i].value < 1)) {

                // check previous segments (todo: recursive)
                if (segmentIndex > 0 && (result[resultIndex].segments[segmentIndex - 1] < matches[i].value) ) {

                    // traverse backwards until the end or sum is greater than current value
                    var segmentsTally = 0;
                    var splitter = 0;
                    for (var j = result[resultIndex].segments.length - 1; j > -1; j--) {
                        if (segmentsTally + result[resultIndex].segments[j] > matches[i].value) {
                            splitter = j + 1;
                            break;
                        }
                        segmentsTally += result[resultIndex].segments[j];
                    }

                    result[resultIndex].segments.splice(splitter, result[resultIndex].segments.length);
                    segmentIndex = splitter;
                    result[resultIndex].segments.push(segmentsTally * matches[i].value);

                } else {
                    // German language puts the 1s before the 10s, likely other languages do as well
                    if (locale.flippers.indexOf(input.slice(previous.pos + previous.len, matches[i].pos)) > -1) {
                        result[resultIndex].segments[segmentIndex] += matches[i].value;
                    } else {
                        result[resultIndex].segments[segmentIndex] = result[resultIndex].segments[segmentIndex] * matches[i].value;
                    }
                }
            } else if (previous && result[resultIndex].segments[segmentIndex] > matches[i].value) {
                result[resultIndex].segments.push(matches[i].value);
                segmentIndex++;
            } else {
                result[resultIndex].segments[segmentIndex] += matches[i].value;
            }

            previous = matches[i];
        }
        result[resultIndex].value = result[resultIndex].segments.reduce(function (prev, next) { return (prev || 0) + next; });
        result[resultIndex].text = input.slice(result[resultIndex].pos, previous.pos + previous.len);

        /**
         * Create parsed results object and Bind functions to the parsed results for sugar
         */
        return new core.ParsedResult(input, result);
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
     * Define NumberTranslator class
     */
    var NumberTranslator = function (onTranslate, locale) {
        this.name = 'numbers';
        this.parse = parse;
        core.BaseTranslator.call(this, onTranslate, locale);
    }
    NumberTranslator.prototype = Object.create(core.BaseTranslator.prototype);
    NumberTranslator.prototype.constructor = NumberTranslator;
    exports.NumberTranslator = NumberTranslator;
    
    /**
     * Register translator with the core list
     */
    var defaultLocale = 'en-US';
    var locales = [];
    for (var name in Locales) {
      locales.push(name);
    }
    core.register('numbers', NumberTranslator, defaultLocale, locales);

}(typeof exports === 'undefined' ? this['babble'] = this['babble'] || {} : exports));