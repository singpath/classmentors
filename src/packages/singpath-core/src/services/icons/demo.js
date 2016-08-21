import template from './demo.html!text';

/**
 * Holds the list of icon to display
 */
class Controller {

  constructor(spfNavBarService) {

    spfNavBarService.update('Icons');

    this.icons = [
      'language:python',
      'language:java',
      'language:javascript',
      'language:angularjs',
      'add',
      'add-circle-outline',
      'arrow-back',
      'arrow-forward',
      'bookmark-outline',
      'check',
      'chevron-left',
      'chevron-right',
      'clear',
      'create',
      'delete',
      'done',
      'exit-to-app',
      'highlight-remove',
      'home',
      'info-outline',
      'keyboard-arrow-left',
      'keyboard-arrow-right',
      'launch',
      'loop',
      'more-horiz',
      'not-interested',
      'person',
      'play-arrow',
      'reorder',
      'settings'
    ];
  }

}

Controller.$inject = ['spfNavBarService'];

export const component = {template, controller: Controller};

export function config($routeProvider, routes) {
  $routeProvider.when(routes.icons, {template: '<icons-demo></icons-demo>'});
}
config.$inject = [
  '$routeProvider',
  'routes'
];
