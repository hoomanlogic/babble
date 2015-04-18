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
        var matches = [];

        /**
         * Add numerical language matches
         */
        var re = new RegExp('(' + names.join('|') + ')', 'gi');
        
        var match;
        while ((match = re.exec(input)) !== null) {
            core.insertToken(matches, new core.Token(
                getValue(match[0], locale), 
                'number.segment', 
                match.index, 
                match[0]
            ));
        };
        
        /**
         * Add digit matches
         */
        re = /([+-]{0,1}\d+)/gi;
        while ((match = re.exec(input)) !== null) {
            core.insertToken(matches, new core.Token(
                getValue(match[0], locale), 
                'number.segment', 
                match.index, 
                match[0]
            ));
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
        };
        
        var tallySegments = function (segments) {
            var value = 0;
            segments.forEach( function (segment) {
                value += segment.value;  
            });
            return value;
        };

        var result = [new core.Token(0, 'number', 0, '', [new core.Token(0, 'number.segment', 0, '')])];
        var resultIndex = 0;
        var segmentIndex = 0;
        var previous = null;
        for (var i = 0; i < matches.length; i++) {

            // first lets check to see what characters
            // are joining this result with the last result
            if (previous) {
                var joiner = input.slice(previous.pos + previous.text.length, matches[i].pos);
                if (locale.joiners.indexOf(joiner) === -1) {
                    result[resultIndex].value = tallySegments(result[resultIndex].tokens);
                    result[resultIndex].text = input.slice(result[resultIndex].pos, previous.pos + previous.text.length);
                    result.push(new core.Token(0, 'number', 0, '', [new core.Token(0, 'number.segment', 0, '')]));
                    resultIndex++;
                    segmentIndex = 0;
                    previous = null;
                    result[resultIndex].pos = matches[i].pos;
                }
            } else {
                result[resultIndex].pos = matches[i].pos;
            }

            if (previous && (numDigits(result[resultIndex].tokens[segmentIndex].value) < numDigits(matches[i].value) || matches[i].value < 1)) {

                // check previous segments
                if (segmentIndex > 0 && (result[resultIndex].tokens[segmentIndex - 1].value < matches[i].value) ) {

                    // traverse backwards until the end or sum is greater than current value
                    var segmentsTally = 0;
                    var splitter = 0;
                    for (var j = result[resultIndex].tokens.length - 1; j > -1; j--) {
                        if (segmentsTally + result[resultIndex].tokens[j].value > matches[i].value) {
                            splitter = j + 1;
                            break;
                        }
                        segmentsTally += result[resultIndex].tokens[j].value;
                    }

                    result[resultIndex].tokens.splice(splitter, result[resultIndex].tokens.length);
                    segmentIndex = splitter;
                    result[resultIndex].tokens.push(new core.Token(segmentsTally * matches[i].value, 'number.segment', 0, ''));

                } else {
                    // German language puts the 1s before the 10s, likely other languages do as well
                    if (locale.flippers.indexOf(input.slice(previous.pos + previous.text.length, matches[i].pos)) > -1) {
                        result[resultIndex].tokens[segmentIndex].value += matches[i].value;
                    } else {
                        result[resultIndex].tokens[segmentIndex].value = result[resultIndex].tokens[segmentIndex].value * matches[i].value;
                    }
                }
            } else if (previous && result[resultIndex].tokens[segmentIndex].value > matches[i].value) {
                result[resultIndex].tokens.push(new core.Token(matches[i].value, 'number.segment', 0, ''));
                segmentIndex++;
            } else {
                result[resultIndex].tokens[segmentIndex].value += matches[i].value;
                result[resultIndex].tokens[segmentIndex].pos = matches[i].pos;
                result[resultIndex].tokens[segmentIndex].text = matches[i].text;
            }

            previous = matches[i];
        }
        result[resultIndex].value = tallySegments(result[resultIndex].tokens);
        result[resultIndex].text = input.slice(result[resultIndex].pos, previous.pos + previous.text.length);

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