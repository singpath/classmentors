/**
 * classmentors/filters - shared filter factories.
 */

export function cmTruncateFilterFactory() {
  return function cmTruncate(s, limit) {
    if (!s || !s.length || !limit) {
      return '';
    }

    if (s.length <= limit) {
      return s;
    }

    return `${s.slice(0, limit)}...`;
  };
}
cmTruncateFilterFactory.$inject = [];

export function cmTruncateFilterBooleanFactory() {
  return function cmTruncateBoolean(s, limit) {
    if (!s || !s.length || !limit) {
      return {
          content: '',
          truncated: false
      };
    }

    if (s.length <= limit) {
      return {
          content: s,
          truncated: false
      };
    }

    return {
        content: `${s.slice(0, limit)}...`,
        truncated: true
    };
  };
}
cmTruncateFilterBooleanFactory.$inject = [];
