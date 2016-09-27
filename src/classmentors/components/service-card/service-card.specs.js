import {expect, sinon, testInjectMatch} from 'classmentors/tools/chai.js';

import * as card from './service-card.js';

function wait(delay) {
  return new Promise(resolve => setTimeout(resolve, delay || 10));
}

describe('clm-service-card component:', function() {

  describe('ServiceCardCtrl', function() {
    const serviceId = 'someService';
    const publicId = 'bob';
    const userId = 'someservice:bob';

    let ctrl, service, serviceRef, $data, $unwatchUser, $unwatchData,
      $profileUrlTemplate, canRefresh,
      $attrs, $document, $firebaseObject, $interpolate, $log, $mdDialog, $q, $timeout,
      clmServices, spfAlert, spfCurrentUser, clmRefreshTimout;

    beforeEach(function() {
      $q = {all: ps => Promise.all(ps)};

      $timeout = sinon.stub();
      $timeout.cancel = sinon.spy();

      clmRefreshTimout = 60000;

      $attrs = {profileTemplate: 'http://example.com/profile/{{name}}'};

      $document = [{querySelector: sinon.stub()}];

      $log = {error: sinon.spy(), debug: sinon.spy()};

      $mdDialog = {show: sinon.spy()};

      spfAlert = {error: sinon.spy(), success: sinon.spy()};

      $unwatchData = sinon.spy();
      $data = {$watch: sinon.stub()};
      $data.$watch.withArgs(sinon.match.func).returns($unwatchData);

      serviceRef = {};
      service = {dataRef: sinon.stub()};
      service.dataRef.withArgs(publicId).returns(serviceRef);
      clmServices = {[serviceId]: service};

      $firebaseObject = sinon.stub();
      $firebaseObject.withArgs(serviceRef).returns($data);

      $profileUrlTemplate = sinon.stub();
      $profileUrlTemplate.withArgs(sinon.match({
        id: userId,
        name: userId
      })).returns(`http://example.com/profile/${userId}`);
      $interpolate = sinon.stub();
      $interpolate.withArgs(
        $attrs.profileTemplate, false, undefined, true
      ).returns($profileUrlTemplate);

      $unwatchUser = sinon.spy();
      spfCurrentUser = {publicId, $watch: sinon.stub()};
      spfCurrentUser.$watch.returns($unwatchUser);

      ctrl = new card.ServiceCardCtrl(
        $attrs, $document, $firebaseObject, $interpolate, $log, $mdDialog, $q, $timeout,
        clmServices, spfAlert, spfCurrentUser, clmRefreshTimout
      );

    });

    testInjectMatch(card.ServiceCardCtrl);

    it('should watch current user changes', function() {
      expect(spfCurrentUser.$watch).to.have.been.calledOnce();
      expect(spfCurrentUser.$watch).to.have.been.calledWith(sinon.match.func);
      expect(ctrl.$unwatchUser).to.equal($unwatchUser);
    });

    it('should have a currentUser property', function() {
      expect(ctrl.currentUser).to.equal(spfCurrentUser);
    });

    it('should have an interpolation function to build profile URL', function() {
      expect(ctrl.$profileUrlTemplate).to.equal($profileUrlTemplate);
    });

    it('should set $unwatchData', function() {
      expect(ctrl.$unwatchData()).to.be.undefined();
    });

    it('should set $unwatchUser', function() {
      expect(ctrl.$unwatchUser()).to.be.undefined();
    });

    describe('#$onChanges', function() {
      let changes;

      beforeEach(function() {
        ctrl.publicId = publicId;
        ctrl.serviceId = serviceId;
        sinon.stub(ctrl, 'watchData');

        changes = {publicId: {}, serviceId: {}, disableRefresh: {}};
      });

      it('should watch the user data if the publicId or the serviceId changes', function() {
        ctrl.$onChanges({disableRefresh: {}});
        expect(ctrl.watchData).to.not.have.been.called();

        ctrl.$onChanges(changes);
        expect(ctrl.watchData).to.have.been.calledOnce();
      });

      it('should update canRefresh when the disableRefresh is updated', function() {
        ctrl.canRefresh = false;
        ctrl.$onChanges({publicId: {}});
        expect(ctrl.canRefresh).to.be.false();

        ctrl.canRefresh = true;
        ctrl.$onChanges({publicId: {}});
        expect(ctrl.canRefresh).to.be.true();

        ctrl.disableRefresh = Promise.resolve();
        ctrl.$onChanges(changes);
        expect(ctrl.canRefresh).to.be.false();
      });

    });

    describe('#$onDestroy', function() {

      it('should deregister all listereners', function() {
        sinon.spy(ctrl, '$unwatchData');

        ctrl.$onDestroy();
        expect(ctrl.$unwatchData).to.have.been.calledOnce();
        expect(ctrl.$unwatchUser).to.have.been.calledOnce();
      });

      it('should release the service data synchronized object', function() {
        ctrl.data = {$destroy: sinon.spy()};
        ctrl.$onDestroy();
        expect(ctrl.data.$destroy).to.have.been.calledOnce();
      });

      it('should cancel the refresh timer', function() {
        const to = {};

        ctrl.$disableRefresh = to;
        ctrl.$onDestroy();
        expect($timeout.cancel).to.have.been.calledOnce();
        expect($timeout.cancel).to.have.been.calledWith(to);
        expect(ctrl.$disableRefresh).to.be.undefined();

        $timeout.cancel.reset();
        ctrl.$onDestroy();
        expect($timeout.cancel).to.not.have.been.called();

      });

    });

    describe('#watchData', function() {

      beforeEach(function() {
        ctrl.publicId = publicId;
        ctrl.serviceId = serviceId;
        ctrl.service = service;
      });

      it('should be called when user data changes', function() {
        sinon.stub(ctrl, 'watchData');
        spfCurrentUser.$watch.lastCall.args[0]();
        expect(ctrl.watchData).to.have.been.calledOnce();
      });

      it('should reset flags', function() {
        ctrl.canEdit = true;
        ctrl.loading = false;
        ctrl.updating = true;
        ctrl.profileUrl = 'http://example.com/profile/someservice:bob';

        ctrl.watchData();

        expect(ctrl.canEdit).to.be.true();
        expect(ctrl.loading).to.be.true();
        expect(ctrl.updating).to.be.false();
        expect(ctrl.profileUrl).to.be.undefined();
      });

      it('should watch the user\'s service data', function() {
        ctrl.watchData();
        expect(service.dataRef).to.have.been.calledOnce();
        expect($firebaseObject).to.have.been.calledOnce();
        expect($data.$watch).to.have.been.calledOnce();
        expect($data.$watch).to.have.been.calledWith(sinon.match.func);
        expect(ctrl.$unwatchData).to.equal($unwatchData);
      });

      it('should unwatch previous ref', function() {
        const prev = sinon.spy();

        ctrl.$unwatchData = prev;
        ctrl.watchData();
        expect(prev).to.have.been.calledOnce();
      });

      it('should release the previous sync object', function() {
        const prev = {$destroy: sinon.spy()};

        ctrl.data = prev;
        ctrl.watchData();
        expect(prev.$destroy).to.have.been.calledOnce();
      });

      describe('change event', function() {
        let handler;

        beforeEach(function() {
          ctrl.watchData();
          handler = $data.$watch.lastCall.args[0];

          ctrl.canEdit = true;
          ctrl.data.details = {
            id: userId,
            name: userId
          };
        });

        it('should update profileUrl', function() {
          handler();
          expect($profileUrlTemplate).to.have.been.calledOnce();
          expect($profileUrlTemplate).to.have.been.calledWith(sinon.match({
            id: userId,
            name: userId
          }));
          expect(ctrl.profileUrl).to.equal(`http://example.com/profile/${userId}`);
        });

        it('should reset data states if there is no data for that service', function() {
          ctrl.canEdit = true;
          ctrl.loading = false;
          ctrl.updating = true;
          ctrl.profileUrl = 'http://example.com/profile/someservice:bob';

          ctrl.data.$value = null;
          handler();

          expect(ctrl.canEdit).to.be.true();
          expect(ctrl.loading).to.be.false();
          expect(ctrl.updating).to.be.false();
          expect(ctrl.profileUrl).to.be.undefined();
        });

      });

    });

    describe('#showAddDialog', function() {
      const selector = '#some-parent .some-type';
      let $event;

      beforeEach(function() {
        $event = {some: 'click'};
        $document.find = sinon.stub();
      });

      it('should open a dialog', function() {
        ctrl.showAddDialog($event, selector);
        expect($mdDialog.show).to.have.been.calledOnce();
      });

      it('should open the element the selector points to', function() {
        ctrl.showAddDialog($event, selector);
        expect($mdDialog.show).to.have.been.calledWith(sinon.match({contentElement: selector}));
        expect($mdDialog.show).to.not.have.been.calledWith(sinon.match.has('template'));
        expect($mdDialog.show).to.not.have.been.calledWith(sinon.match.has('templateUrl'));
      });

      it('should set body as the parent element', function() {
        const body = {};

        $document[0].body = body;
        $document.find.withArgs('body').returns(body);

        ctrl.showAddDialog($event, selector);
        expect($mdDialog.show).to.have.been.calledWith(sinon.match({parent: body}));
      });

      it('should use the clic event as dialog target event', function() {
        ctrl.showAddDialog($event, selector);
        expect($mdDialog.show).to.have.been.calledWith(sinon.match({targetEvent: $event}));
      });

    });

    describe('#refresh', function() {

      beforeEach(function() {
        ctrl.publicId = publicId;
        ctrl.canRefresh = true;
        ctrl.service = {requestUpdate: sinon.stub()};
        ctrl.service.requestUpdate.withArgs(publicId).returns(Promise.resolve());
      });

      it('should request an update', function() {
        ctrl.refresh();
        expect(ctrl.service.requestUpdate).to.have.been.calledOnce();
      });

      it('should fail if the cannot refresh yet', function() {
        ctrl.canRefresh = false;
        ctrl.refresh();
        expect(ctrl.service.requestUpdate).to.not.have.been.called();
      });

      it('should update can refresh', function() {
        let defer;

        $timeout.returns(new Promise(resolve => (defer = resolve)));

        return ctrl.refresh().then(() => {
          expect(ctrl.canRefresh).to.be.false();
          defer();
          return wait();
        }).then(
          () => expect(ctrl.canRefresh).to.be.true()
        );
      });

      it('should report error', function() {
        ctrl.service.requestUpdate.withArgs(publicId).returns(Promise.reject());

        return ctrl.refresh().then(
          () => expect(spfAlert.error).to.have.been.calledOnce()
        );
      });

    });

    describe('#remove', function() {

      beforeEach(function() {
        ctrl.publicId = publicId;
        ctrl.service = {removeDetails: sinon.stub()};
        ctrl.service.removeDetails.withArgs(publicId).returns(Promise.resolve());
      });

      it('should a service from the user profile', function() {
        ctrl.remove();
        expect(ctrl.service.removeDetails).to.have.been.calledOnce();
      });

      it('should report success', function() {
        return ctrl.remove().then(
          () => expect(spfAlert.success).to.have.been.calledOnce()
        );
      });

      it('should report error', function() {
        ctrl.service.removeDetails.withArgs(publicId).returns(Promise.reject());

        return ctrl.remove().then(
          () => expect(spfAlert.error).to.have.been.calledOnce()
        );
      });

    });

  });

  describe('GenericServiceFormCtrl', function() {
    const publicId = 'bob';
    const serviceId = 'someService';
    const serviceName = 'Some Service';
    let ctrl, $log, $mdDialog, spfAlert, $card;

    beforeEach(function() {
      $log = {error: sinon.spy()};
      $mdDialog = {
        hide: sinon.stub(),
        cancel: sinon.stub()
      };
      spfAlert = {
        success: sinon.spy(),
        error: sinon.spy()
      };
      $card = {
        publicId,
        $profileUrlTemplate: sinon.stub(),
        service: {
          id: serviceId,
          name: serviceName,
          saveDetails: sinon.stub()
        }
      };

      ctrl = new card.GenericServiceFormCtrl($log, $mdDialog, spfAlert);
    });

    testInjectMatch(card.GenericServiceFormCtrl);

    it('should have a name', function() {
      expect(ctrl).to.have.property('name', undefined);
    });

    it('should have a profileUrl', function() {
      expect(ctrl).to.have.property('profileUrl', undefined);
    });

    describe('#$onInit', function() {

      beforeEach(function() {
        ctrl.$card = $card;
      });

      it('should set the profile url using placeholder for the user id/name', function() {
        const url = 'http://example.com/<user-name>';

        $card.$profileUrlTemplate.withArgs(
          sinon.match({id: '<user-name>', name: '<user-name>'})
        ).returns(url);

        ctrl.$onInit();
        expect(ctrl.profileUrl).to.equal(url);
      });

    });

    describe('#onNameChanged', function() {

      beforeEach(function() {
        ctrl.$card = $card;
      });

      it('should set the profile url using placeholder for the user id/name by default', function() {
        const url = 'http://example.com/<user-name>';

        ctrl.name = '';
        $card.$profileUrlTemplate.withArgs(
          sinon.match({id: '<user-name>', name: '<user-name>'})
        ).returns(url);

        ctrl.onNameChanged();
        expect(ctrl.profileUrl).to.equal(url);
      });

      it('should set the profile url using the user name', function() {
        const url = 'http://example.com/bob';

        ctrl.name = 'bob';
        $card.$profileUrlTemplate.withArgs(
          sinon.match({id: 'bob', name: 'bob'})
        ).returns(url);

        ctrl.onNameChanged();
        expect(ctrl.profileUrl).to.equal(url);
      });

    });

    describe('#save', function() {
      const userName = 'bob';

      beforeEach(function() {
        ctrl.name = userName;
        ctrl.$card = $card;
        ctrl.$card.service.saveDetails.returns(Promise.resolve());
        $mdDialog.hide.returns(Promise.resolve());
        $mdDialog.cancel.returns(Promise.resolve());
      });

      it('should save the user name', function() {
        ctrl.save(userName);
        expect($card.service.saveDetails).to.have.been.calledOnce();
        expect($card.service.saveDetails).to.have.been.calledWith(publicId, sinon.match({
          id: userName,
          name: userName
        }));
      });

      it('should report success', function() {
        return ctrl.save(userName).then(
          () => expect(spfAlert.success).to.have.been.calledOnce()
        );
      });

      it('should close the dialog on success', function() {
        return ctrl.save(userName).then(
          () => expect($mdDialog.hide).to.have.been.calledOnce()
        );
      });

      it('should report saving errors', function() {
        const err = new Error();

        ctrl.$card.service.saveDetails.returns(Promise.reject(err));

        return ctrl.save(userName).then(
          () => Promise.reject(new Error('unexpected')),
          e => expect(e).to.equal(err)
        ).then(() => {
          expect($mdDialog.hide).to.not.have.been.calledOnce();
          expect(spfAlert.error).to.have.been.calledOnce();
          expect($log.error).to.have.been.calledOnce();
          expect($log.error).to.have.been.calledWith(err);
        });
      });

    });

    describe('#close', function() {

      beforeEach(function() {
        $mdDialog.cancel.returns(Promise.resolve());
      });

      it('should close the dialog', function() {
        ctrl.close();
        expect($mdDialog.cancel).to.have.been.calledOnce();
      });

    });

  });

});
