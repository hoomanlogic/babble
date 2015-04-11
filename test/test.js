var chai = require('chai');
var expect = chai.expect;
var should = chai.should();



/**
 * Numbers Testing
 */
var numbers = require('../src/numbers.js');
var durations = require('../src/durations.js');

describe('durations digify', function() {
    it('should parse "1hr30min"', function() {
        durations.parse('1hr30min').digify().should.equal(90 * 60 * 1000 + '');
    })
})

describe('numbers digify', function() {
    
    it('should parse "one million two hundred fifty one thousand three hundred and sixty five"', function() {
        numbers.parse('one million two hundred fifty one thousand three hundred and sixty five').digify().should.equal('1251365');
    })
    
    it('should parse "one million two hundred fifty one thousand three hundred and sixty five cats and sixty five dogs"', function() {
        numbers.parse('one million two hundred fifty one thousand three hundred and sixty five cats and sixty five dogs').digify().should.equal('1251365 cats and 65 dogs');
    })
        
    it('should parse "eine million sechs hundertdreiundfünfzigtausend eins katze und drei hundert siebzig hunde"', function() {
        numbers.parse('eine million sechs hundertdreiundfünfzigtausend eins katze und drei hundert siebzig hunde', 'de-DE').digify().should.equal('1653001 katze und 370 hunde');
    })
    
    it('should parse "50 cats flew twenty 2 miles per hour past five dogs"', function() {
        numbers.parse('50 cats flew twenty 2 miles per hour past five dogs').digify().should.equal('50 cats flew 22 miles per hour past 5 dogs');
    })
})
