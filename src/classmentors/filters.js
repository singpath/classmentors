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

export function showSchoolFilterFactory() {
    return function showSchool(s) {
        var obj = JSON.parse(s);

        return `${obj.school.name}...`;
    };
}
showSchoolFilterFactory.$inject = [];

export function showTeamMembersFilterFactory() {
    return function(team){
      var output = Object.keys(team);
      
      function filterUserID(id){
        if(id != "currentSize" && id != "maxSize" && id != "$id" && id != "$priority" && id != "$$hashKey"){
          return id;
        }
      }
      return output.filter(filterUserID);
    }
}
