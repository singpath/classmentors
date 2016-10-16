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

export function countConditionallyFilterFactory() {
    return function countConditionally(objArr, inputs) {
        var field = inputs[0];
        var bool = inputs[1];
        var count = 0;

        for(var index in objArr) {
            let obj = objArr[index];
            if(obj[field] && obj.hasOwnProperty('createdAt')) {
                if(bool) {
                    count++;
                }
            }
            if(!obj[field] && obj.hasOwnProperty('createdAt')) {
                if(!bool) {
                    count++;
                }
            }
        }

        return `${count}`;
    };
}
countConditionallyFilterFactory.$inject = [];

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

export function countObjKeysFactory() {
    return function countObjKeys(obj) {
        if(obj) {
            return `${Object.keys(obj).length}`;
        }
        return 0;
    }
}

countObjKeysFactory.$inject = [];

// export function reverseArray (){
//   return function(items) {
//     return items.slice().reverse();
//   };
// };
