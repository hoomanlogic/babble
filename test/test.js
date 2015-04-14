var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var numbers = require('../src/numbers.js');
var durations = require('../src/durations.js');

describe('numbers parse', function() {
    
    var numberTranslator = new numbers.NumberTranslator();
    
    it('should parse "one million two hundred fifty one thousand three hundred and sixty five"', function() {
        numberTranslator.translate('one million two hundred fifty one thousand three hundred and sixty five').digify().should.equal('1251365');
    })
    
    it('should parse "one million two hundred fifty one thousand three hundred and sixty five cats and sixty five dogs"', function() {
        numberTranslator.translate('one million two hundred fifty one thousand three hundred and sixty five cats and sixty five dogs').digify().should.equal('1251365 cats and 65 dogs');
    })
        
    it('should parse "eine million sechs hundertdreiundfünfzigtausend eins katze und drei hundert siebzig hunde"', function() {
        numberTranslator.translate('eine million sechs hundertdreiundfünfzigtausend eins katze und drei hundert siebzig hunde', 'de-DE').digify().should.equal('1653001 katze und 370 hunde');
        
        // setting the locale on the translation service
        numberTranslator.locale = 'de-DE';
        numberTranslator.translate('eine million sechs hundertdreiundfünfzigtausend eins katze und drei hundert siebzig hunde').digify().should.equal('1653001 katze und 370 hunde');
        numberTranslator.locale = 'en-US';
    })
    
    it('should parse "50 cats flew twenty 2 miles per hour past five dogs"', function() {
        numberTranslator.translate('50 cats flew twenty 2 miles per hour past five dogs').digify().should.equal('50 cats flew 22 miles per hour past 5 dogs');
    })
})

describe('durations parse', function() {
    var durationTranslator = new durations.DurationTranslator();
    
    it('should parse "1hr30min"', function() {
        durationTranslator.translate('1hr30min').digify().should.equal(90 * 60 * 1000 + '');
    })
    
    it('should parse "a day"', function() {
        durationTranslator.translate('a day').digify().should.equal(24 * 60 * 60 * 1000 + '');
    })

    it('should parse "quarter day"', function() {
        durationTranslator.translate('quarter day').digify().should.equal(0.25 * 24 * 60 * 60 * 1000 + '');
    })
    
    it('should parse "half day"', function() {
        durationTranslator.translate('half day').digify().should.equal(0.5 * 24 * 60 * 60 * 1000 + '');
    })
    
    it('should parse "half a day"', function() {
        durationTranslator.translate('half a day').digify().should.equal(0.5 * 24 * 60 * 60 * 1000 + '');
    })
    
    it('should parse "half of a day"', function() {
        durationTranslator.translate('half of a day').digify().should.equal(0.5 * 24 * 60 * 60 * 1000 + '');
    })

    it('should parse "an hour"', function() {
        durationTranslator.translate('an hour').digify().should.equal(60 * 60 * 1000 + '');
    })

    it('should parse "quarter hour"', function() {
        durationTranslator.translate('quarter hour').digify().should.equal(0.25 * 60 * 60 * 1000 + '');
    })
    
    it('should parse "half hour"', function() {
        durationTranslator.translate('half hour').digify().should.equal(0.5 * 60 * 60 * 1000 + '');
    })
    
    it('should parse "half an hour"', function() {
        durationTranslator.translate('half an hour').digify().should.equal(0.5 * 60 * 60 * 1000 + '');
    })
    
    it('should parse "half of an hour"', function() {
        durationTranslator.translate('half of an hour').digify().should.equal(0.5 * 60 * 60 * 1000 + '');
    })
    
    it('should parse "a minute"', function() {
        durationTranslator.translate('a minute').digify().should.equal(60 * 1000 + '');
    })

    it('should parse "quarter minute"', function() {
        durationTranslator.translate('quarter minute').digify().should.equal(0.25 * 60 * 1000 + '');
    })
    
    it('should parse "half minute"', function() {
        durationTranslator.translate('half minute').digify().should.equal(0.5 * 60 * 1000 + '');
    })
    
    it('should parse "half a minute"', function() {
        durationTranslator.translate('half a minute').digify().should.equal(0.5 * 60 * 1000 + '');
    })
    
    it('should parse "half of a minute"', function() {
        durationTranslator.translate('half of a minute').digify().should.equal(0.5 * 60 * 1000 + '');
    })
    
    it('should parse "a second"', function() {
        durationTranslator.translate('a second').digify().should.equal(1000 + '');
    })

    it('should parse "quarter second"', function() {
        durationTranslator.translate('quarter second').digify().should.equal(0.25 * 1000 + '');
    })
    
    it('should parse "half second"', function() {
        durationTranslator.translate('half second').digify().should.equal(0.5 * 1000 + '');
    })
    
    it('should parse "half a second"', function() {
        durationTranslator.translate('half a second').digify().should.equal(0.5 * 1000 + '');
    })
    
    it('should parse "half of a second"', function() {
        durationTranslator.translate('half of a second').digify().should.equal(0.5 * 1000 + '');
    })
})
//
//describe('durations Duration Object', function() {
//    it('should parse "25 hour, 24 minute" ', function() {
//        var result = durationTranslator.translate('25 hour, 24 minute').tokens[0].value;
//        
//        result.days.should.equal(1);
//        result.hours.should.equal(1);
//        result.minutes.should.equal(24);
//        result.value.should.equal(
//            (1 * 24 * 60 * 60 * 1000) + 
//            (1 * 60 * 60 * 1000) + 
//            (24 * 60 * 1000)
//        );
//    })
//})