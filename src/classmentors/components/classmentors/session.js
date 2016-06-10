(function(){
	var app = angular.module('session-admin', []);

	app.controller('SessionController', function() {
		this.enrolment = students;
	});

	var students = [
		{
			"name": "Shi Quan",
			"ranking": 6
		},
		{
			"name": "Gideon",
			"ranking": 5
		}
	];
})();