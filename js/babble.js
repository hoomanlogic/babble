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
            var preParsedOutput = input, preParsedResults = [];
            for (var i = 0; i < this.assistants.length; i++) {
                preParsedResults.push(get(this.assistants[i]).parse(preParsedOutput, locale));
                preParsedOutput = preParsedResults[i].digify();
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
        if (this.years) {
            info.push(this.years + ' ' + locale.formatNoun(locale.year.full, this.years));   
        }
        if (unitOfSpecificity === 'days') {
            return info.join(', ');
        }
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
            /(((\d)+|half of an |half of a |half an |half a |half|quarter|an |a ) *?(years|year|yrs|yr|y){1})?/gi,
            /(((\d)+|half of an |half of a |half an |half a |half|quarter|an |a ) *?(days|day|dys|dy|d){1})?/gi,
            /(((\d)+|half of an |half of a |half an |half a |half|quarter|an |a ) *?(hours|hour|hrs|hr|h){1})?/gi,
            /(((\d)+|half of an |half of a |half an |half a |half|quarter|an |a ) *?(minutes|minute|mins|min|m){1})?/gi,
            /(((\d)+|half of an |half of a |half an |half a |half|quarter|an |a ) *?(seconds|second|secs|sec|s){1})?/gi,
            /((\d)+ *?(milliseconds|millisecond|millisecs|millisec|msecs|msec|ms){1})?/gi
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
        preParsedOutput.replace(/((\d)+:(\d)+(:(\d)+)?(:(\d)+)?(\.(\d){1,3})?)/gi, function () {
            
            if (arguments[0].trim() !== '') {
                insertMatch(matches, {
                    pos: arguments[arguments.length - 2],
                    len: arguments[0].length,
                    value: arguments[0]
                });
            }
        });
        
        
        
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
            
            if (text.indexOf(':') > 0) {
                var parts = text.split(':');
                if (parts.length === 2) {
                    // hours and minutes
                    segments[i].value = 
                        (hourInt * parseInt(parts[0])) +
                        (minuteInt * parseInt(parts[1]));
                } else if (parts.length === 3) {
                    var dec = parts[2].split('.');
                    var whole = dec[0];
                    if (dec.length > 1) {
                        if (String(dec[1]).length === 1) {
                            dec = '.00' + dec[1];
                        } else if (String(dec[1]).length === 2) {
                            dec = '.0' + dec[1];
                        } else {
                            dec = '.' + dec[1];
                        }
                    } else {
                        dec = '';
                    }
                    // hours, minutes and seconds
                    segments[i].value = 
                        (hourInt * parseInt(parts[0])) +
                        (minuteInt * parseInt(parts[1])) +
                        (secondInt * parseFloat(whole + dec));
                } else if (parts.length === 4) {
                    var dec = parts[3].split('.');
                    var whole = dec[0];
                    if (dec.length > 1) {
                        if (String(dec[1]).length === 1) {
                            dec = '.00' + dec[1];
                        } else if (String(dec[1]).length === 2) {
                            dec = '.0' + dec[1];
                        } else {
                            dec = '.' + dec[1];
                        }
                    } else {
                        dec = '';
                    }
                    
                    // days, hours, minutes and seconds
                    segments[i].value = 
                        (dayInt * parseInt(parts[0])) +
                        (hourInt * parseInt(parts[1])) +
                        (minuteInt * parseInt(parts[2])) +
                        (secondInt * parseFloat(whole + dec));
                }
            } else {

                var reYears = / *?(years|year|yrs|yr|y)$/gi;
                var reDays = / *?(days|day|dys|dy|d)$/gi;
                var reHours = / *?(hours|hour|hrs|hr|h)$/gi;
                var reMinutes = / *?(minutes|minute|mins|min|m)$/gi;
                var reSeconds = / *?(seconds|second|secs|sec|s)$/gi;
                var reMilliseconds = / *?(milliseconds|millisecond|millisecs|millisec|msecs|msec|ms)$/gi;
                var reHalf = /(half an|half a|half of an|half of a|half of|half)/gi;
                var reQuarter = /(quarter of an|quarter of a|quarter of|quarter)/gi;
                var reOne = /(an|a)/gi;

                var number = 0;
                text = text.replace(reMilliseconds, '');
                text = text.replace(reSeconds, function () {
                    number = secondInt;
                    return '';
                });
                text = text.replace(reYears, function () {
                    number = yearInt;
                    return '';
                });
                text = text.replace(reDays, function () {
                    number = dayInt;
                    return '';
                });
                text = text.replace(reHours, function () {
                    number = hourInt;
                    return '';
                });

                text = text.replace(reMinutes, function () {
                    number = minuteInt;
                    return '';
                });

                text = text.replace(reHalf, function () { 
                    number *= 0.5;
                    return '';
                });
                text = text.replace(reQuarter, function () { 
                    number *= 0.25;
                    return '';
                });
                text = text.replace(reOne, '');

                var multiplier = parseInt(text);
                if (multiplier.toString() === 'NaN') {
                    multiplier = 1;
                }
                if (number === 0) {
                    number = 1;   
                }
                segments[i].value = multiplier * number;
            }
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
     * Define core and preparse dependencies
     */
    if (typeof require !== 'undefined') {
        var core = require('./core.js');
        var numbers = require('./numbers.js');
    } else {
        var core = window['babble']
    }
    var Preparsers = [
        numbers || window['numbers']
    ];
    
    /**
     * This takes any string, locates groups of 
     * spelled out numbers and converts them to digits
     * @return {number} Returns the processed input string.
     */
    function digify () {
        var input = this.preParsedOutput || this.input;
        for (var i = 0; i < this.tokens.length; i++) {
            input = input.replace(this.tokens[i].text, this.tokens[i].value);   
        }
        return input;
    }

    /**
     * Create parsed results object and Bind functions to the parsed results for sugar
     */
    function ParsedResult(input, tokens, preParsedOutput, preParsedResults) {
        this.input = input;
        this.tokens = tokens;
        this.preParsedOutput = preParsedOutput || null;
        this.preParsedResults = preParsedResults || null;
        this.digify = digify.bind(this);
    }

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
    
    Locales['de-DE'] = {
        'hours': [
            'h', 'hr', 'ohre'
        ],
        'minutes': [
            'm','min','minuten'   
        ]
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
        if (locale && Locales[locale]) {
            locale = Locales[locale];
        } else {
            locale = Locales['en-US'];
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
        
        /**
         * Create parsed results object and Bind functions to the parsed results for sugar
         */
        return new core.ParsedResult(input, results, preParsedOutput, preParsedResults);
    };

}(typeof exports === 'undefined' ? this['moments'] = {}: exports));
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
                    }
                }
            }
        };

        /**
         * Array for holding number matches
         */
        var matches = [];

        /**
         * Add numerical language matches
         */
        var re = new RegExp('(' + names.join('|') + ')', 'gi');
        input.replace(re, function () {
            insertMatch(matches, {
                pos: arguments[arguments.length - 2],
                len: arguments[0].length,
                value: locale.numbers[arguments[0].toLowerCase()] || parseFloat(arguments[0])
            });
        });
        
        /**
         * Add digit matches
         */
        re = /([+-]{0,1}\d+)/gi;
        input.replace(re, function () {
            insertMatch(matches, {
                pos: arguments[arguments.length - 2],
                len: arguments[0].length,
                value: parseFloat(arguments[0])
            });
        });
        
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
     * Define DurationTranslator class
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
