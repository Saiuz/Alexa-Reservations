/*
 * Controller for managing package room plans. This page does not edit "system" level plans. Plans can be created,
 * edited and deleted. Required items can be created, added / removed from a plan and edited.
 * When a plan is deleted, it will look to see if the items attached to the plan are used by any other plan. If not,
 * it will be deleted. Likewise, when an item is removed, it will look to see of the item is used elsewhere. If not
 * then it will be deleted.
 */
define(['./module'], function (controllers) {
  'use strict';

  controllers.controller('plansCtrl',
      ['$scope',
        '$state',
        '$rootScope',
        'dbEnums',
        'modals',
        'configService',
        'dashboard',
        'convert',
        function ($scope, $state, $rootScope, dbEnums, modals, configService, dashboard, convert) {
          console.log("Plans controller fired");

          var planItemCache = [], // used to cache required plan expense items for each plan.
              currentBillCode = -1,
              billCodes = {};

          $scope.appTitle = $rootScope.appTitle;
          $scope.appBrand = $rootScope.appBrand;
          $scope.url = $state.current.url;
          $scope.pageHeading = configService.loctxt.packages;
          $scope.txt = configService.loctxt;

          $scope.errShow = false;
          $scope.errMsg = '';
          $scope.working = false;

          $scope.planObjects = []; //holds all room plan models returned from the RoomPlan collection
          $scope.selectedPlanItems = []; // holds all expense items from the selected room plan
          $scope.selectedPlan = null;
          $scope.ptypes = _buildTabs();
          $scope.curType = $scope.ptypes[0].title;
          $scope.showExistingItems = false;

          $scope.planTypeSelected = function (planType) {
            $scope.showExistingItems = false;
            $scope.curType = planType;
            $scope.selectedPlanItems = [];
            $scope.selectedPlan = null;
            currentBillCode = billCodes[planType];
            //_buildPlansInTypeList();
          };

          // filter plans based on reservation type and is_plan flag
          $scope.planFilter = function (p) {
            return p.resTypeFilter.indexOf($scope.curType) !== -1 && p.is_plan;
          };

          $scope.itemTypeFilter = function (itm) {
            return ((itm.is_system && !_itemExistsInList(itm)) || (!_itemExistsInList(itm) && itm.bill_code === currentBillCode))
          };

          // retrieve the expense items associated with a plan.
          $scope.setSelected = function (pname) {
            var plan = _findPlan(pname);
            $scope.selectedPlan = plan;
            if (plan) {
              $scope.showExistingItems = false;
              _calculatePlanPrice(true);
            }
          };

          // ** Crud methods for package plan items **
          // Edit selected item. Find item in selectedPlan's required_items field and bring up edit form
          $scope.editItem = function (iname) {
            var dataObjI = {
                  data: iname,
                  docArray: $scope.selectedPlan.required_items,
                  extraData: null,
                  displayMode: 1
                },
                model = modals.getModelEnum().docArrayItem;

            if ($scope.selectedPlan) {
              modals.update(model, dataObjI, function (result) {
                _calculatePlanPrice(); // update plan price
                 $scope.selectedPlan.save(function (err) {
                  if (err) {
                    console.log(err);
                    $scope.working = false;
                    $scope.errShow = true;
                    $scope.errMsg = err;
                  }
                  else {
                    $scope.showExistingItems = false;
                    $scope.$apply();
                  }
                }); //save plan
              });
            }
          };

          // Displays a list of existing plan type items that can be added to plan.
          $scope.newItemShow = function () {
            _getAllPlanItemTypes();
            $scope.showExistingItems = true;
          };

          // Add an existing expense item to the plan
          $scope.addExistingItem = function (iname) {
            var item = _findItemType(iname);

            if (item && $scope.selectedPlan) {
              //add item to plan's required_items field
              $scope.selectedPlan.required_items.push(item);     //TODO-Need to do something like aadding expenses to the reservation expense list!!!!!!!!
              _calculatePlanPrice(); // update plan price
              $scope.selectedPlan.save(function (err) {
                if (err) {
                  console.log(err);
                  $scope.working = false;
                  $scope.errShow = true;
                  $scope.errMsg = err;
                }
                else {
                  $scope.showExistingItems = false;
                  $scope.$apply();
                }
              }); //save plan
            }
          };

          // Adds a brand new item to the plan
          $scope.addNewItem = function () {
            var dataObjI = {
                  data: undefined,
                  docArray: $scope.selectedPlan.required_items,
                  extraData: dashboard.getPackagePlanItemDefaultObj(currentBillCode),
                  displayMode: 1
                },
                model = modals.getModelEnum().docArrayItem;

            if ($scope.selectedPlan) {
              modals.create(model, dataObjI, function (item) {
                _calculatePlanPrice(); // update plan price
                $scope.selectedPlan.save(function (err) {
                  if (err) {
                    console.log(err);
                    $scope.working = false;
                    $scope.errShow = true;
                    $scope.errMsg = err;
                  }
                  else {
                    $scope.showExistingItems = false;
                    $scope.$apply();
                  }
                }); //save plan
              });
            }
          };

          // Remove an expense item from the plan and optionally delete it.
          $scope.removeItem = function (iname) {
            var dataObjI = {
                  data: iname,
                  docArray: $scope.selectedPlan.required_items,
                  extraData: null,
                  displayMode: 1
                },
                model = modals.getModelEnum().docArrayItem;

            if ($scope.selectedPlan) {
              modals.delete(model, dataObjI, function (result) {
                _calculatePlanPrice(); // update plan price
                $scope.selectedPlan.save(function (err) {
                  if (err) {
                    console.log(err);
                    $scope.working = false;
                    $scope.errShow = true;
                    $scope.errMsg = err;
                  }
                  else {
                    $scope.showExistingItems = false;
                    $scope.$apply();
                  }
                }); //save plan
              });
            }
          };

          // Add a new plan
          $scope.newPlan = function () {
            var dataObjI = {
                  data: undefined,
                  extraData: dashboard.getRoomPlanPackageDefaultObj($scope.curType),
                  displayMode: 1 //package plan fields only
                },
                model = modals.getModelEnum().roomPlan;

            modals.create(model, dataObjI, function (plan) {
              // add new plan to list
              dashboard.getRoomPlanList().then(function (plans) {
                    $scope.planObjects = plans;
                    $scope.selectedPlanItems = []; // the plan will have no items yet
                    $scope.setSelected(plan.name); //select the new plan
                    _calculatePlanPrice(); // update prices
                    plan.save(function (err) {
                      if (err) {
                        console.log(err);
                        $scope.working = false;
                        $scope.errShow = true;
                        $scope.errMsg = err;
                      }
                      else {
                        $scope.showExistingItems = false;
                        $scope.$apply();
                      }
                    }); //save plan
                  },
                  function (err) {
                    console.log(err);
                    $scope.working = false;
                    $scope.errShow = true;
                    $scope.errMsg = err;
                  }); //getRoomPlansList
            }); //create
          };

          // Edit an existing package plan
          $scope.editPlan = function (id) {
            var dataObjI = {
                  data: id,
                  extraData: null,
                  displayMode: 1 //package plan fields only
                },
                model = modals.getModelEnum().roomPlan,
                localPlanIX = _findPlanInList(id);

            modals.update(model, dataObjI, function (plan) {
              // replace old plan with new edits in local list
              $scope.planObjects.splice(localPlanIX, 1, plan);
              $scope.setSelected(plan.name); //incase the name was changed
              _calculatePlanPrice(); // update prices
              plan.save(function (err) {
                if (err) {
                  console.log(err);
                  $scope.working = false;
                  $scope.errShow = true;
                  $scope.errMsg = err;
                }
                else {
                  $scope.showExistingItems = false;
                  $scope.$apply();
                }
              }); //save plan
            });
          };

          // Remove an existing package plan, If a plan has items that are not used by other plans then delete them.
          $scope.removePlan = function (id) {
            var dataObjI = {
                  data: id,
                  extraData: null,
                  displayMode: 1 //package plan fields only
                },
                model = modals.getModelEnum().roomPlan,
                localPlanIX = _findPlanInList(id),
                planItems = $scope.planObjects[localPlanIX];
            modals.delete(model, dataObjI, function () {
              $scope.planObjects.splice(localPlanIX, 1); //remove item from local list
              $scope.selectedPlanItems = [];
              $scope.selectedPlan = null;
              // now process items for removal
            });
          };

          //$scope.tips = function (key) {
          //  return "Ho Bill";
          //};

          _getAllPlans(); //first time kick things off

          // *** Private methods
          //
          // retrieve all accommodation plans
          function _getAllPlans() {
            $scope.working = true;
            dashboard.getRoomPlanList().then(function (plans) {
                  $scope.planObjects = plans;
                  $scope.working = false;
                },
                function (err) {
                  console.log(err);
                  $scope.working = false;
                  $scope.errShow = true;
                  $scope.errMsg = err;
                });
          }

          // retrieve all common existing package plan item types that can be added to a plan
          function _getAllPlanItemTypes() {
            $scope.working = true;
            dashboard.getPackagePlanItemTypes().then(function (items) {
                  $scope.planItemTypes = items;

                  $scope.working = false;
                },
                function (err) {
                  $scope.working = false;
                  $scope.errShow = true;
                  $scope.errMsg = err;
                });
          }

          // find specific plan by name in planObjects array
          function _findPlan(pname) {
            var plan = null;
            $scope.planObjects.forEach(function (p) {
              if (p.name === pname) {
                plan = p;
              }
            });

            return plan;
          }

          // find specific plan by id in planObjects array and returns the index in the array
          function _findPlanInList(id) {
            var pix = -1;
            for (var i = 0; i < $scope.planObjects.length; i++) {
              if ($scope.planObjects[i]._id === id) {
                pix = i;
                break;
              }
            }

            return pix;
          }

          // find specific item in selected plan's item list
          function _findItem(iname) {
            var item = null;
            $scope.selectedPlanItems.forEach(function (itm) {
              if (itm.name === iname) {
                item = itm;
              }
            });

            return item;
          }

          // find specific item in the planItemTypes list
          function _findItemType(iname) {
            var item = null;
            $scope.planItemTypes.forEach(function (itm) {
              if (itm.name === iname) {
                item = itm;
              }
            });

            return item;
          }

          function _itemExistsInList(item) {
            var found = false;
            $scope.selectedPlanItems.forEach(function (itm) {
              if (itm.name === item.name) {
                found = true;
              }
            });
            return found;
          }

          // Build tab list of plans that match plan type selection
          function _buildPlansInTypeList() {
            var plist = [],
                actv = false,
                av = false,
                hasActive = false;

            $scope.planObjects.forEach(function (p) {
              if (p.resTypeFilter.indexOf($scope.curType) !== -1) {
                if (!actv && p.is_plan) {
                  actv = true;
                  av = true;
                  hasActive = true;
                }
                else {
                  av = false;
                }
                plist.push({
                  name: p.name,
                  active: av,
                  disabled: !p.is_plan,
                  id: p._id,
                  filterTypes: p.resTypeFilter
                });
              }
            });
            //if (!hasActive) { // add an extra disabled item at end
            plist.push({
              name: configService.loctxt.newPackage,
              active: !hasActive,
              disabled: false,
              id: 0,
              filterTypes: $scope.curType
            });
            //}
            $scope.plans = plist;
          }

          // Build reservation type tabs. We only allow packages on Std. and Kur reservation types.
          function _buildTabs() {
            var plans = [],
                plantypes = [dbEnums.getReservationTypeEnum()[0], dbEnums.getReservationTypeEnum()[2]];
            billCodes[dbEnums.getReservationTypeEnum()[0]] = configService.constants.bcPackageItem;
            billCodes[dbEnums.getReservationTypeEnum()[2]] = configService.constants.bcKurPackageItem;
            plantypes.forEach(function (p) {
              plans.push({type: p, active: plans.length === 0});
            });

            return plans;
          }

          // Calculate the Plan price and the single surcharge based on items, room prices and duration and then
          // update the selected plan's pp_price and single_surcharge fields if noUpdate is false.
          function _calculatePlanPrice(doNotUpdate) {
            var result = {
                  planPrice: 0,
                  singleSurcharge: 0,
                  dblSum: 0,
                  snglSum: 0,
                  itmSum: 0
                };

            if ($scope.selectedPlan) {
              result.dblSum = $scope.selectedPlan.double_room_price * $scope.selectedPlan.duration;
              result.snglSum = $scope.selectedPlan.single_room_price * $scope.selectedPlan.duration;
              $scope.selectedPlan.required_items.forEach(function (itm) {
                var iprice = itm.price_lookup ? configService.constants.get(itm.price_lookup) : itm.price;
                result.itmSum += iprice * (itm.day_count ? $scope.selectedPlan.duration : itm.count);
              });
              result.planPrice = convert.roundp(result.dblSum + result.itmSum, 2);
              result.singleSurcharge = convert.roundp((result.snglSum + result.itmSum) - result.planPrice, 2);

              if (!doNotUpdate) {
                $scope.selectedPlan.pp_price = result.planPrice;
                $scope.selectedPlan.single_surcharge = result.singleSurcharge;
              }
            }
            console.log(result);
            return result;
          }
        }]);
});
