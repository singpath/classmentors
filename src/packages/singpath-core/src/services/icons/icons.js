/**
 * Defined an icon set.
 *
 * The set is build at https://icomoon.io/app:
 * 0. go to https://icomoon.io/app.
 * 1. Select icons from the "Material Design Icons" collection.
 * 2. download and extract the set.
 * 3. copy svgdefs.svg into this component folder
 *    (replace the existing ones).
 * 4. open svgdefs.svg and replace all the `symbols` tags for `g` tags.
 * 5. open svgdefs.svg and rename all icon ids from "icon-something" to just
 *    "something"
 *
 * The language icons are from https://github.com/konpa/devicon
 *
 * The set is now ready.
 */

import setTmpl from './svgdefs.svg!text';
import pythonTmpl from './icons-python.svg!text';
import angularjsTmpl from './icons-angularjs.svg!text';
import javascriptTmpl from './icons-javascript.svg!text';
import javaTmpl from './icons-java.svg!text';

const iconSet = {url: 'icons/svgdefs.svg', tmpl: setTmpl, vb: 1024};
const langIcons = [{
  title: 'language:python',
  url: 'icons/icons-python.svg',
  tmpl: pythonTmpl,
  vb: 128
}, {
  title: 'language:angularjs',
  url: 'icons/icons-angularjs.svg',
  tmpl: angularjsTmpl,
  vb: 128
}, {
  title: 'language:javascript',
  url: 'icons/icons-javascript.svg',
  tmpl: javascriptTmpl,
  vb: 128
}, {
  title: 'language:java',
  url: 'icons/icons-java.svg',
  tmpl: javaTmpl,
  vb: 128
}];

/**
 * Register the icon set and each language icon with ng-material' $mdIconProvider.
 *
 * @param  {object} $mdIconProvider $mdIcon provider.
 */
export function config($mdIconProvider) {
  $mdIconProvider.defaultIconSet(iconSet.url, iconSet.vb);
  langIcons.forEach(i => $mdIconProvider.icon(i.title, i.url, i.vb));
}

config.$inject = ['$mdIconProvider'];

/**
 * Populate template cache with each icon svg definition.
 *
 * @param  {object} $templateCache $templateCache service.
 */
export function run($templateCache) {
  $templateCache.put(iconSet.url, iconSet.tmpl);
  langIcons.forEach(i => $templateCache.put(i.url, i.tmpl));
}

run.$inject = ['$templateCache'];
