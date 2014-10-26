/**
 * Controller for Guest Modal form.
 * todo - only supports save. may want to extend to update and delete???
 */
define(['./module'], function (controllers) {
  'use strict';

  controllers.controller('GuestFormModalCtrl',
      ['$scope',
        '$modalInstance',
        'nameParts',
        'Guest',
        'dbEnums',
        function ($scope, $modalInstance, nameParts, Guest, dbEnums) {
          console.log("guestFormModal controller fired")


          var sal = [{value: 0, name: '***'}];
          var s = dbEnums.getSalutationEnum();
          var ix = 1;
          angular.forEach(s, function (item) {
            sal.push({value: ix, name: item});
            ix++;
          });
          $scope.salutations = sal;
          $scope.selSalutation = sal[0];

          $scope.salutationChanged = function () {
            if ($scope.selSalutation.value === 0) {
              $scope.guest.salutation = '';
            }
            else {
              $scope.guest.salutation = $scope.selSalutation.name;
            }
          };

          $scope.guest = new Guest();
          switch (nameParts.length){
            case 1:
              $scope.guest.last_name = nameParts[0];
              break;
            case 2:
              $scope.guest.first_name = nameParts[0];
              $scope.guest.last_name = nameParts[1];
              break;
            case 3:
              //try to match salutation
              for (var i = 0; i < sal.length; i++) {
                 if (sal[i].name === nameParts[0]) {
                   break;
                 }
              }

              $scope.selSalutation = sal[i];
              $scope.guest.first_name = nameParts[1];
              $scope.guest.last_name = nameParts[2];
              break;
          }

          $scope.save = function() {
            //save guest and return
            $scope.guest.save(function (err){
              if (err) {
                //perform form validation
                console.log('Guest save error: ' + err );
              }
              else {
                console.log('New Guest saved: ' + $scope.guest._id.id)
                $modalInstance.close($scope.guest);
              }
            });
          };

          $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
          };
        }]);
});