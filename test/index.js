var should = require('should');
var translate = require('../');

describe('translate', function() {
  it('should pluralize a phrase', function() {
    var fn = translate([
      'a car',
      '%{smart_count} cars'
    ], 'en');

    fn(0).should.eql([0, ' cars']);
    fn(1).should.eql(['a car']);
    fn(2).should.eql([2, ' cars']);
  });
});
