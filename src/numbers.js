/**
 * numbers - Natural language processing for Numbers
 * 2015, HoomanLogic, Geoff Manning
 */
(function (exports) {
    'use strict';

    /**
     * This takes any string, locates groups of 
     * spelled out numbers and converts them to digits
     */
    exports.digify = function (numberString, locale) {
        var matches = exports.parseNums(numberString, locale);
        for (var i = 0; i < matches.length; i++) {
            numberString = numberString.replace(matches[i].text, matches[i].value);   
        }
        return numberString;
    }

    /**
     * This takes any string, locates groups of 
     * spelled out numbers and returns results
     */
    exports.parseNums = function (numberString, locale) {
        /*
         * When expanding to support other locales
         * ensure that numbers that contain the words of
         * other numbers are entered AFTER the roots.
         * When a RegEx is built, it reverses this list
         * of mappings so that the ones toward the bottom
         * are evaluated first
         */
        var map_en_us = {
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
        };
        var joiners_en_us = ['',' ',' and ','-'];


        /*
         * Deutsch
         */
        var map_de_de = {
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
        };
        var joiners_de_de = ['',' ','und',' und ','-'];

        var map = null;
        var joiners = null;

        if (locale && locale === 'de-de') {
            map = map_de_de;   
            joiners = joiners_de_de;
        } else {
            map = map_en_us;   
            joiners = joiners_en_us;
        }

        var names = [];
        for (var name in map) {
          names.push(name);
        }

        // reverse so it matches the teens before the ones
        names.reverse();

        var digits = [];
        var replaceNumbers = function (s, a, b, c) {
            digits.push({
                pos: b,
                len: a.length,
                value: map[s.toLowerCase()]
            });

            return map[s];
        };

        // build regex
        var re = new RegExp('(' + names.join('|') + ')', 'gi');

        // process string
        numberString.replace(re, replaceNumbers);

        if (digits.length === 0) {
            return [];   
        }

        var result = [{ value: 0, text: '', segments: [0] }];
        var resultIndex = 0;
        var segmentIndex = 0;
        var previous = null;
        for (var i = 0; i < digits.length; i++) {

            // first lets check to see what characters
            // are joining this result with the last result
            if (previous) {
                var joiner = numberString.slice(previous.pos + previous.len, digits[i].pos);
                if (joiners.indexOf(joiner) === -1) {
                    result[resultIndex].value = result[resultIndex].segments.reduce(function (prev, next) { return (prev || 0) + next; });
                    result[resultIndex].text = numberString.slice(result[resultIndex].pos, previous.pos + previous.len);
                    result.push({ value: 0, text: '', segments: [0] });
                    resultIndex++;
                    segmentIndex = 0;
                    previous = null;
                    result[resultIndex].pos = digits[i].pos;
                }
            } else {
                result[resultIndex].pos = digits[i].pos;
            }

            if (previous && result[resultIndex].segments[segmentIndex] < digits[i].value) {

                // check previous segments (todo: recursive)
                if (segmentIndex > 0 && result[resultIndex].segments[segmentIndex - 1] < digits[i].value) {

                    // traverse backwards until the end or sum is greater than current value
                    var segmentsTally = 0;
                    var splitter = 0;
                    for (var j = result[resultIndex].segments.length - 1; j > -1; j--) {
                        if (segmentsTally + result[resultIndex].segments[j] > digits[i].value) {
                            splitter = j + 1;
                            break;
                        }
                        segmentsTally += result[resultIndex].segments[j];
                    }

                    result[resultIndex].segments.splice(splitter, result[resultIndex].segments.length);
                    segmentIndex = splitter;
                    result[resultIndex].segments.push(segmentsTally * digits[i].value);

                } else {
                    // german language puts the 1s before the 10s
                    // will eventually push this option back on the locale
                    // to keep this clean of locale specific logic
                    if (locale && locale === 'de-de' && numberString.slice(previous.pos + previous.len, digits[i].pos).trim() === 'und') {
                        result[resultIndex].segments[segmentIndex] += digits[i].value;
                    } else {
                        result[resultIndex].segments[segmentIndex] = result[resultIndex].segments[segmentIndex] * digits[i].value;
                    }
                }
            } else if (previous && result[resultIndex].segments[segmentIndex] > digits[i].value) {
                result[resultIndex].segments.push(digits[i].value);
                segmentIndex++;
            } else {
                result[resultIndex].segments[segmentIndex] += digits[i].value;
            }

            previous = digits[i];
        }
        result[resultIndex].value = result[resultIndex].segments.reduce(function (prev, next) { return (prev || 0) + next; });
        result[resultIndex].text = numberString.slice(result[resultIndex].pos, previous.pos + previous.len);

        return result;   
    }

}(typeof exports === 'undefined' ? this['numbers'] = {}: exports));