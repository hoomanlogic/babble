/**
 * durations - Natural language processing for Durations of time
 * 2015, HoomanLogic, Geoff Manning
 */
(function (exports) {
    'use strict';
    
    /**
     * Dependencies for preparsing
     */
    if (typeof require !== 'undefined') {
        var numbers = require('./numbers.js');
    }
    var Preparsers = [
        numbers || window['numbers']
    ];
    
    /**
     * This takes any string, locates groups of 
     * spelled out numbers and converts them to digits
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
     * This takes any string, locates groups of 
     * durations and returns results
     */
    exports.parse = function (input, locale) {

        /*
         * Set the locale used for matching
         * and default to the CurrentLocale
         * if not specified.
         */
        if (locale && Locales[locale]) {
            locale = Locales[locale];
        } else {
            locale = CurrentLocale;   
        }
        
        /*
         * Run pre-parsing dependencies
         */ 
        var preParsedOutput = input, preParsedResults = [];
        if (Preparsers && Preparsers.length > 0) {
            for (var i = 0; i < Preparsers.length; i++) {
                preParsedResults.push(Preparsers[i].parse(preParsedOutput, locale));
                preParsedOutput = preParsedResults[i].digify();
            }
        }
        
        /*
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
        
        /*
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

        /*
         * Array for holding number matches
         */
        var matches = [];

        /*
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
        
        /*
         * Add numerical language matches
         */
        if (matches.length === 0) {
            return new ParsedResult(input, [], preParsedOutput, preParsedResults); 
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
        
        /*
         * Create parsed results object and Bind functions to the parsed results for sugar
         */
        return new ParsedResult(input, results, preParsedOutput, preParsedResults);
    };

}(typeof exports === 'undefined' ? this['durations'] = {}: exports));