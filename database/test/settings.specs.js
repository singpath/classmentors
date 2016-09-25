'use strict';

const chai = require('chai');
const expect = chai.expect;
const utils = require('./utils.js');
const auth = utils.auth;

describe('settings', function() {

  beforeEach(function() {
    utils.setFirebaseData();
  });

  it('should be readeable for all', function() {
    expect(null).can.read.to.path('classMentors/settings');
  });

  it('should be writable for admin', function() {
    expect(auth.admin).can.write({
      value: true,
      title: 'Some settings',
      type: 'boolean'
    }).to.path('classMentors/settings/some-id');
  });

  it('should not be writeable by non-admin user', function() {
    expect(auth.bob).cannot.write({
      value: true,
      title: 'Some settings',
      type: 'boolean'
    }).to.path('classMentors/settings/someId');
  });

});
