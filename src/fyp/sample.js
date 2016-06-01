angular.module('sampleApp', []).controller('SampleController', function CalculatorController($scope) {
  $scope.sum = function() {
    $scope.z = $scope.x + $scope.y;
  };
});