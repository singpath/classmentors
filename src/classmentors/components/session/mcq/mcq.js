/**
 * Created by AMOS on 18/6/16.
 */
(function(){
    var mcq = angular.module('mcq',['firebase']);

    mcq.config(function () {
        var config = {
            apiKey: "AIzaSyCDxuAaiTyPmosBL6QLgR94yoRswMyZcIg",
            authDomain: "project-1180774075744369732.firebaseapp.com",
            databaseURL: "https://project-1180774075744369732.firebaseio.com",
            storageBucket: "project-1180774075744369732.appspot.com"
        };
        firebase.initializeApp(config);
    });

    mcq.controller('FirebaseController', function($scope, $firebaseObject){
        var ref = firebase.database().ref();
        $scope.data = $firebaseObject(ref);
    });

})();