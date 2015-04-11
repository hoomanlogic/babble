/**
 * core - Natural language processing for Durations of time
 * 2015, HoomanLogic, Geoff Manning
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
            input = input.replace(this.tokens[i].text, this.tokens[i].value);   
        }
        return input;
    }

    /**
     * Create parsed results object and Bind functions to the parsed results for sugar
     */
    exports.ParsedResult = function (input, tokens, preParsedOutput, preParsedResults) {
        this.input = input;
        this.tokens = tokens;
        this.preParsedOutput = preParsedOutput || null;
        this.preParsedResults = preParsedResults || null;
        this.digify = digify.bind(this);
    }

}(typeof exports === 'undefined' ? this['__babelchip_core__'] = {}: exports));