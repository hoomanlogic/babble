/**
 * @module core
 * @description Natural language processing core objects and methods
 */
(function (exports) {
    'use strict';
    
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
    };
    exports.getTokenModifier = getTokenModifier;
    
    /**
     * Function keeps the matches in order by the position
     * so processing doesn't have to worry about sorting it
     */
    var insertToken = function (arr, obj) {
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
    exports.insertToken = insertToken;
    
    /**
     * Create parsed results object and Bind functions to the parsed results for sugar
     */
    var ParsedResult = function (input, tokens, preParsedResults) {
        this.input = input;
        this.tokens = tokens;
        this.preParsedResults = preParsedResults || null;
    };
    
    ParsedResult.prototype = {
        /**
         * This takes any string, locates groups of 
         * spelled out numbers and converts them to digits
         * @return {number} Returns the processed input string.
         */
        toString: function () {
            var input = this.input;
            for (var i = 0; i < this.tokens.length; i++) {
                input = 
                    input.slice(0 ,this.tokens[i].pos) + 
                    toStringIfExists(this.tokens[i].value) + 
                    input.slice(this.tokens[i].pos + this.tokens[i].text.length);
            }
            return input;
        }
     };
    
    /**
     * Tokens are the gold nuggets of lexical analysis
     */
    var Token = function (value, kind, pos, text, tokens, certainty) {
        this.value = value;
        this.kind = kind;
        this.pos = pos;
        this.text = text;
        this.tokens = tokens || [];
        this.certainty = certainty || 0;
    }

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
        listen: function (speaker, event, onTranslate, locale) {
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
                speaker.addEventListener(event, this.translate.bind(this, { speaker: speaker, locale: locale, onTranslate: onTranslate }));
            } else if (speaker.attachEvent) {
                speaker.attachEvent('on' + event, this.translate.bind(this, { speaker: speaker, locale: locale, onTranslate: onTranslate }));
            } else if (typeof speaker['on' + event] !== 'undefined') {
                speaker['on' + event] = this.translate.bind(this, { speaker: speaker, locale: locale, onTranslate: onTranslate });
            } else if (typeof speaker[event] !== 'undefined') {
                speaker[event] = this.translate.bind(this, { speaker: speaker, locale: locale, onTranslate: onTranslate });
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
            
            var input = null;
            
            /**
             * Default options
             */
            var options = {
                locale: this.locale,
                onTranslate: null,
                speaker: null
            };
            
            /**
             * Set passed input and options
             */
            for (var i = 0; i < arguments.length; i++) {
                if (typeof arguments[i] === 'string') {
                    /**
                     * A string could either be a locale or the input.
                     * If loc
                     */
                    if (arguments[i].length < 6 && translators[this.name].supportedLocales.indexOf(arguments[i]) !== -1) {
                        options.locale = arguments[i];
                    } else if (input === null) {
                        input = arguments[i];
                    }
                } else if (typeof arguments[i] === 'object') {
                    /**
                     * Object could either be an Event object or the options object.
                     * If object.target.value doesn't exist, then assume options object
                     */
                    if (typeof arguments[i].target !== 'undefined' && typeof arguments[i].target.value !== 'undefined') {
                        input = arguments[i].target.value;
                    } else {
                        for (var propName in arguments[i]) {
                            if (arguments[i].hasOwnProperty(propName)) {
                                options[propName] = arguments[i][propName];
                            }
                        }
                    }
                } else if (typeof arguments[i] === 'function') {
                    /**
                     * We only support one type of function
                     */
                    options.onTranslate = arguments[i];
                }
            }
            
            /**
             * Parse the input, pass to callbacks, and return the result.
             */
            if (input) {
                var result = this.parse(input, options.locale);
                /**
                 * Callback passed in function
                 */
                if (options.onTranslate !== null) {
                    options.onTranslate(result, options.speaker);
                }
                /**
                 * Callback manually attached function
                 */
                if (this.onTranslate) {
                    this.onTranslate(result, options.speaker);
                }
                return result;
            }
            
            return new ParsedResult(input, []);
        },
        /**
         * Passes the input to the translators 
         * assistants and returns parsed results
         */
        passToAssistants: function (input, locale) {
            var preParsedResults = {};
            for (var i = 0; i < this.assistants.length; i++) {
                preParsedResults[this.assistants[i]] = get(this.assistants[i]).parse(input, locale);
            }
            return preParsedResults;
        }
    };
        
    /**
     * Expose classes used by Translator implementations
     */
    exports.ParsedResult = ParsedResult;
    exports.BaseTranslator = BaseTranslator;
    exports.Token = Token;
    
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
        //translator.locale = locale; // we have to set it so it doesn't forget
        translator.listen(speaker, event, onTranslate, locale);
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
            'code': 'en-US',
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
    Locales['de-DE'] = {
            'code': 'de-DE',
            'millennium': {
                'full': []
            },
            'century': {
                'full': []
            },
            'decade': {
                'full': []
            },
            'year': {
                'full': ['jahre', 'jahr'],
                'short': [],
                'symbol': ['j']
            },
            'day': {
                'full': ['tage', 'tag'],
                'short': [],
                'symbol': ['t']
            },
            'hour': {
                'full': ['stunde'],
                'short': [],
                'symbol': ['st'],
            },
            'minute': {
                'full': ['minuten'],
                'short': ['min'],
                'symbol': ['m'],
            },
            'second': {
                'full': ['sekunden'],
                'short': ['sek'],
                'symbol': ['s'],
            },
            'millisecond': {
                'full': ['millisekunden'],
                'short': ['millisek', 'msek'],
                'symbol': ['ms'],
            },
            'timeJoiners': [',',', und',',und','und',''],
            'modifierJoiners': ['ob',''],
            
            /**
             * Pluralizes a word based on how many
             */
            formatNoun: function (noun, howMany) {

                var plural = function (noun) {
                    return noun + 'e';
                }

                if (howMany === 0) {
                    return 'kein ' + plural(noun);
                } else if (howMany === 1) {
                    return noun;
                } else {
                    return plural(noun);
                }
            }
        };

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
    
    
    exports.Duration.prototype.toString = function (format, locale) {
        
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
        
        if (typeof format !== 'undefined' && format !== null && format.slice(0,1) === ':') {
            if (this.days > 0) {
                return this.days + ':' + (this.hours < 10 ? '0' : '') + this.hours + ':' + (this.minutes < 10 ? '0' : '') + this.minutes;
            } else if (this.hours > 0) {
                
                if (format === ':minutes') {
                    return 
                        this.hours + ':' + 
                        (this.minutes < 10 ? '0' : '') + this.minutes + ':';
                } else {
                    return 
                        this.hours + ':' + 
                        (this.minutes < 10 ? '0' : '') + this.minutes + ':' + 
                        (this.seconds < 10 ? '0' : '') + this.seconds;
                }
                
            } else {
                if (format === ':minutes') {
                    return 
                        this.minutes;
                } else {
                    return 
                        this.minutes + ':' + 
                        (this.seconds < 10 ? '0' : '') + this.seconds;
                }
                
            }
        } else {
            
            if (typeof format === 'undefined' || format === null || !this.hasOwnProperty(unitOfSpecificity)) {
                format = 'milliseconds';
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
    }
        
    exports.Duration.prototype.toMinutes = function () {
        if (this.value > 60000) {
            return Math.floor((this.value / 1000) / 60);
        } else {
            return 0;   
        }
    }

    /**
     * Return whether name is variation of millenium
     * @param {string} A recognized duration name
     */
    var isMillennium = function (name, locale) {
        if (locale.millennium.full.indexOf(name) > -1) {
            return true;
        }
        return false;
    };

    /**
     * Return whether name is variation of century
     * @param {string} A recognized duration name
     */
    var isCentury = function (name, locale) {
        if (locale.century.full.indexOf(name) > -1) {
            return true;
        }
        return false;
    };

    /**
     * Return whether name is variation of decade
     * @param {string} A recognized duration name
     */
    var isDecade = function (name, locale) {
        if (locale.decade.full.indexOf(name) > -1) {
            return true;
        }
        return false;
    };

    /**
     * Return whether name is variation of year
     * @param {string} A recognized duration name
     */
    var isYear = function (name, locale) {
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

    /**
     * Return whether name is variation of day
     * @param {string} A recognized duration name
     */
    var isDay = function (name, locale) {
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

    /**
     * Return whether name is variation of hour
     * @param {string} A recognized duration name
     */
    var isHour = function (name, locale) {
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

    /**
     * Return whether name is variation of minute
     * @param {string} A recognized duration name
     */
    var isMinute = function (name, locale) {
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

    /**
     * Return whether name is variation of second
     * @param {string} A recognized duration name
     */
    var isSecond = function (name, locale) {
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

    /**
     * Return whether name is variation of millisecond
     * @param {string} A recognized duration name
     */
    var isMillisecond = function (name, locale) {
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

    /**
     * Return duration value in milliseconds
     * @param {string} A recognized duration name
     */
    var getValue = function (name, locale) {

        if (isMillennium(name, locale)) {
            return millenniumInt;   
        }
        if (isCentury(name, locale)) {
            return centuryInt;   
        }
        if (isDecade(name, locale)) {
            return decadeInt;   
        }
        if (isYear(name, locale)) {
            return yearInt;   
        }
        if (isDay(name, locale)) {
            return dayInt;
        }
        if (isHour(name, locale)) {
            return hourInt;   
        }
        if (isMinute(name, locale)) {
            return minuteInt;
        }
        if (isSecond(name, locale)) {
            return secondInt;
        }
        if (isMillisecond(name, locale)) {
            return 1;
        }
        throw new Error('Invalid duration name');
    };
    
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
         * Build list of duration words
         * for use in regular expression
         */
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


        /**
         * Run pre-parsing dependencies
         */
        var preParsedResults = this.passToAssistants(input, locale.code);
        
        /**
         * Array for holding number matches
         */
        var matches = [];
        
        //http://leaverou.github.io/regexplained/
        var match;
        // use negative lookahead to ensure it's the end of a word 
        // without consuming a digit that could otherwise be a part
        // of the following match
        var re = new RegExp('(\\b|\\d)(' + names.join('|') + ')\.?(?![a-zA-Z])', 'gi')
        while ((match = re.exec(input)) !== null) {
            var truePos = match.index + (match[1] || '').length;
            core.insertToken(matches, {
                kind: 'duration.name',
                pos: truePos,
                text: match[2],
                value: getValue(match[2], locale)
            });
        };
        
        /**
         * Add numerical language matches
         */
        //input.replace(/((\d)+:(\d)+(:(\d)+)?(:(\d)+)?(\.(\d){1,3})?)/gi, function () {
        re = /((\d)+:(\d)+(:(\d)+)?(:(\d)+)?(\.(\d){1,3})?)/gi;
        while ((match = re.exec(input)) !== null) {
            if (arguments[0].trim() !== '') {
                core.insertToken(matches, {
                    kind: 'duration.full',
                    pos: match.index,
                    text: match[0],
                    value: null
                });
            }
        };
        

        
        if (matches.length === 0) {
            return new core.ParsedResult(input, [], preParsedResults); 
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
            var numToken = core.getTokenModifier(preParsedResults['numbers'].tokens, matches[i], previousMatch);
            
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
                    next.text = input.slice(prev.pos, next.pos + next.text.length);
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
        return new core.ParsedResult(input, results, preParsedResults);
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
                'qtr': 0.25,
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
                'half-a-mil': 500000,
                'half-a-mill': 500000,
                'million': 1000000,
                'half-a-bil': 500000000,
                'half-a-bill': 500000000,
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
                '-',
                ' a ',
                ' of a '
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
    
    var getValue = function (name, locale) {
        return locale.numbers[name.toLowerCase()] || parseFloat(name);
    }
    
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
        var words = [];

        /**
         * Add numerical language words
         */
        var re = new RegExp('(' + names.join('|') + ')', 'gi');
        
        var match;
        while ((match = re.exec(input)) !== null) {
            core.insertToken(words, new core.Token(
                getValue(match[0], locale), 
                'number.word', 
                match.index, 
                match[0]
            ));
        };
        
        /**
         * Add digit words
         */
        re = /([+-]{0,1}\d+)/gi;
        while ((match = re.exec(input)) !== null) {
            core.insertToken(words, new core.Token(
                getValue(match[0], locale), 
                'number.word', 
                match.index, 
                match[0]
            ));
        };
        
        /**
         * Return empty result when there are
         * no words
         */
        if (words.length === 0) {
            return new core.ParsedResult(input, []); 
        }
        
        var numDigits = function(val) {
            if (val < 1) return '';
            return String(val).length;
        };
        
        var tallySegments = function (segments) {
            var value = 0;
            segments.forEach( function (segment) {
                value += segment.value;
            });
            return value;
        };

        var numbers = [];
        var segments = [];
        var numbersIndex = -1;
        var segmentsIndex = -1;
        var prevWord = null;
        for (var i = 0; i < words.length; i++) {

            // first lets check to see what characters
            // are joining this result with the last result
            if (prevWord) {
                var joiner = input.slice(prevWord.pos + prevWord.text.length, words[i].pos);
                if (locale.joiners.indexOf(joiner) === -1) {
                    numbers[numbersIndex].value = tallySegments(numbers[numbersIndex].tokens);
                    numbers[numbersIndex].text = input.slice(numbers[numbersIndex].pos, prevWord.pos + prevWord.text.length);
                    prevWord = null;
                }
            }
            
            // above block may set prevWord to null
            // to intentionally cause this condition
            if (!prevWord) {
                segments = [];
                segments.push(new core.Token(words[i].value, 'number.segment', words[i].pos, words[i].text, [words[i]]));
                numbers.push(new core.Token(words[i].value, 'number', words[i].pos, words[i].text, segments));
                numbersIndex++;
                segmentsIndex = 0;
            }

            if (prevWord && (numDigits(numbers[numbersIndex].tokens[segmentsIndex].value) < numDigits(words[i].value) || words[i].value < 1)) {

                var theSpaceBetween = input.slice(prevWord.pos + prevWord.text.length, words[i].pos);
                if (locale.flippers.indexOf(theSpaceBetween) > -1) {
                    numbers[numbersIndex].tokens[segmentsIndex].tokens.push(words[i]);
                    numbers[numbersIndex].tokens[segmentsIndex].value += words[i].value;
                } else if (segmentsIndex === 0) {
                    numbers[numbersIndex].tokens[segmentsIndex].tokens.push(words[i]);
                    numbers[numbersIndex].tokens[segmentsIndex].value *= words[i].value;
                } else {
                    // might merge a segment
                    // traverse backwards until the end or sum is greater than current value
                    var segmentsTally = 0;
                    var splitter = 0;
                    for (var j = numbers[numbersIndex].tokens.length - 1; j > -1; j--) {
                        
                        if (numbers[numbersIndex].tokens[j].value > words[i].value) {
                            splitter = j + 1;
                            break;
                        }
                        
                        segmentsTally += numbers[numbersIndex].tokens[j].value;
                    }

                    var segmentsToMerge = numbers[numbersIndex].tokens.splice(
                        splitter, numbers[numbersIndex].tokens.length
                    );
                    
                    var mergedSegment = new core.Token(
                        segmentsTally * words[i].value, 
                        'number.segment', 
                        segmentsToMerge[0].pos, 
                        input.slice(
                            segmentsToMerge[0].pos, 
                            segmentsToMerge[segmentsToMerge.length - 1].pos + 
                            segmentsToMerge[segmentsToMerge.length - 1].text.length)
                    );
                    
                    numbers[numbersIndex].tokens.push(mergedSegment);
                    segmentsIndex = splitter;
                }   
            } else if (prevWord && numbers[numbersIndex].tokens[segmentsIndex].value > words[i].value) {
                numbers[numbersIndex].tokens.push(new core.Token(
                    words[i].value,
                    'number.segment',
                    words[i].pos,
                    words[i].text,
                    [words[i]]
                ));
                segmentsIndex++;
            } else if (prevWord) {
                numbers[numbersIndex].tokens[segmentsIndex].value += words[i].value;
                numbers[numbersIndex].tokens[segmentsIndex].pos = words[i].pos;
                numbers[numbersIndex].tokens[segmentsIndex].text = words[i].text;
            }
            numbers[numbersIndex].tokens[segmentsIndex].text = input.slice( numbers[numbersIndex].tokens[segmentsIndex].pos, words[i].pos + words[i].text.length);

            prevWord = words[i];
        }
        numbers[numbersIndex].value = tallySegments(numbers[numbersIndex].tokens);
        numbers[numbersIndex].text = input.slice(numbers[numbersIndex].pos, prevWord.pos + prevWord.text.length);

        /**
         * Create parsed results object and Bind functions to the parsed results for sugar
         */
        return new core.ParsedResult(input, numbers);
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