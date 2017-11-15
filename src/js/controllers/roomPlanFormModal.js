/**
 * Controller for the RoomPlan Modal form. The RoomPlan Modal form manages CRUD operations for the RoomPlan collection.
 * The RoomPlan collection holds the various accommodation plans.
 * The form utilizes the angular bootstrap ui Modal directive.
 * Data is passed to the controller via the 'modalParams' object injected into the controller. The object must have
 * two parameters:
 *    modalParams.mode - A string value starting with 'C', 'R', 'U', or 'D'. This determines the operational mode
 *                       of the form and is not case sensitive.
 *    modalParams.data - A property that identifies the instance of the RoomPlan collection to work with. This is the
 *                       id of the item in the case of 'R', 'U' or 'D' operations.
 *    modalParams.extraData - An optional object containing RoomPlan data that will be placed in specific properties
 *                            when creating a new instance (mode 'C'). The object property names match the RoomPlan
 *                            properties to pre populate.
 *    modalParams.displayMode - if <= 0 then all the fields are displayed. If >0 then only the name, duration, 
 *                              single_room_price, double_room_price, and requires_kurtax fields are displayed.
 *
 * For 'C', 'U' and 'D' operations, successful completion, after pressing the save button, the form will display a
 * success message then automatically close after a pre-defined delay. The form will return the new or updated
 * instance object. In the case of a delete operation, the _id of the deleted object will be returned.
 *
 * The form is activated, and any returned results are handled by the following code:
 *        let modalInstance = $modal.open({
 *                     templateUrl: './templates/roomPlanFormModal.html',
 *                     controller: 'RoomPlanFormModalCtrl',
 *                     size: size,
 *                     resolve: {
 *                       modalParams: function () {
 *                         return {data: '1', mode: 'Create'};
 *                       }
 *                     }
 *                   });
 *
 *        modalInstance.result.then(function (result) {
 *                     // handle result which is the instance of the RoomPlan collection the modal form worked with.
 *                     // in the case of the delete ('d' mode), the id of the deleted instance is returned.
 *                   });
 *
 */
