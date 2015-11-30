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
      '%{count} cars'
    ], 'en');

    fn(0).should.eql(['0', ' cars']);
    fn(1).should.eql(['a car']);
    fn(2).should.eql(['2', ' cars']);
  });

  it('should pluralize a phrase with a CLDR object', function() {
    var fn = translate({
      one: 'a car',
      other: '%{count} cars'
    }, 'en');

    fn(0).should.eql(['0', ' cars']);
    fn(1).should.eql(['a car']);
    fn(2).should.eql(['2', ' cars']);
    fn(10000).should.eql(['10,000', ' cars']);
  });

  it('should pluralize an ordinal phrase with a CLDR object', function() {
    var fn = translate({
      _format: 'ordinal',
      one: '%{count}st car',
      two: '%{count}nd car',
      few: '%{count}rd car',
      other: '%{count}th car'
    }, 'en');

    fn(0).should.eql(['0', 'th car']);
    fn(1).should.eql(['1', 'st car']);
    fn(2).should.eql(['2', 'nd car']);
    fn(3).should.eql(['3', 'rd car']);
    fn(4).should.eql(['4', 'th car']);
  });

  it('should use a specific number if present', function() {
    var fn = translate({
      0: 'There aren\'t any cars!',
      20: 'Ooo lucky 20!',
      one: 'a car',
      other: '%{count} cars'
    }, 'en');

    fn(0).should.eql(['There aren\'t any cars!']);
    fn(20).should.eql(['Ooo lucky 20!']);
  });

  it('should discover a plural key without arguments', function() {
    var fn = translate({
      one: 'a car',
      other: 'many cars'
    }, 'en', {defaultPluralKey: 'cars'});

    fn({cars: 1}).should.eql(['a car']);
    fn({cars: 20}).should.eql(['many cars']);
  });

  it('should make a best guess at which key from many to use', function() {
    var fn = translate({
      one: 'a %{first}, %{second} car',
      other: '%{count} %{first}, %{second} cars'
    }, 'en');

    fn({first: 'junky', second: 'horrible', count: 1}).should.eql(['a ', 'junky', ', ', 'horrible', ' car']);
    fn({first: 'junky', second: 'horrible', count: 20}).should.eql(['20', ' ', 'junky', ', ', 'horrible', ' cars']);
  });

  it('should strip contry codes if they aren\'t present', function() {
    var fn = translate({
      one: 'Um carro',
      other: '%{count} carros'
    }, 'pt-BR');

    fn({count: 1}).should.eql(['Um carro']);
    fn({count: 2}).should.eql(['2', ' carros']);
  });
});
