/**
 * Controller for the Resource Modal form. The Resource Modal form manages CRUD operations for the Resource collection.
 * The form utilizes the angular bootstrap ui Modal directive.
 * Data is passed to the controller via the 'modalParams' object injected into the controller. The object must have
 * two parameters:
 *    modalParams.mode - A string value starting with 'C', 'R', 'U', or 'D'. This determines the operational mode
 *                       of the form and is not case sensitive.
 *    modalParams.data - A property that identifies the instance of the Resource collection to work with. This is the
 *                       id of the item in the case of 'R', 'U' or 'D' operations.
 *    modalParams.extraData - An optional object containing Resource data that will be placed in specific properties
 *                            when creating a new instance (mode 'C'). The object property names match the Resource
 *                            properties to pre populate.
 *
 * For 'C', 'U' and 'D' operations, successful completion, after pressing the save button, the form will display a
 * success message then automatically close after a pre-defined delay. The form will return the new or updated
 * instance object. In the case of a delete operation, the _id of the deleted object will be returned.
 *
 * The form is activated, and any returned results are handled by the following code:
 *        let modalInstance = $modal.open({
 *                     templateUrl: './templates/resourceFormModal.html',
 *                     controller: 'resourceFormModalCtrl',
 *                     size: size,
 *                     resolve: {
 *                       modalParams: function () {
 *                         return {data: '', mode: 'Create'};
 *                       }
 *                     }
 *                   });
 *
 *        modalInstance.result.then(function (result) {
 *                     // handle result which is the instance of the Resource collection the modal form worked with.
 *                     // in the case of the delete ('d' mode), the id of the deleted instance is returned.
 *                   });
 *
 */
define(['./module'], function (controllers) {
  'use strict';

  controllers.controller('ResourceFormModalCtrl', ['$scope',
    '$modalInstance',
    'modalParams',
    'Resource',
    'configService',
    'modalUtility',
    'dbEnums',
    function ($scope, $modalInstance, modalParams, Resource, configService, utility, dbEnums) {
      console.log("ResourceFormModal controller fired");

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
      $scope.resourceTypes = dbEnums.getResourceTypeEnum();

      // Determine CRUD mode of form.
      // For all but 'C' the query can be by id or by the firm_name property which is also unique.
      const mode = modalParams.mode.substring(0, 1).toLowerCase();
      const qry = {
        '_id': modalParams.data
      };
      const notFound = configService.loctxt.resource + ' "' + modalParams.data + '" ' + configService.loctxt.notFound;

      switch (mode) {
        case 'c':
          $scope.title = configService.loctxt.resource_titleCreate;
          $scope.resource = new Resource();
          if ($scope.resourceTypes.length === 1) {
            $scope.resource.resource_type = $scope.resourceTypes[0]; //default to first type, we will not make this field editable
          }
          _prePopulateItem(modalParams.extraData);
          $scope.edit = true;
          $scope.read = false;
          break;
        case 'r':
          $scope.title = configService.loctxt.resource_titleRead;
          Resource.findOne(qry).then((resource) => {
            if (resource) {
              $scope.resource = resource;
              $scope.edit = false;
              $scope.read = true;
              $scope.cancelTxt = configService.loctxt.close;
              helpers.dApply();
            } else {
              helpers.showLoadErr(notFound);
            }
          }).catch(err => helpers.showLoadErr(err));
          break;
        case 'u':
          $scope.title = configService.loctxt.resource_titleUpdate;
          Resource.findOne(qry).then((resource) => {
            if (resource) {
              $scope.resource = resource;
              $scope.decimals.price = resource.price;
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
          $scope.title = configService.loctxt.resource_titleDelete;
          Resource.findOne(qry).then((resource) => {
            if (resource) {
              $scope.resource = resource;
              $scope.edit = false;
              $scope.read = true;
              $scope.deleteMode = true;
              $scope.cancelTxt = configService.loctxt.close;
              $scope.saveTxt = configService.loctxt.delete;
            } else {
              helpers.showLoadErr(notFound);
            }
          }).catch(err => helpers.showLoadErr(err));
          break;
      }

      // listen to changes in the decimal number fields text variables and match them up with the model's properties
      $scope.$watch('decimals.price', function (newval) {
        if (newval) {
          $scope.resource.price = Number(newval); // string already converted to decimal representation by directive on input.
        }
      });

      // modal button click methods
      // save button handler
      $scope.save = function () {
        //perform any pre save form validation or logic here
        let msg = '';
        //save/update Resource and return
        $scope.resource.save().then(() => {
          msg = (mode === 'c' ? configService.loctxt.resource + configService.loctxt.success_saved :
            configService.loctxt.success_changes_saved);
          helpers.autoClose(msg, $scope.resource);
        }).catch((err) => helpers.showSaveError(err));
      };

      // Delete btn handler
      $scope.delete = function (err) {
        let id = $scope.resource._id;
        $scope.err = false;
        $scope.errSave = false;
        $scope.resource.remove().then(() => {
          let msg = configService.loctxt.expenseItem + configService.loctxt.success_deleted;
          helpers.autoClose(msg, id);
        }).catch(err => helpers.showSaveError(err));
      };

      //# region - private functions
      /**
       * populates the Resource model's fields from matching fields in the fieldsObj object.
       * @param {*} fieldsObj 
       */
      function _prePopulateItem(fieldsObj) {
        if (fieldsObj) {
          for (let prop in fieldsObj) {
            if (fieldsObj.hasOwnProperty(prop)) {
              $scope.resource[prop] = fieldsObj[prop];
            }
          }
        }
      }
    }
  ]);
});