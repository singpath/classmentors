/**
 * singpath-core/config.js
 */

/**
 * Configure cfpLoadingBar options.
 *
 * spfShared.config(config.loadingBar);
 * spfShared.config(mdTheme);
 *
 * @param {object} cfpLoadingBarProvider loading bar service
 */
export function loadingBar(cfpLoadingBarProvider) {
  cfpLoadingBarProvider.includeSpinner = false;
}

loadingBar.$inject = ['cfpLoadingBarProvider'];

/**
 * Configure theme colours
 *
 * @param  {object} $mdThemingProvider ngMaterial theming provider.
 */
export function mdTheme($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .primaryPalette('indigo')
    .accentPalette('amber')
    .warnPalette('deep-orange');
}

mdTheme.$inject = ['$mdThemingProvider'];
