var should = require('should');
var translate = require('../');

describe('translate', function() {

  it('should support a simple string', function() {
    translate('Hello!')().should.eql(['Hello!']);
  });

  it('should support an interpolated string', function() {
    translate('Hello, %{name}!')({name: 'Joe'}).should.eql(['Hello, ', 'Joe', '!']);
  });

  it('should pluralize a phrase with an array', function() {
    var fn = translate([
      'a car',
      '%{smart_count} cars'
    ], 'en');

    fn(0).should.eql([0, ' cars']);
    fn(1).should.eql(['a car']);
    fn(2).should.eql([2, ' cars']);
  });

  it('should pluralize a phrase with a CLDR object', function() {
    var fn = translate({
      one: 'a car',
      other: '%{smart_count} cars'
    }, 'en');

    fn(0).should.eql([0, ' cars']);
    fn(1).should.eql(['a car']);
    fn(2).should.eql([2, ' cars']);
  });

  it('should pluralize an ordinal phrase with a CLDR object', function() {
    var fn = translate({
      _format: 'ordinal',
      one: '%{smart_count}st car',
      two: '%{smart_count}nd car',
      few: '%{smart_count}rd car',
      other: '%{smart_count}th car'
    }, 'en');

    fn(0).should.eql([0, 'th car']);
    fn(1).should.eql([1, 'st car']);
    fn(2).should.eql([2, 'nd car']);
    fn(3).should.eql([3, 'rd car']);
    fn(4).should.eql([4, 'th car']);
  });

  it('should use a specific number if present', function() {
    var fn = translate({
      0: 'There aren\'t any cars!',
      20: 'Ooo lucky 20!',
      one: 'a car',
      other: '%{smart_count} cars'
    }, 'en');

    fn(0).should.eql(['There aren\'t any cars!']);
    fn(20).should.eql(['Ooo lucky 20!']);
  });
});