define(['./module'], function (controllers) {
  'use strict';

  controllers.controller('RoomPlanFormModalCtrl', ['$scope',
    '$modalInstance',
    'modalParams',
    'RoomPlan',
    'AppConstants',
    'configService',
    'modalUtility',
    'dbEnums',
    'convert',
    function ($scope, $modalInstance, modalParams, RoomPlan, AppConstants, configService, utility, dbEnums, convert) {
      console.log("RoomPlanFormModal controller fired");
      const mode = modalParams.mode.substring(0, 1).toLowerCase();
      const qry = {
        '_id': modalParams.data
      };
      const notFound = configService.loctxt.expenseItem + ' "' + modalParams.data + '" ' + configService.loctxt.notFound;
      
      let helpers = new utility.Helpers($scope, $modalInstance);
      $scope.actionMsg = '';
      $scope.saveTxt = configService.loctxt.add;
      $scope.cancelTxt = configService.loctxt.cancel;
      $scope.txt = configService.loctxt;
      $scope.deleteMode = false;
      $scope.confirmed = false;
      $scope.selectedBC = null; // for bill code select box.
      $scope.lookups = [];
      $scope.price = true;
      $scope.itemsSum = 0;
      $scope.ppPrice = 0;
      $scope.ezPrice = 0;
      $scope.singleSurcharge = 0;

      //Since we must manipulate the decimal number fields (convert from de to en numbers), we can't connect to the DB model directly
      $scope.decimals = {
        pp_price: undefined,
        taxable_price: undefined,
        double_price: undefined,
        single_price: undefined
      };

      // Build arrays for the select boxes
      $scope.categories = dbEnums.getReservationTypeEnum();

      // Determine the display mode. The default is to show only the
      $scope.full = (modalParams && modalParams.displayMode <= 0);
      $scope.plan = (modalParams && modalParams.displayMode > 0);
      // Determine CRUD mode of form.
      // For all but 'C' the query can be by id or by the firm_name property which is also unique.
      switch (mode) {
        case 'c':
          $scope.title = configService.loctxt.roomPlan_titleCreate;
          $scope.roomPlan = new RoomPlan();
          _prePopulateItem(modalParams.extraData);
          if ($scope.roomPlan.resTypeFilter.length === 0) {
            $scope.selResType = $scope.categories[0];
            $scope.roomPlan.resTypeFilter = $scope.categories[0];
          } else {
            $scope.selResType = $scope.roomPlan.resTypeFilter[0];
          }
          $scope.edit = true;
          $scope.read = false;
          break;
        case 'r':
          $scope.title = configService.loctxt.roomPlan_titleRead;
          RoomPlan.findOne(qry).then((roomPlan) => {
            if (roomPlan) {
              $scope.roomPlan = roomPlan;
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
          $scope.title = configService.loctxt.roomPlan_titleUpdate;
          RoomPlan.findOne(qry).then((roomPlan) => {
            if (roomPlan) {
              $scope.roomPlan = roomPlan;
              $scope.decimals.pp_price = roomPlan.pp_price;
              $scope.decimals.single_surcharge = roomPlan.single_surcharge;
              $scope.decimals.double_room_price = roomPlan.double_room_price;
              $scope.decimals.single_room_price = roomPlan.single_room_price;
              $scope.selResType = $scope.roomPlan.resTypeFilter[0];
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
          $scope.title = configService.loctxt.roomPlan_titleDelete;
          RoomPlan.findOne(qry).then((roomPlan) => {
            if (roomPlan) {
              $scope.roomPlan = roomPlan;
              $scope.edit = false;
              $scope.read = true;
              $scope.deleteMode = true;
              //$scope.bcText = _matchBillCode(roomPlan.bill_code).text;
              $scope.cancelTxt = configService.loctxt.close;
              $scope.saveTxt = configService.loctxt.delete;
              helpers.dApply();
            } else {
              helpers.showLoadErr(notFound);
            }
          }).catch(err => helpers.showLoadErr(err));
          break;
      }
      //$scope.$apply();
      //});  // end of AppConstants.find;

      // listen to changes in the decimal number fields text variables and match them up with the model's properties
      $scope.$watchCollection('[decimals.pp_price, decimals.single_surcharge, decimals.double_room_price, decimals.single_room_price,roomPlan.duration]', function (newvals) {
        if (newvals[0]) {
          $scope.roomPlan.pp_price = Number(newvals[0]); // string already converted to decimal representation by directive on input.
        }
        if (newvals[1]) {
          $scope.roomPlan.single_surcharge = Number(newvals[1]);
        }
        if (newvals[2]) {
          $scope.roomPlan.double_room_price = Number(newvals[2]);
        }
        if (newvals[3]) {
          $scope.roomPlan.single_room_price = Number(newvals[3]);
        }
        _calculateTotals();
      });

      // Handle change in reservation type select box
      $scope.resTypeChanged = function () {
        if ($scope.selResType) {
          $scope.roomPlan.resTypeFilter = [$scope.selResType];
        }
      };

      // modal button click methods
      // save button handler
      $scope.save = function () {
        //perform any pre save form validation or logic here
        if (!$scope.roomPlan.count) {
          $scope.roomPlan.count = 1;
        }
        let msg = '';
        //save/update ItemType and return
        $scope.roomPlan.save().then(() => {
          msg = (mode === 'c' ? configService.loctxt.expenseItem + configService.loctxt.success_saved :
            configService.loctxt.success_changes_saved);
            helpers.autoClose(msg, $scope.roomPlan);
        }).catch((err) => helpers.showSaveError(err));
      }

      // Delete btn handler
      $scope.delete = function () {
        let id = $scope.roomPlan._id;
        $scope.roomPlan.remove().then(() => {
          let msg = configService.loctxt.expenseItem + configService.loctxt.success_deleted;
          helpers.autoClose(msg, id);
        }).catch((err) => helpers.showSaveError(err));
      };

      //#region - private functions
      /**
       * Updates open reservations with a new name. that contain the old name
       * @param {Guest} guest 
       */
      async function _updateResNames() { //TODO - this does update name but not the title of the reservation for display.
        try {
          let guest = $scope.guest;
          //let nameParts = utility.parseNameString(guest.name);

          await Reservation.update({
            $and: [{
              checked_out: {
                $exists: false
              }
            }, {
              "guest.id": guest._id
            }]
          }, {
            $set: {
              "guest.name": guest.name
            }
          });
          await Reservation.update({
            $and: [{
              checked_out: {
                $exists: false
              }
            }, {
              "guest2.id": guest._id
            }]
          }, {
            $set: {
              "guest2.name": guest.name
            }
          });
        } catch (err) {
          throw err;
        }
      }
      /**
       * Populates the ItemType model's fields from matching fields in the fieldsObj object.
       * @param {*} fieldsObj 
       */
      function _prePopulateItem(fieldsObj) {
        if (fieldsObj) {
          for (let prop in fieldsObj) {
            if (fieldsObj.hasOwnProperty(prop)) {
              $scope.roomPlan[prop] = fieldsObj[prop];
            }
          }
        }
      }
      /**
       * Calculates the plan component totals based on duration
       */
      function _calculateTotals() {
        let p = $scope.roomPlan;
        if (p) {
          let itmSum = 0;
          p.required_items.forEach(function (itm) {
            let iPrice = itm.price_lookup ? configService.constants.get(itm.price_lookup) : itm.price;
            itmSum += iPrice * (itm.day_count ? p.duration : itm.count);
          });
          $scope.ppPrice = convert.roundp(p.double_room_price * p.duration + itmSum, 2);
          $scope.ezPrice = convert.roundp(p.single_room_price * p.duration + itmSum, 2);
          $scope.singleSurcharge = convert.roundp($scope.ezPrice - $scope.ppPrice, 2);
          $scope.itemsSum = itmSum;
        }
      }
      //#endregion
    }
  ]);
});