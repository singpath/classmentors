import * as services from './services.js';

import {expect, sinon, testInjectMatch} from 'classmentors/tools/chai.js';

describe('services', function() {

  describe('clmServices', function() {
    let clmServices, db, settingsRef,
      $firebaseObject, $log, $q, $timeout, firebaseApp;

    beforeEach(function() {
      $firebaseObject = sinon.stub();
      $log = {
        error: sinon.spy(),
        warn: sinon.spy()
      };
      $q = {
        resolve: v => Promise.resolve(v),
        reject: e => Promise.reject(e),
        all: a => Promise.all(a),
        race: a => Promise.race(a)
      };
      $timeout = sinon.stub();
      $timeout.cancel = sinon.stub();

      db = {ref: sinon.stub()};
      firebaseApp = {database: sinon.stub()};
      firebaseApp.database.returns(db);

      settingsRef = {on: sinon.spy()};
      db.ref.withArgs('classMentors/settings').returns(settingsRef);

      clmServices = services.clmServicesFactory($firebaseObject, $log, $q, $timeout, firebaseApp);
    });

    testInjectMatch(services.clmServicesFactory);

    it('should listen for settings change', function() {
      expect(settingsRef.on).to.have.been.calledOnce();
      expect(settingsRef.on).to.have.been.calledWith('value', sinon.match.func);
    });

    it('should update the list of enabled service on each changes', function() {
      const handler = settingsRef.on.lastCall.args[1];
      const snapshot = {val: sinon.stub()};
      const settings = {
        enableCodeCombat: {value: true},
        enablePivotalExpert: {value: false},
        enableFoo: {value: false}
      };

      clmServices.register('Code Combat');
      clmServices.register('Pivotal Expert');

      snapshot.val.returns(settings);
      handler(snapshot);
      expect(
        clmServices.available().sort().map(s => s.serviceId)
      ).to.eql(['codeCombat']);

      settings.enablePivotalExpert.value = true;
      handler(snapshot);
      expect(
        clmServices.available().sort().map(s => s.serviceId)
      ).to.eql(['codeCombat', 'pivotalExpert']);
    });

    it('should update the list of enabled service on update err', function() {
      expect(settingsRef.on).to.have.been.calledWith('value', sinon.match.func, sinon.match.func);

      const handler = settingsRef.on.lastCall.args[1];
      const errHandler = settingsRef.on.lastCall.args[2];
      const snapshot = {val: sinon.stub()};
      const settings = {
        enableCodeCombat: {value: true},
        enablePivotalExpert: {value: false},
        enableFoo: {value: false}
      };

      clmServices.register('Code Combat');
      clmServices.register('Pivotal Expert');

      snapshot.val.returns(settings);
      handler(snapshot);
      expect(clmServices.available()).to.have.length(1);

      errHandler();
      expect(clmServices.available()).to.eql([]);
    });

    describe('#register', function() {

      it('should register a service', function() {
        const service = clmServices.register('foo bar', 'foo', 'enableFoo');

        expect(clmServices.foo).to.equal(service);
        expect(clmServices.foo.name).to.equal('foo bar');
        expect(clmServices.foo.serviceId).to.equal('foo');
        expect(clmServices.foo.settingId).to.equal('enableFoo');
      });

      it('should register a service with default settingId', function() {
        clmServices.register('foo bar', 'foo');
        expect(clmServices.foo.settingId).to.equal('enableFooBar');
      });

      it('should register a service with default serviceId', function() {
        clmServices.register('foo bar');
        expect(clmServices.fooBar.serviceId).to.equal('fooBar');
      });

    });

    describe('enableServices', function() {
      let settings;

      beforeEach(function() {
        settings = {enableFoo: {value: true}};
        clmServices.register('foo');
      });

      it('should set $settings', function() {
        clmServices.enableServices(settings);
        expect(clmServices.$settings).to.eql(settings);

        clmServices.enableServices(null);
        expect(clmServices.$settings).to.eql({});
      });

      it('should update the list of enabled service', function() {
        clmServices.enableServices(settings);
        expect(clmServices.available()).to.eql([clmServices.foo]);

        clmServices.enableServices(null);
        expect(clmServices.available()).to.eql([]);
      });

    });

    describe('#refresh', function() {
      let profile;

      beforeEach(function() {
        profile = {
          $id: 'bob',
          services: {codeCombat: {details: {id: 'codecombat:bob'}}}
        };
        clmServices.register('Code Combat');
        clmServices.register('Free Code Camp');
        sinon.stub(clmServices, 'registeredWith');
        clmServices.registeredWith.withArgs(profile).returns([clmServices.codeCombat]);

        sinon.stub(clmServices.codeCombat, 'requestUpdate');
        sinon.stub(clmServices.freeCodeCamp, 'requestUpdate');
      });

      it('should request update for each available/registeredWith service', function() {
        return clmServices.refresh(profile).then(() => {
          expect(clmServices.codeCombat.requestUpdate).to.have.been.calledOnce();
          expect(clmServices.codeCombat.requestUpdate).to.have.been.calledWith('bob');
          expect(clmServices.freeCodeCamp.requestUpdate).to.not.have.been.called();
        });
      });

    });

    describe('#ref', function() {
      let ref;

      beforeEach(function() {
        ref = {};
        db.ref.reset();
        db.ref.withArgs('classMentors/userProfiles/bob/services').returns(ref);
      });

      it('should return a reference to user\'s services data', function() {
        expect(clmServices.ref('bob')).to.equal(ref);
        expect(db.ref).to.have.been.calledOnce();
      });

      it('should throw if no public id are provided', function() {
        expect(() => clmServices.ref('')).to.throw();
      });

    });

    describe('#registeredWith', function() {
      let profile;

      beforeEach(function() {
        clmServices.register('Code Combat');
        clmServices.register('Free Code Camp');
        clmServices.register('Pivotal Expert');
        sinon.stub(clmServices, 'available');
        clmServices.available.returns([clmServices.codeCombat, clmServices.freeCodeCamp]);

        profile = {services: {codeCombat: {details: {id: 'codecombat:bob'}}}};
      });

      it('should filter out service that are not enabled and that the user didn\'t register with', function() {
        expect(clmServices.registeredWith(profile)).to.eql([clmServices.codeCombat]);
      });
    });

    describe('services', function() {
      let service;

      beforeEach(function() {
        service = clmServices.register('Code Combat');
      });

      it('should have a name', function() {
        expect(service).to.have.property('name', 'Code Combat');
      });

      it('should have a service id', function() {
        expect(service).to.have.property('serviceId', 'codeCombat');
      });

      it('should have a setting id', function() {
        expect(service).to.have.property('settingId', 'enableCodeCombat');
      });

      describe('deprecated methods', function() {
        const meths = ['badges', 'fetchProfile', 'fetchBadges', 'updateProfile'];

        meths.forEach(method => {

          describe(`#${method}`, function() {

            it('should be deprecated', function() {
              service[method]();
              expect($log.warn).to.have.been.calledOnce();
            });

          });

        });

      });

      describe('#availableBadges', function() {
        let ref, $badges;

        beforeEach(function() {
          ref = {key: 'codeCombat'};
          db.ref.withArgs('classMentors/badges/codeCombat').returns(ref);

          $badges = {$loaded: sinon.stub()};
          $firebaseObject.withArgs(ref).returns($badges);
          $badges.$loaded.returns(Promise.resolve());
        });

        it('should return a loaded synchronized object of the code combat badges', function() {
          return service.availableBadges().then(b => {
            expect(b).to.equal($badges);
            expect(b.$loaded).to.have.been.calledOnce();
          });
        });

        it('should cache the request', function() {
          service.availableBadges();

          return service.availableBadges().then(b => {
            expect($firebaseObject).to.have.been.calledOnce();
            expect(b.$loaded).to.have.been.calledOnce();
          });
        });

      });

      describe('#dataRef', function() {
        let ref;

        beforeEach(function() {
          ref = {key: 'codeCombat'};
          db.ref.withArgs('classMentors/userProfiles/bob/services/codeCombat').returns(ref);
        });

        it('should returns a Reference for the user\'s service data', function() {
          expect(service.dataRef('bob')).to.equal(ref);
        });

      });

      describe('#data', function() {
        let profile;

        beforeEach(function() {
          profile = {
            services: {
              codeCombat: {
                details: {
                  id: 'codecombat:bob',
                  name: 'codecombat:bob'
                },
                lastUpdate: 2,
                lastUpdateRequest: 1
              }
            }
          };
        });

        it('should extract the service data from the profile data', function() {
          expect(service.data(profile)).to.equal(profile.services.codeCombat);
        });

        it('should return undefined if the id is missing', function() {
          profile.services.codeCombat.details.id = undefined;
          expect(service.data(profile)).to.be.undefined();
        });

      });

      describe('#details', function() {
        let profile;

        beforeEach(function() {
          profile = {
            services: {
              codeCombat: {
                details: {
                  id: 'codecombat:bob',
                  name: 'codecombat:bob'
                },
                lastUpdate: 2,
                lastUpdateRequest: 1
              }
            }
          };
        });

        it('should extract the service details from the profile data', function() {
          expect(service.details(profile)).to.equal(profile.services.codeCombat.details);
        });

        it('should return undefined if the id is missing', function() {
          profile.services.codeCombat.details.id = undefined;
          expect(service.details(profile)).to.be.undefined();
        });

      });

      describe('#saveDetails', function() {
        let ref, details;

        beforeEach(function() {
          ref = {set: sinon.stub()};
          db.ref.withArgs(
            'classMentors/userProfiles/bob/services/codeCombat/details'
          ).returns(ref);

          details = {id: 'codecombat:bob', name: 'codecombat:bob'};
          ref.set.returns(Promise.resolve());

          sinon.stub(service, 'requestUpdate');
          service.requestUpdate.returns(Promise.resolve());
        });

        it('should save the user details', function() {
          return service.saveDetails('bob', details).then(() => {
            expect(ref.set).to.have.calledOnce();
            expect(ref.set).to.have.calledWith(sinon.match({
              id: details.id,
              name: details.name,
              registeredBefore: {'.sv': 'timestamp'}
            }));
          });
        });

        it('should request an update', function() {
          return service.saveDetails('bob', details).then(() => {
            expect(service.requestUpdate).to.have.calledOnce();
            expect(service.requestUpdate).to.have.calledWith('bob');
          });
        });

        it('should reject if the public id is missing', function() {
          return service.saveDetails('', details).then(
            () => Promise.reject(new Error('unexpected')),
            () => expect(ref.set).to.not.have.called()
          );
        });

        it('should reject if the user id for the service is missing', function() {
          return service.saveDetails('bob', {name: 'bob'}).then(
            () => Promise.reject(new Error('unexpected')),
            () => expect(ref.set).to.not.have.called()
          );
        });

        it('should reject if it failed to save the details', function() {
          const err = new Error('failed to save');

          ref.set.returns(Promise.reject(err));

          return service.saveDetails('bob', details).then(
            () => Promise.reject(new Error('unexpected')),
            e => {
              expect(e).to.equal(err);
              expect(service.requestUpdate).to.not.have.called();
            }
          );
        });

        it('should not reject if it failed to request an update', function() {
          const err = new Error('failed to request update');

          service.requestUpdate.returns(Promise.reject(err));

          return service.saveDetails('bob', details).then(() => {
            expect($log.error).to.have.been.calledOnce();
            expect($log.error).to.have.been.calledWith(err);
          });
        });

      });

      describe('#removeDetails', function() {
        let ref;

        beforeEach(function() {
          ref = {remove: sinon.stub()};
          db.ref.withArgs(
            'classMentors/userProfiles/bob/services/codeCombat'
          ).returns(ref);

          ref.remove.returns(Promise.resolve());
        });

        it('should remove the users details', function() {
          return service.removeDetails('bob').then(
            () => expect(ref.remove).to.have.been.calledOnce()
          );
        });

        it('should reject if the user public id is not provided', function() {
          return service.removeDetails('').then(
            () => Promise.reject(new Error('unexpected')),
            () => expect(ref.remove).to.not.have.been.called()
          );
        });

        it('should reject if the operation failed', function() {
          const err = new Error('failed to remove service data');

          ref.remove.returns(Promise.reject(err));

          return service.removeDetails('bob').then(
            () => Promise.reject(new Error('unexpected')),
            e => {
              expect(ref.remove).to.have.been.called();
              expect(e).to.equal(err);
            }
          );
        });

      });

      describe('#requestUpdate', function() {
        let rootRef, tasksRef, newTaskRef;

        beforeEach(function() {
          rootRef = {update: sinon.stub()};
          tasksRef = {push: sinon.stub()};
          newTaskRef = {key: 'someNewTaskId'};

          rootRef.update.returns(Promise.resolve());
          tasksRef.push.returns(newTaskRef);

          db.ref.withArgs('/').returns(rootRef);
          db.ref.withArgs('queue/tasks').returns(tasksRef);
        });

        it('should add a new task', function() {
          service.requestUpdate('bob');
          expect(rootRef.update).to.have.calledOnce();
          expect(rootRef.update).to.have.calledWith(sinon.match(
            {'queue/tasks/someNewTaskId': {id: 'bob', service: 'codeCombat'}}
          ));
        });

        it('should update the user service lastUpdateRequest', function() {
          service.requestUpdate('bob');
          expect(rootRef.update).to.have.calledOnce();
          expect(rootRef.update).to.have.calledWith(sinon.match(
            {'classMentors/userProfiles/bob/services/codeCombat/lastUpdateRequest': {'.sv': 'timestamp'}}
          ));
        });

        it('should reject if the user public id is not provided', function() {
          return service.requestUpdate('').then(
            () => Promise.reject(new Error('unexpected')),
            () => expect(rootRef.update).to.not.have.been.called()
          );
        });

        it('should reject if the update failed', function() {
          const err = new Error('Update failed.');

          rootRef.update.returns(Promise.reject(err));

          return service.requestUpdate('bob').then(
            () => Promise.reject(new Error('unexpected')),
            e => expect(e).to.equal(err)
          );
        });

      });

    });

  });

  describe('clmDataStore', function() {

    testInjectMatch(services.clmDataStoreFactory);

  });

});
