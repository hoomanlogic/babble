var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var numbers = require('../src/numbers.js');
var durations = require('../src/durations.js');
var moments = require('../src/moments.js');

describe('duration type toString formats', function () {
    
    var secondInt = 1000;
    var minuteInt = 60 * secondInt;
    var hourInt = 60 * minuteInt;
    var dayInt = 24 * hourInt;
    var yearInt = 365 * dayInt;
    var decadeInt = 10 * yearInt;
    var centuryInt = 10 * decadeInt;
    var millenniumInt = 10 * centuryInt;
    
    it(':', function() {
        new durations.Duration((hourInt * 2) + (minuteInt * 5)).toString(':').should.equal('2:05:00');
    })
    
    it(':minutes', function() {
        new durations.Duration((hourInt * 2) + (minuteInt * 5)).toString(':minutes').should.equal('2:05');
    })
    
    it('default', function() {
        new durations.Duration((hourInt * 2) + (minuteInt * 5)).toString().should.equal('2 hours, 5 minutes');
    })
    
    it('hm', function() {
        new durations.Duration((hourInt * 2) + (minuteInt * 5) + (secondInt * 3)).toString('hm').should.equal('2h5m');
    })
    
    it('hms', function() {
        new durations.Duration((hourInt * 2) + (minuteInt * 5) + (secondInt * 3)).toString('hms').should.equal('2h5m3s');
    })
    
})

describe('numbers parse should recognize', function() {
    
    var numberTranslator = new numbers.NumberTranslator();
    
    it('half a billion', function() {
        numberTranslator.translate('half a billion').tokens[0].value.should.equal(500000000);
    })
    
    it('half-a-bill', function() {
        numberTranslator.translate('half-a-bill').tokens[0].value.should.equal(500000000);
    })
    
    it('half-a-mil', function() {
        numberTranslator.translate('half-a-mil').tokens[0].value.should.equal(500000);
    })
    
    it('one million two hundred fifty one thousand three hundred and sixty five', function() {
        numberTranslator.translate('one million two hundred fifty one thousand three hundred and sixty five').tokens[0].value.should.equal(1251365);
    })
    
    it('one million two hundred fifty one thousand three hundred and sixty five cats and sixty five dogs', function() {
        var result = numberTranslator.translate('one million two hundred fifty one thousand three hundred and sixty five cats and sixty five dogs');
        result.tokens[0].value.should.equal(1251365);
        result.tokens[1].value.should.equal(65);
    })
        
    it('eine million sechs hundertdreiundfünfzigtausend eins katze und drei hundert siebzig hunde', function() {
        var result = numberTranslator.translate('eine million sechs hundertdreiundfünfzigtausend eins katze und drei hundert siebzig hunde', 'de-DE');
        result.tokens[0].value.should.equal(1653001);
        result.tokens[1].value.should.equal(370);
        
        // setting the locale on the translation service
        numberTranslator.locale = 'de-DE';
        var result = numberTranslator.translate('eine million sechs hundertdreiundfünfzigtausend eins katze und drei hundert siebzig hunde');
        result.tokens[0].value.should.equal(1653001);
        result.tokens[1].value.should.equal(370);
        numberTranslator.locale = 'en-US';
    })
    
    it('50 cats flew twenty 2 miles per hour past five dogs', function() {
        var result = numberTranslator.translate('50 cats flew twenty 2 miles per hour past five dogs');
        result.tokens[0].value.should.equal(50);
        result.tokens[1].value.should.equal(22);
        result.tokens[2].value.should.equal(5);
    })
})

