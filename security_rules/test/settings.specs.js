'use strict';

const chai = require('chai');
const expect = chai.expect;
const utils = require('./utils.js');

describe('settings', function() {
  let init, bob;

  beforeEach(function() {
    const isAdmin = true;
    const isPremium = true;

    bob = utils.bob({isAdmin, isPremium});
    init = {
      auth: bob.auth,
      classMentors: {
        userProfiles: bob.userProfiles,
        admins: bob.admins,
        premiumUsers: bob.premiumUsers,
        settings: {
          someId: {
            value: false,
            title: 'Some settings',
            type: 'boolean'
          }
        }
      }
    };
    utils.setFirebaseData(init);
  });

  it('should be readeable for all', function() {
    expect(null).can.read.to.path('classMentors/settings');
  });

  it('should be writable for admin', function() {
    expect(bob.firebaseAuth).can.write({
      value: true,
      title: 'Some settings',
      type: 'boolean'
    }).to.path('classMentors/settings/some-id');
  });

  it('should not be writeable by non-admin user', function() {
    init.classMentors.admins[bob.uid] = false;
    init.classMentors.userProfiles[bob.publicId].user.isAdmin = false;
    utils.setFirebaseData(init);
    expect(bob.firebaseAuth).cannot.write({
      value: true,
      title: 'Some settings',
      type: 'boolean'
    }).to.path('classMentors/settings/someId');
  });

});
