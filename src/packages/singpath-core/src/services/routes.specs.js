import {expect} from 'chai';
// import * as sinon from 'sinon';

import {urlForFactory} from './routes';

describe('routes service', function() {
  let routes;

  beforeEach(function() {
    routes = {
      home: '/',
      profile: '/profile/:publicId'
    };
  });

  describe('urlFor', function() {
    let urlFor;

    beforeEach(function() {
      urlFor = urlForFactory(routes);
    });

    it('should return a static url', function() {
      expect(urlFor('home')).to.equal('/');
    });

    it('should return a dynamic url', function() {
      expect(urlFor('profile', {publicId: 'bob'})).to.equal('/profile/bob');
      expect(urlFor('profile', {publicId: 'alice'})).to.equal('/profile/alice');
    });

  });

});
