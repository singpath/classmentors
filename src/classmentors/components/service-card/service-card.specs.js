import {expect, sinon, testInjectMatch} from 'classmentors/tools/chai.js';

import * as card from './service-card.js';

describe('clm-service-card component:', function() {

  describe('ServiceCardCtrl', function() {
    const serviceId = 'someService';
    const publicId = 'bob';
    const userId = 'someservice:bob';

    let ctrl, service, serviceRef, $data, $unwatchUser, $unwatchData,
      $profileUrlTemplate, canRefresh,
      $attrs, $document, $firebaseObject, $interpolate, $log, $mdDialog,
      clmServices, spfAlert, spfCurrentUser;

    beforeEach(function() {
      $attrs = {profileTemplate: 'http://example.com/profile/{{name}}'};
      $document = [{querySelector: sinon.stub()}];
      $log = {error: sinon.spy(), debug: sinon.spy()};
      $mdDialog = {show: sinon.spy()};
      spfAlert = {error: sinon.spy(), success: sinon.spy()};

      $unwatchData = sinon.spy();
      $data = {$watch: sinon.stub()};
      $data.$watch.withArgs(sinon.match.func).returns($unwatchData);

      serviceRef = {};
      service = {
        dataRef: sinon.stub(),
        canRequestUpdate: sinon.stub()
      };
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
        $attrs, $document, $firebaseObject, $interpolate, $log, $mdDialog,
        clmServices, spfAlert, spfCurrentUser
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

    it('should set $cancelRefreshTimer', function() {
      expect(ctrl.$cancelRefreshTimer()).to.be.undefined();
    });

    describe('#$onChanges', function() {

      beforeEach(function() {
        ctrl.publicId = publicId;
        ctrl.serviceId = serviceId;
        sinon.stub(ctrl, 'watchData');
      });

      it('should be called when the currentUser changes', function() {
        const handler = spfCurrentUser.$watch.lastCall.args[0];

        sinon.stub(ctrl, '$onChanges');
        handler();

        expect(ctrl.$onChanges).to.have.been.calledOnce();
      });

      it('should set "loading" to true', function() {
        ctrl.$onChanges();
        expect(ctrl.loading).to.be.true();
        expect(ctrl.updating).to.be.false();
        expect(ctrl.canRefresh).to.be.false();
      });

      it('should set "canEdit" to true when the current user is the owner', function() {
        ctrl.currentUser.publicId = publicId;
        ctrl.$onChanges();
        expect(ctrl.canEdit).to.be.true();
      });

      it('should set "canEdit" to false when the current user is not the owner', function() {
        ctrl.currentUser.publicId = `not-${publicId}`;
        ctrl.$onChanges();
        expect(ctrl.canEdit).to.be.false();
      });

      it('should set "canEdit" to false when the current user is not registered', function() {
        ctrl.currentUser.publicId = null;
        ctrl.$onChanges();
        expect(ctrl.canEdit).to.be.false();
      });

      it('should set "service"', function() {
        ctrl.$onChanges();
        expect(ctrl.service).to.equal(service);
      });

      it('should watch the user data', function() {
        ctrl.$onChanges();
        expect(ctrl.watchData).to.have.been.calledOnce();
      });

    });

    describe('#$onDestroy', function() {

      it('should deregister all listereners', function() {
        sinon.spy(ctrl, '$unwatchData');
        sinon.spy(ctrl, '$cancelRefreshTimer');

        ctrl.$onDestroy();
        expect(ctrl.$unwatchData).to.have.been.calledOnce();
        expect(ctrl.$unwatchUser).to.have.been.calledOnce();
        expect(ctrl.$cancelRefreshTimer).to.have.been.calledOnce();
      });

      it('should release the service data synchronized object', function() {
        ctrl.data = {$destroy: sinon.spy()};
        ctrl.$onDestroy();
        expect(ctrl.data.$destroy).to.have.been.calledOnce();
      });

    });

    describe('#watchData', function() {

      beforeEach(function() {
        ctrl.publicId = publicId;
        ctrl.serviceId = serviceId;
        ctrl.service = service;
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

          canRefresh = {value: true, timeout: Promise.resolve(), cancel: sinon.spy()};
          service.canRequestUpdate.withArgs($data).returns(canRefresh);
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

        it('should update canRefresh', function() {
          handler();
          expect(service.canRequestUpdate).to.have.been.calledOnce();
          expect(ctrl.canRefresh).to.be.true();
          expect(ctrl.$cancelRefreshTimer).to.be.a('function');
          expect(ctrl.$cancelRefreshTimer).to.not.equal(canRefresh.cancel);
        });

        it('should wait for refresh timer complete to set canRefresh to true', function() {
          canRefresh.value = false;

          const promise = handler();

          expect(service.canRequestUpdate).to.have.been.calledOnce();
          expect(ctrl.canRefresh).to.be.false();
          expect(ctrl.$cancelRefreshTimer).to.equal(canRefresh.cancel);

          return promise.then(() => expect(ctrl.canRefresh).to.be.true());
        });

        it('should log refresh timer getting cancelled', function() {
          canRefresh.value = false;
          canRefresh.timeout = Promise.reject();

          return handler().then(() => expect($log.debug).to.have.been.calledOnce());
        });

        it('should not update canRefresh if service cannot be edited', function() {
          ctrl.canEdit = false;
          handler();
          expect(service.canRequestUpdate).to.not.have.been.called();
        });

        it('should reset data states if there is no data for that service', function() {
          ctrl.canEdit = true;
          ctrl.loading = false;
          ctrl.canRefresh = true;
          ctrl.updating = true;
          ctrl.profileUrl = 'http://example.com/profile/someservice:bob';

          ctrl.data.$value = null;
          handler();

          expect(ctrl.canEdit).to.be.true();
          expect(ctrl.loading).to.be.false();
          expect(ctrl.canRefresh).to.be.false();
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
        ctrl.service = {requestUpdate: sinon.stub()};
        ctrl.service.requestUpdate.withArgs(publicId).returns(Promise.resolve());
      });

      it('should request an update', function() {
        ctrl.refresh();
        expect(ctrl.service.requestUpdate).to.have.been.calledOnce();
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