describe('durations parse should recognize', function() {
    var durationTranslator = new durations.DurationTranslator();
    
    it('1:30:30', function() {
        durationTranslator.translate('1:30:30').tokens[0].value.value.should.equal((90 * 60 * 1000) + 30000);
    })
    
    it('1:30:30.0', function() {
        durationTranslator.translate('1:30:30.0').tokens[0].value.value.should.equal((90 * 60 * 1000) + 30000);
    })
    it('1:30:30.5', function() {
        durationTranslator.translate('1:30:30.5').tokens[0].value.value.should.equal((90 * 60 * 1000) + 30000 + 500);
    })
    it('1:30:30.05', function() {
        durationTranslator.translate('1:30:30.05').tokens[0].value.value.should.equal((90 * 60 * 1000) + 30000 + 50);
    })
    it('1:30:30.005', function() {
        durationTranslator.translate('1:30:30.005').tokens[0].value.value.should.equal((90 * 60 * 1000) + 30000 + 5);
    })
    
    it('1:0:0:30', function() {
        durationTranslator.translate('1:0:0:30').tokens[0].value.value.should.equal((24 * 60 * 60 * 1000) + 30000);
    })
    
    it('1:0:0:30.0', function() {
        durationTranslator.translate('1:0:0:30.0').tokens[0].value.value.should.equal((24 * 60 * 60 * 1000) + 30000);
    })
    
    it('one hour and thirty minutes', function() {
        durationTranslator.translate('one hour and thirty minutes').tokens[0].value.value.should.equal(90 * 60 * 1000);
    })
    
    it('1hr30min', function() {
        durationTranslator.translate('1hr30min').tokens[0].value.toMinutes().should.equal(90);
    })
    
        it('1d2h', function() {
        durationTranslator.translate('1d2h').tokens[0].value.toMinutes().should.equal(26 * 60);
    })
    
    it('a day', function() {
        durationTranslator.translate('a day').tokens[0].value.value.should.equal(24 * 60 * 60 * 1000);
    })

    it('quarter day', function() {
        durationTranslator.translate('quarter day').tokens[0].value.value.should.equal(0.25 * 24 * 60 * 60 * 1000);
    })
    
    it('half day', function() {
        durationTranslator.translate('half day').tokens[0].value.value.should.equal(0.5 * 24 * 60 * 60 * 1000);
    })
    
    it('half a day', function() {
        durationTranslator.translate('half a day').tokens[0].value.value.should.equal(0.5 * 24 * 60 * 60 * 1000);
    })
    
    it('half of a day', function() {
        durationTranslator.translate('half of a day').tokens[0].value.value.should.equal(0.5 * 24 * 60 * 60 * 1000);
    })

    it('an hour', function() {
        durationTranslator.translate('an hour').tokens[0].value.value.should.equal(60 * 60 * 1000);
    })

    it('quarter hour', function() {
        durationTranslator.translate('quarter hour').tokens[0].value.value.should.equal(0.25 * 60 * 60 * 1000);
    })
    
    it('half hour', function() {
        durationTranslator.translate('half hour').tokens[0].value.value.should.equal(0.5 * 60 * 60 * 1000);
    })
    
    it('half an hour', function() {
        durationTranslator.translate('half an hour').tokens[0].value.value.should.equal(0.5 * 60 * 60 * 1000);
    })
    
    it('half of an hour', function() {
        durationTranslator.translate('half of an hour').tokens[0].value.value.should.equal(0.5 * 60 * 60 * 1000);
    })
    
    it('a minute', function() {
        durationTranslator.translate('a minute').tokens[0].value.value.should.equal(60 * 1000);
    })

    it('quarter minute', function() {
        durationTranslator.translate('quarter minute').tokens[0].value.value.should.equal(0.25 * 60 * 1000);
    })
    
    it('half minute', function() {
        durationTranslator.translate('half minute').tokens[0].value.value.should.equal(0.5 * 60 * 1000);
    })
    
    it('half a minute', function() {
        durationTranslator.translate('half a minute').tokens[0].value.value.should.equal(0.5 * 60 * 1000);
    })
    
    it('half of a minute', function() {
        durationTranslator.translate('half of a minute').tokens[0].value.value.should.equal(0.5 * 60 * 1000);
    })
    
    it('a second', function() {
        durationTranslator.translate('a second').tokens[0].value.value.should.equal(1000);
    })

    it('quarter second', function() {
        durationTranslator.translate('quarter second').tokens[0].value.value.should.equal(0.25 * 1000);
    })
    
    it('half second', function() {
        durationTranslator.translate('half second').tokens[0].value.value.should.equal(0.5 * 1000);
    })
    
    it('half a second', function() {
        durationTranslator.translate('half a second').tokens[0].value.value.should.equal(0.5 * 1000);
    })
    
    it('half of a second', function() {
        durationTranslator.translate('half of a second').tokens[0].value.value.should.equal(0.5 * 1000);
    })
})
//
//describe('durations Duration Object', function() {
//    it('25 hour, 24 minute" ', function() {
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

describe('moments', function() {  
    describe('daysOfWeek', function() {
        it('should exist', function() {
            should.exist(moments.moments.daysOfWeek)
        })

        it('should be an array', function() {
            moments.moments.daysOfWeek.should.be.a('Array')
        })
    })
    
    describe('dayDiff', function() {
        it('should return number of days between two dates', function() {
            var d1 = new Date();
            var d2 = new Date();
            d2.setDate(d2.getDate() + 31);
            
            moments.moments.dayDiff(d1, d2).should.equal(31);
            moments.moments.dayDiff(d2, d1).should.equal(31);
        })
    })
    
    describe('hourDiff', function() {
        it('should return number of hours between two dates', function() {
            var d1 = new Date();
            var d2 = new Date();
            d2.setDate(d2.getDate() + 31);
            
            moments.moments.hourDiff(d1, d2).should.equal(31 * 24);
            moments.moments.hourDiff(d2, d1).should.equal(31 * 24);
        })
    })
})