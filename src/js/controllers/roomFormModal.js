/**
 * Controller for the Room Modal form. The Room Modal form manages CRUD operations for the Room collection.
 * The form utilizes the angular bootstrap ui Modal directive.
 * Data is passed to the controller via the 'modalParams' object injected into the controller. The object must have
 * two parameters:
 *    modalParams.mode - A string value starting with 'C', 'R', 'U', or 'D'. This determines the operational mode
 *                       of the form and is not case sensitive.
 *    modalParams.data - A property that identifies the instance of the Room collection to work with. This is the
 *                       id of the item in the case of 'R', 'U' or 'D' operations.
 *    modalParams.extraData - An optional object containing Room data that will be placed in specific properties
 *                            when creating a new instance (mode 'C'). The object property names match the Room
 *                            properties to pre populate.
 *
 * For 'C', 'U' and 'D' operations, successful completion, after pressing the save button, the form will display a
 * success message then automatically close after a pre-defined delay. The form will return the new or updated
 * instance object. In the case of a delete operation, the _id of the deleted object will be returned.
 *
 * The form is activated, and any returned results are handled by the following code:
 *        var modalInstance = $modal.open({
 *                     templateUrl: './templates/roomFormModal.html',
 *                     controller: 'roomFormModalCtrl',
 *                     size: size,
 *                     resolve: {
 *                       modalParams: function () {
 *                         return {data: '', mode: 'Create'};
 *                       }
 *                     }
 *                   });
 *
 *        modalInstance.result.then(function (result) {
 *                     // handle result which is the instance of the Room collection the modal form worked with.
 *                     // in the case of the delete ('d' mode), the id of the deleted instance is returned.
 *                   });
 *
 */
define(['./module'], function (controllers) {
  'use strict';

  controllers.controller('RoomFormModalCtrl', ['$scope',
    '$modalInstance',
    'modalParams',
    'Room',
    'configService',
    'modalUtility',
    'dbEnums',
    function ($scope, $modalInstance, modalParams, Room, configService, utility, dbEnums) {
      console.log("RoomFormModal controller fired");

      let helpers = new utility.Helpers($scope, $modalInstance);
      $scope.actionMsg = '';
      $scope.saveTxt = configService.loctxt.add;
      $scope.cancelTxt = configService.loctxt.cancel;
      $scope.txt = configService.loctxt;
      $scope.deleteMode = false;
      $scope.confirmed = false;

      //Since we must manipulate the decimal number fields (convert from de to en numbers), we can't connect to the DB model directly
      $scope.decimals = {
        price: undefined
      };

      // Build arrays for the select boxes
      $scope.roomTypes = dbEnums.getRoomTypeEnum();
      $scope.roomClasses = dbEnums.getRoomClassEnum();

      // Determine CRUD mode of form.
      // For all but 'C' the query can be by id or by the firm_name property which is also unique.
      var mode = modalParams.mode.substring(0, 1).toLowerCase(),
        qry = {
          '_id': modalParams.data
        },
        notFound = configService.loctxt.room + ' "' + modalParams.data + '" ' + configService.loctxt.notFound;

      switch (mode) {
        case 'c':
          $scope.title = configService.loctxt.room_titleCreate;
          $scope.room = new Room();
          _prePopulateItem(modalParams.extraData);
          $scope.edit = true;
          $scope.read = false;
          break;
        case 'r':
          $scope.title = configService.loctxt.room_titleRead;
          Room.findOne(qry).then((room) => {
            if (room) {
              $scope.room = room;
              $scope.edit = false;
              $scope.read = true;
              $scope.cancelTxt = configService.loctxt.close;
              helpers.dApply();
            } else {
              helpers.showLoadErr(notFound);
            }
          });
          break;
        case 'u':
          $scope.title = configService.loctxt.room_titleUpdate;
          Room.findOne(qry).then((room) => {
            if (room) {
              $scope.room = room;
              $scope.decimals.price = room.price;
              $scope.edit = true;
              $scope.read = false;
              $scope.saveTxt = configService.loctxt.update;
              helpers.dApply();
            } else {
              helpers.showLoadErr(notFound);
            }
          }).catch(err => helpers.showLoadErr(err));
          break;
        case 'd':
          $scope.title = configService.loctxt.room_titleDelete;
          Room.findOne(qry).then((room) => {
            if (room) {
              $scope.room = room;
              $scope.edit = false;
              $scope.read = true;
              $scope.deleteMode = true;
              $scope.cancelTxt = configService.loctxt.close;
              $scope.saveTxt = configService.loctxt.delete;
              helpers.dApply();
            } else {
              helpers.showLoadErr(notFound);
            }
          }).catch(err => helpers.showLoadErr(err));
          break;
      }

      // listen to changes in the decimal number fields text variables and match them up with the model's properties
      $scope.$watch('decimals.price', function (newval) {
        if (newval) {
          $scope.room.price = Number(newval); // string already converted to decimal representation by directive on input.
        }
      });

      // modal button click methods
      // save button handler
      $scope.save = function () {
        //perform any pre save form validation or logic here
        var msg = '';
        //save/update Room and return
        $scope.room.save().then(() => {
          msg = (mode === 'c' ? configService.loctxt.room + configService.loctxt.success_saved :
            configService.loctxt.success_changes_saved);
          helpers.autoClose(msg, $scope.room);
        }).catch(err => helpers.showSaveError(err));
      };

      // Delete btn handler
      $scope.delete = function (err) {
        var id = $scope.room._id;
        $scope.room.remove().then(() => {
          var msg = configService.loctxt.expenseItem + configService.loctxt.success_deleted;
          helpers.autoClose(msg, id);
        }).catch(err => helpers.showSaveError(err));
      };

      //#region - private methods
      //populates the Room model's fields from matching fields in the fieldsObj object.
      function _prePopulateItem(fieldsObj) {
        if (fieldsObj) {
          for (var prop in fieldsObj) {
            if (fieldsObj.hasOwnProperty(prop)) {
              $scope.room[prop] = fieldsObj[prop];
            }
          }
        }
      }
      //#endregion
    }
  ]);
});