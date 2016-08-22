import {expect, testInjectMatch} from 'singpath-core/tools/chai.js';

import * as firebase from './firebase.js';

describe('firebase service', function() {

  describe('cleanObj', function() {

    it('should remove invalid key', function() {
      expect(firebase.cleanObj({$foo: 1, foo: 2})).to.eql({foo: 2});
    });

    it('should convert undefined value to null', function() {
      expect(firebase.cleanObj(undefined)).to.be.null();
    });

    it('should leave literal values unchanged', function() {
      expect(firebase.cleanObj(1)).to.equal(1);
      expect(firebase.cleanObj('foo')).to.equal('foo');
    });

    it('should leave date values unchanged', function() {
      const value = new Date();

      expect(firebase.cleanObj(value)).to.equal(value);
    });

    it('should clean array members', function() {
      const value = [1, 2, undefined, {$foo: 1, foo: 2}];

      expect(firebase.cleanObj(value)).to.eql([1, 2, null, {foo: 2}]);
    });

    it('should clean object properties', function() {
      const value = {foo: 1, bar: 2, baz: undefined, fooz: {$foo: 1, foo: 2}};

      expect(firebase.cleanObj(value)).to.eql({foo: 1, bar: 2, baz: null, fooz: {foo: 2}});
    });

  });

  describe('run', function() {

    testInjectMatch(firebase.run);

    it('should throw if one of the app is not set', function() {
      expect(() => firebase.run({}, null, {})).to.throw(Error);
      expect(() => firebase.run(null, {}, {})).to.throw(Error);
    });

    it('should throw if the provider is not set', function() {
      expect(() => firebase.run({}, {}, null)).to.throw(Error);
    });

    it('should not throw if both app and provider are set', function() {
      expect(() => firebase.run({}, {}, {})).not.to.throw(Error);
    });

  });

});
