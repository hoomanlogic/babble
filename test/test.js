var numbers = require('../src/numbers.js');

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

describe('numbers digify', function() {
    
    it('should parse "one million two hundred fifty one thousand three hundred and sixty five"', function() {
        numbers.digify('one million two hundred fifty one thousand three hundred and sixty five').should.equal('1251365');
    })
    
    it('should parse "one million two hundred fifty one thousand three hundred and sixty five cats and sixty five dogs"', function() {
        numbers.digify('one million two hundred fifty one thousand three hundred and sixty five cats and sixty five dogs').should.equal('1251365 cats and 65 dogs');
    })
    
})
