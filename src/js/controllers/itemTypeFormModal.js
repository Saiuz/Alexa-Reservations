/**
 * Controller for the ItemType Modal form. The ItemType Modal form manages CRUD operations for the ItemType collection.
 * The form utilizes the angular bootstrap ui Modal directive.
 * Data is passed to the controller via the 'modalParams' object injected into the controller. The object must have
 * two parameters:
 *    modalParams.mode - A string value starting with 'C', 'R', 'U', or 'D'. This determines the operational mode
 *                       of the form and is not case sensitive.
 *    modalParams.data - A property that identifies the instance of the ItemType collection to work with. This is the
 *                       id of the item in the case of 'R', 'U' or 'D' operations.
 *    modalParams.extraData - An optional object containing ItemType data that will be placed in specific properties
 *                            when creating a new instance (mode 'C'). The object property names match the ItemType
 *                            properties to pre populate.
 *    modalParams.displayMode - if < 0 then all the fields are displayed. If 0 then only the Name, price and
 *                              low tax rate fields are displayed. If > 0 then only the fields required for a
 *                              package plan item are shown (Name, Display String, Price Lookup, Price, Count, low
 *                              tax rate, day count
 *
 * For 'C', 'U' and 'D' operations, successful completion, after pressing the save button, the form will display a
 * success message then automatically close after a pre-defined delay. The form will return the new or updated
 * instance object. In the case of a delete operation, the _id of the deleted object will be returned.
 *
 * The form is activated, and any returned results are handled by the following code:
 *        var modalInstance = $modal.open({
 *                     templateUrl: './templates/itemTypeFormModal.html',
 *                     controller: 'itemTypeFormModalCtrl',
 *                     size: size,
 *                     resolve: {
 *                       modalParams: function () {
 *                         return {data: '1', mode: 'Create'};
 *                       }
 *                     }
 *                   });
 *
 *        modalInstance.result.then(function (result) {
 *                     // handle result which is the instance of the ItemType collection the modal form worked with.
 *                     // in the case of the delete ('d' mode), the id of the deleted instance is returned.
 *                   });
 *
 */
