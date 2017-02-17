/* eslint no-new: "off" */
import {expect} from 'chai';
import sinon from 'sinon';

import tmpl from './ace-view.html!text';
import {component, getStats, ACE_STATS_URL, configRoute} from './ace.js';

describe('ace component', function() {

  it('should set the template', function() {
    expect(component.template).to.equal(tmpl);
  });

});

describe('aceStatsUrl constant', function() {

  it('should be set', function() {
    expect(ACE_STATS_URL).to.be.ok;
  });

});

describe('getStats resolver helper', function() {
  const aceStatsUrl = 'http://ace.stats/';
  let http;

  beforeEach(function() {
    http = {
      get: sinon.stub().returns(Promise.reject())
    };
  });

  it('should fetch the ace stats', function() {
    getStats(http, aceStatsUrl);
    expect(http.get).to.have.been.calledOnce;
    expect(http.get).to.have.been.calledWithExactly(aceStatsUrl);
  });

  it('should resolve to the response data', function() {
    const resp = {data: {some: 'stats'}};

    http.get.returns(Promise.resolve(resp));

    // By returning a promise, the test runner knows the test asynchronous
    // and will wait for it resolve.
    return getStats(http, aceStatsUrl).then(
      data => expect(data).to.equal(resp.data)
    );
  });
});

describe('configRoute', function() {
  let $routeProvider, routes;

  beforeEach(function() {
    $routeProvider = {
      when: sinon.stub(),
      otherwise: sinon.stub()
    };
    $routeProvider.when.returnsThis();
    $routeProvider.otherwise.returnsThis();

    routes = {aceOfCoders: 'foo'};

    configRoute($routeProvider, routes);
  });

  it('should config the ace route', function() {
    expect($routeProvider.when).to.have.been.calledOnce();
    expect($routeProvider.when).to.have.been.calledWith(routes.aceOfCoders, sinon.match({
      template: sinon.match.string,
      resolve: sinon.match({navBar: sinon.match.func})
    }));
  });

  it('should configure navbar title', function() {
    const resolveNavbar = $routeProvider.when.lastCall.args[1].resolve.navBar;

    expect(resolveNavbar()).to.eql({title: '2017 National Coding Championships'});
  });

});
