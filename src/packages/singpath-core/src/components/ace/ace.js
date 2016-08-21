import ace from 'ace';
import 'ace/mode-html.js';
import 'ace/mode-java.js';
import 'ace/mode-javascript.js';
import 'ace/mode-python.js';
import 'ace/theme-twilight.js';
import './ace.css!';

const noop = () => undefined;

/**
 * Directive transforming a textarea to a ace editor.
 *
 * @usage
 * <spf-editor-container flex>
 *     <label>Tests</label>
 *     <textarea name="someTextAreaName"
 *         ng-model="$ctrl.someContent"
 *         columns="1"
 *         ng-required="true"
 *         ng-minlength="3"
 *         ng-maxlength="4096"
 *         spf-editor="{{$ctrl.someLanguage}}"
 *     ></textarea>
 *     <div ng-messages="someFormName.someTextAreaName.$error">
 *         <div ng-message="required">This is required.</div>
 *         <div ng-message="minlength">This has to be more than 3 characters long.</div>
 *         <div ng-message="maxlength">this has to be less than 4096 characters long.</div>
 *     </div>
 * </spf-editor-container>
 *
 * @param  {object} $log Angular logging service
 * @return {[type]}      [description]
 */
export function spfEditorDirectiveFactory($log) {
  var editorIds = 1;

  var languageToMode = {
    angularjs: 'html',
    python: 'python',
    javascript: 'javascript',
    java: 'java'
  };

  return {
    restrict: 'A',
    require: 'ngModel',
    link: function spfAceLink(scope, elm, attrs, ngModel) {
      var editorId = `spf-editor-${editorIds++}`;
      var editor, session;
      var render = ngModel.$render || noop;
      var container = elm.parent();
      var label = container.find('label');
      var watchers = [];

      // Setup DOM
      elm.after(`<div class="spf-ace-editor" id="${editorId}"/>`);
      editor = ace.edit(elm.next()[0]);
      session = editor.getSession();
      elm.css('display', 'none');

      // Link editor and model
      ngModel.$formatters.push(function(value) {
        if (value == null) {
          return '';
        }

        switch (typeof value) {
          case 'object':
          case 'array':
            throw new Error('ui-ace cannot use an object or an array as a model');
          default:
            return value;
        }
      });

      ngModel.$render = function() {
        render();
        session.setValue(ngModel.$viewValue);
      };

      session.on('change', function() {
        ngModel.$setViewValue(session.getValue(), 'change');
        render();
      });

      editor.on('focus', function() {
        container.addClass('has-focus');
      });

      editor.on('blur', function() {
        ngModel.$setViewValue(session.getValue(), 'blur');
        render();
        container.removeClass('has-focus');
        container.addClass('had-focus');
      });

      // Make label behave like a label
      label.on('click', clickHandler);

      function clickHandler() {
        editor.focus();
      }

      // Observed attributes
      watchers.push(attrs.$observe('spfEditor', function(value) {
        var mode;

        if (!value) {
          return;
        }

        mode = languageToMode[value];
        if (!mode) {
          $log.error(`No mode for ${value}`);
          return;
        }

        session.setMode(`ace/mode/${mode}`);
      }));

      watchers.push(attrs.$observe('spfReadonly', function(value) {
        var isReadOnly = scope.$eval(value);

        editor.setReadOnly(isReadOnly);
      }));

      // Other options
      editor.setTheme('ace/theme/twilight');
      editor.setFontSize(14);
      editor.renderer.setShowGutter(true);
      editor.renderer.setShowInvisibles(true);
      session.setUseWrapMode(true);
      session.setUseSoftTabs(true);

      // Watch for resize
      watchers.push(scope.$watch(function() {
        return [elm[0].offsetWidth, elm[0].offsetHeight];
      }, function() {
        editor.resize();
        editor.renderer.updateFull();
      }, true));

      // Decorate container with input state
      ['pristine', 'valid', 'invalid'].map(function(state) {
        var attrName = `$${state}`;
        var className = `is-${state}`;

        watchers.push(scope.$watch(function() {
          return ngModel[attrName];
        }, function() {
          if (ngModel[attrName]) {
            container.addClass(className);
          } else {
            container.removeClass(className);
          }
        }));
      });

      watchers.push(scope.$watch(function() {
        return ngModel.$viewValue;
      }, function() {
        if (ngModel.$viewValue.length === 0) {
          container.addClass('is-empty');
        } else {
          container.removeClass('is-empty');
        }
      }));

      // clean up
      elm.on('$destroy', function() {
        editor.session.$stopWorker();
        editor.destroy();
        watchers.map(function(deregistrationFn) {
          deregistrationFn();
        });
        label.off('click', clickHandler);
      });

    }
  };
}

spfEditorDirectiveFactory.$inject = ['$log'];
