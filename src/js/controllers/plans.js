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
          $scope.selectedPlan = '';
          $scope.ptypes = _buildTabs();
          $scope.curType = $scope.ptypes[0].title;
          $scope.showExistingItems = false;

          $scope.planTypeSelected = function (planType) {
            $scope.showExistingItems = false;
            $scope.curType = planType;
            $scope.selectedPlanItems = [];
            $scope.selectedPlan = '';
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
            $scope.selectedPlan = pname;
            console.log(pname);
            var plan = _findPlan(pname);
            if (plan) {
              dashboard.getItemTypesInList(plan.required_items).then(function (items) {
                $scope.selectedPlanItems = items;  // may be empty
                $scope.showExistingItems = false;
                _calculatePlanPrice();
              }, function (err) {
                console.log(err);
                $scope.working = false;
                $scope.errShow = true;
                $scope.errMsg = err;
              });
            }
          };

          // ** Crud methods for package plan items **
          // Edit selected item
          $scope.editItem = function (iname) {
            var item = _findItem(iname),
                plan = _findPlan($scope.selectedPlan),
                dataObjI = {data: undefined, extraData: undefined, displayMode: 1},
                model = modals.getModelEnum().itemType;

            if (item && plan) {
              dataObjI.data = item._id.id;
              modals.update(model, dataObjI, function (result) {
                dashboard.getItemTypesInList(plan.required_items).then(function (items) {
                  $scope.selectedPlanItems = items;
                  _calculateUpdatePlanPrice(); // update plan price
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
                }, function (err) {
                  console.log(err);
                  $scope.working = false;
                  $scope.errShow = true;
                  $scope.errMsg = err;
                }); //getItemTypesInList
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
            var item = _findItemType(iname),
                plan = _findPlan($scope.selectedPlan);
            if (item && plan) {
              //add item to plan's required_items field
              plan.required_items.push(item.name);
              dashboard.getItemTypesInList(plan.required_items).then(function (items) {
                $scope.selectedPlanItems = items;
                _calculateUpdatePlanPrice(); // update plan price
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
              }, function (err) {
                console.log(err);
                $scope.working = false;
                $scope.errShow = true;
                $scope.errMsg = err;
              }); //getItemTypesInList
            }
          };

          // Adds a brand new item to the plan
          $scope.addNewItem = function () {
            var plan = _findPlan($scope.selectedPlan),
                dataObjI = {
                  data: undefined,
                  extraData: dashboard.getPackagePlanItemDefaultObj(currentBillCode),
                  displayMode: 1
                },
                model = modals.getModelEnum().itemType;

            if (plan) {
              modals.create(model, dataObjI, function (item) {
                plan.required_items.push(item.name);
                dashboard.getItemTypesInList(plan.required_items).then(function (items) {
                  $scope.selectedPlanItems = items;
                  _calculateUpdatePlanPrice(); // update plan price
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
                }, function (err) {
                  console.log(err);
                  $scope.working = false;
                  $scope.errShow = true;
                  $scope.errMsg = err;
                }); //getItemTypesInList
              });
            }
          };

          // Remove an expense item from the plan and optionally delete it.
          $scope.removeItem = function (iname) {
            var item = _findItem(iname),
                plan = _findPlan($scope.selectedPlan),
                deleteItem = false,
                saveError = false,
                ix;
            if (item && plan) {
              dashboard.getPlansUsingItem(iname).then(function (plans) {
                deleteItem = plans.length === 1 && !item.is_system; // delete if not system item and it is only attached to 1 plan (the selected plan)
                // Now remove the item from the selected plan. Find the item in the plan array first, remove it then save.
                for (ix = 0; ix < plan.required_items.length; ix++) {
                  if (plan.required_items[ix] === iname) {
                    break;
                  }
                }
                if (ix < plan.required_items.length) {
                  plan.required_items.splice(ix, 1);
                  // Now update selected plan item list before continuing
                  dashboard.getItemTypesInList(plan.required_items).then(function (items) {
                    $scope.selectedPlanItems = items;
                    _calculateUpdatePlanPrice(); // update plan price
                    plan.save(function (err) {
                      if (err) {
                        console.log(err); //todo-handle error better
                        $scope.working = false;
                        $scope.errShow = true;
                        $scope.errMsg = err;
                        saveError = true;
                      }
                      else {
                        $scope.showExistingItems = false;
                        // Now remove item if needed
                        if (deleteItem && !saveError) {
                          item.remove(function (err) {
                            if (err) {
                              console.log(err);
                              $scope.working = false;
                              $scope.errShow = true;
                              $scope.errMsg = err;
                            }
                          }); //remove item
                        }
                      }
                    }); //save plan
                  }, function (err) {
                    console.log(err);
                    $scope.working = false;
                    $scope.errShow = true;
                    $scope.errMsg = err;
                  });
                }
              }); //get plans using item
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
                    _calculateUpdatePlanPrice(); // update prices
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
              $scope.planObjects.splice(localPlanIX,1,plan);
              $scope.setSelected(plan.name); //incase the name was changed
              _calculateUpdatePlanPrice(); // update prices
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
              $scope.planObjects.splice(localPlanIX,1); //remove item from local list
              $scope.selectedPlanItems = [];
              $scope.selectedPlan = '';
              // now process items for removal
            });
          };

          $scope.tips = function (key) {
            return "Ho Bill";
          };
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

          //refreshesh selected plan item list
          function _refresh() {
            $scope.setSelected($scope.selectedPlan);
          }

          // retrieve all existing package plan item types
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
              if ($scope.planObjects[i]._id.id === id) {
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
                  id: p._id.id,
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

          // Calculate the Plan price and the single surcharge based on items, room prices and duration
          function _calculatePlanPrice() {
            var plan = _findPlan($scope.selectedPlan),
                result = {
                  plan: plan,
                  planPrice: 0,
                  singleSurcharge: 0,
                  dblSum: plan.double_room_price * plan.duration,
                  snglSum: plan.single_room_price * plan.duration,
                  itmSum: 0
                };

            $scope.selectedPlanItems.forEach(function (itm) {
              var iprice = itm.price_lookup ? configService.constants.get(itm.price_lookup) : itm.price;
              result.itmSum += iprice * (itm.day_count ? plan.duration : itm.count);
            });
            result.planPrice = convert.roundp(result.dblSum + result.itmSum, 2);
            result.singleSurcharge = convert.roundp((result.snglSum + result.itmSum) - result.planPrice, 2);
            console.log(result);
            return result;
          }

          // Calculates the plan price and single surcharge and then updates the Plan model to reflect the change but
          // does not save the plan object
          function _calculateUpdatePlanPrice() {
            var calcs = _calculatePlanPrice();

            if (calcs.plan) {
              calcs.plan.pp_price = calcs.planPrice;
              calcs.plan.single_surcharge = calcs.singleSurcharge;
            }
          }

          // Calculates the plan price and single surcharge and then updates the Plan model to reflect the change and saves it.
          function _calculateUpdatePlanPriceSave(callback) {
            var calcs = _calculatePlanPrice(),
                lastprice, lastsprice;

            if (calcs.plan) {
              lastprice = calcs.plan.pp_price;
              lastsprice = calcs.plan.single_surcharge;
              calcs.plan.pp_price = calcs.planPrice;
              calcs.plan.single_surcharge = calcs.singleSurcharge;
              calcs.plan.save(function (err) {
                if (err) {
                  calcs.plan.pp_price = lastprice;
                  calcs.plan.single_surcharge = lastsprice;
                  console.log(err); //todo-handle error better
                  $scope.working = false;
                  $scope.errShow = true;
                  $scope.errMsg = err;
                }
                else if (callback) {
                  callback();
                }
              });
            }
          }
        }]);
});