define(['./module'], function (controllers) {
  'use strict';

  controllers.controller('ItemTypeFormModalCtrl',
      ['$scope',
        '$modalInstance',
        'modalParams',
        'Itemtype',
        'AppConstants',
        'configService',
        '$timeout',
        'utility',
        'dbEnums',
        function ($scope, $modalInstance, modalParams, ItemType, AppConstants, configService, $timeout, utility, dbEnums) {
          console.log("ItemTypeFormModal controller fired");
          var mode;

          $scope.err = {};
          $scope.errSave = false;
          $scope.errLoad = false;
          $scope.hide = false;
          $scope.actionMsg = '';
          $scope.saveTxt = configService.loctxt.add;
          $scope.cancelTxt = configService.loctxt.cancel;
          $scope.txt = configService.loctxt;
          $scope.deleteMode = false;
          $scope.confirmed = false;
          $scope.selectedBC = null; // for bill code select box.
          $scope.lookups = [];
          $scope.price = true;

          //Since we must manipulate the decimal number fields (convert from de to en numbers), we can't connect to the DB model directly
          $scope.decimals = {
            price: undefined,
            taxable_price: undefined,
            double_price: undefined,
            single_price: undefined
          };

          // Build arrays for the select boxes
          $scope.categories = dbEnums.getItemTypeEnum();
          $scope.billCodes = _getBillCodes();
          AppConstants.find(function (err, constants) {
            if (err) {
              $scope.err = new utility.errObj(err);
              $scope.errLoad = true;
            }
            else {
              var consts = [{value: '', text: '****'}];
              constants.forEach(function (c) {
                consts.push({value: c.name, text: c.display_name});
              });
              $scope.lookups = consts;
              $scope.selLookup = consts[0];
            }

            // Determine the display mode. The default is to show only the
            $scope.full = (modalParams && modalParams.displayMode < 0);
            $scope.plan = (modalParams && modalParams.displayMode > 0);
            // Determine CRUD mode of form.
            // For all but 'C' the query can be by id or by the name property which is also unique.
            var qry = {'_id': parseInt(modalParams.data)},
                notFound = configService.loctxt.expenseItem + ' "' + modalParams.data + '" ' + configService.loctxt.notFound;

            mode = modalParams.mode.substring(0, 1).toLowerCase();
            switch (mode) {
              case 'c':
                $scope.title = configService.loctxt.expenseItem_titleCreate;
                $scope.itemType = new ItemType();
                _prePopulateItem(modalParams.extraData);
                _matchLookup();
                $scope.itemType.date_added = new Date();
                $scope.selectedBC = _matchBillCode($scope.itemType.bill_code);
                $scope.edit = true;
                $scope.read = false;
                break;
              case 'r':
                $scope.title = configService.loctxt.expenseItem_titleRead;
                ItemType.findOne(qry, function (err, itemType) {
                  if (err) {
                    $scope.err = new utility.errObj(err);
                    $scope.errLoad = true;
                  }
                  else {
                    if (itemType) {
                      $scope.itemType = itemType;
                      $scope.edit = false;
                      $scope.read = true;
                      $scope.bcText = _matchBillCode(itemType.bill_code).text;
                      _matchLookup();
                      $scope.cancelTxt = configService.loctxt.close;
                    }
                    else {
                      $scope.err = new utility.errObj(notFound);
                      $scope.errLoad = true;
                    }
                    $scope.$apply();
                  }
                });
                break;
              case 'u':
                $scope.title = configService.loctxt.expenseItem_titleUpdate;
                ItemType.findOne(qry, function (err, itemType) {
                  if (err) {
                    $scope.err = new utility.errObj(err);
                    $scope.errLoad = true;
                  }
                  else {
                    if (itemType) {
                      $scope.itemType = itemType;
                      $scope.decimals.price = itemType.price;
                      $scope.decimals.taxable_price = itemType.taxable_price;
                      $scope.decimals.double_price = itemType.double_price;
                      $scope.decimals.single_price = itemType.single_price;
                      $scope.selectedBC = _matchBillCode(itemType.bill_code);
                      _matchLookup();
                      $scope.edit = true;
                      $scope.read = false;
                      $scope.saveTxt = configService.loctxt.update;
                    }
                    else {
                      $scope.err = new utility.errObj(notFound);
                      $scope.errLoad = true;
                    }
                    $scope.$apply();
                  }
                });
                break;
              case 'd':
                $scope.title = configService.loctxt.expenseItem_titleDelete;
                ItemType.findOne(qry, function (err, itemType) {
                  if (err) {
                    $scope.err = new utility.errObj(err);
                    $scope.errLoad = true;
                  }
                  else {
                    if (itemType) {
                      $scope.itemType = itemType;
                      $scope.edit = false;
                      $scope.read = true;
                      $scope.deleteMode = true;
                      $scope.bcText = _matchBillCode(itemType.bill_code).text;
                      $scope.cancelTxt = configService.loctxt.close;
                      $scope.saveTxt = configService.loctxt.delete;
                    }
                    else {
                      $scope.err = new utility.errObj(notFound);
                      $scope.errLoad = true;
                    }
                    $scope.$apply();
                  }
                });
                break;
            }
            $scope.$apply();
          });  // end of AppConstants.find;

          // listen to changes in the decimal number fields text variables and match them up with the model's properties
          $scope.$watchCollection('[decimals.price, decimals.taxable_price, decimals.double_price, decimals.single_price]', function (newvals) {
            if (newvals[0]) {
              $scope.itemType.price = Number(newvals[0]); // string already converted to decimal representation by directive on input.
            }
            if (newvals[1]) {
              $scope.itemType.taxable_price = Number(newvals[1]);
            }
            if (newvals[2]) {
              $scope.itemType.double_price = Number(newvals[2]);
            }
            if (newvals[3]) {
              $scope.itemType.single_price = Number(newvals[3]);
            }
          });

          // Handle change in price lookup select box
          $scope.lookupChanged = function () {
            if ($scope.selLookup) {
              $scope.itemType.price_lookup = $scope.selLookup.value;
              if ($scope.selLookup.value) {
                $scope.decimals.price = 0;
              }
              $scope.price = !$scope.selLookup.value;
            }
          };

          // Handle change in bill code select box
          $scope.bcChanged = function () {
            if ($scope.selectedBC) {
              $scope.itemType.bill_code = parseInt($scope.selectedBC.value);
            }
          };

          // modal button click methods
          // save button handler
          $scope.save = function () {
            var msg = '';

            //perform any pre save form validation or logic here
            $scope.itemType.last_updated = new Date();

            if (!$scope.itemType.count) {
              $scope.itemType.count = 1;
            }
            $scope.err = false;
            $scope.errSave = false;
            //save/update ItemType and return
            $scope.itemType.save(function (err) {
              if (err) {
                console.log('ItemType save error: ' + err);
                $scope.err = new utility.errObj(err);
                $scope.errSave = true;
                $scope.$apply();
              }
              else {
                msg = (mode === 'c' ? configService.loctxt.expenseItem + configService.loctxt.success_saved :
                    configService.loctxt.success_changes_saved);
                _autoClose(msg, $scope.itemType);
              }
            });
          };

          // Delete btn handler
          $scope.delete = function (err) {
            var id = $scope.itemType._id.id;
            $scope.err = false;
            $scope.errSave = false;
            $scope.itemType.remove(function (err) {
              if (err) {
                console.log('ItemType delete error: ' + err);
                $scope.err = new utility.errObj(err);
                $scope.errSave = true;
                $scope.$apply();
              }
              else {
                var msg = configService.loctxt.expenseItem + configService.loctxt.success_deleted;
                _autoClose(msg, id);
              }
            });
          };

          // Cancel btn handler
          $scope.cancel = function () {
            if (timer) {
              $timeout.cancel(timer);
            }
            $modalInstance.dismiss('cancel');
          };

          // Error msg close handler for save/delete error only
          $scope.hideErr = function () {
            $scope.errSave = false;
          };

          // auto close after successful action methods
          var timer = null; // used for timer to auto close modal after a delay when a C, U or D operation occurs
          function _autoClose(msg, val) {
            $scope.hide = true;
            $scope.actionMsg = msg;
            $scope.$apply();
            timer = $timeout(function () {
              $modalInstance.close(val);
            }, configService.constants.autoCloseTime)
          }

          //populates the ItemType model's fields from matching fields in the fieldsObj object.
          function _prePopulateItem(fieldsObj) {
            if (fieldsObj) {
              for (var prop in fieldsObj) {
                if (fieldsObj.hasOwnProperty(prop)) {
                  $scope.itemType[prop] = fieldsObj[prop];
                }
              }
            }
          }

          function _matchLookup() {
            var mlookup = $scope.lookups[0];
            $scope.lookups.forEach(function (lu) {
              if (lu.value === $scope.itemType.price_lookup) {
                mlookup = lu;
              }
            });
            $scope.selLookup = mlookup;
            $scope.price = !mlookup.value;
          }

          function _matchBillCode(val) {
            var bc = {};
            $scope.billCodes.forEach(function (c) {
              if (c.value === val) {
                bc = c;
              }
            });
            return bc;
          }

          function _getBillCodes() {
            var codes = [],
                codeObj;
            for (var prop in configService.constants) {
              if (configService.constants.hasOwnProperty(prop) && /^bc/.test(prop)) {
                codeObj = {
                  value: configService.constants[prop],
                  text: prop
                };
                codes.push(codeObj);
              }
            }

            return codes;
          }
        }]);
});
