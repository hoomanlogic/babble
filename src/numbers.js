/**
 * @module numbers
 * @dependency core
 * @description Natural language processing for Numbers.
 */
(function (exports) {
    'use strict';

    /**
     * Define core and preparse dependencies
     */
    if (typeof require !== 'undefined') {
        var core = require('./core.js');
    } else {
        var core = window['__babelchip_core__']
    }
    var Preparsers = [];
    
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
                'billion': 1000000000
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
    
    var CurrentLocale = Locales['en-US'];
    
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
        var insertByPosition = function (arr, obj) {
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
        input.replace(re, function (s, a, b, c) {
            insertByPosition(matches, {
                pos: b,
                len: a.length,
                value: locale.numbers[s.toLowerCase()] || parseFloat(s)
            });
        });
        
        /**
         * Add digit matches
         */
        re = /([+-]{0,1}\d+)/gi;
        input.replace(re, function (s, a, b, c, d, e, f,g, h, i, j, k) {
            insertByPosition(matches, {
                pos: b,
                len: a.length,
                value: parseFloat(s)
            });
        });
        
        /**
         * Return empty result when there are
         * no matches
         */
        if (matches.length === 0) {
            return new core.ParsedResult(input, []); 
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

            if (previous && result[resultIndex].segments[segmentIndex] < matches[i].value) {

                // check previous segments (todo: recursive)
                if (segmentIndex > 0 && result[resultIndex].segments[segmentIndex - 1] < matches[i].value) {

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

}(typeof exports === 'undefined' ? this['numbers'] = {}: exports));