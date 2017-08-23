/**
 * Controller for the Event Modal form. The Event Modal form manages CRUD operations for the Event collection.
 * The form utilizes the angular bootstrap ui Modal directive.
 * Data is passed to the controller via the 'modalParams' object injected into the controller. The object must have
 * two parameters:
 *    modalParams.mode - A string value starting with 'C', 'R', 'U', or 'D'. This determines the operational mode
 *                       of the form and is not case sensitive.
 *    modalParams.data - An event id that identifies the instance from the Event collection to work with.
 *    modeParams.extraData - optional data object used for create mode, the expected properties are used to pre-populate
 *                           the form. The properties are:
 *                              title: - the event title,
 *                              start: - the event start date,
 *                              end: - the event end date
 *
 * For 'C', 'U' and 'D' operations, successful completion, after pressing the save button, the form will display a
 * success message then automatically close after a pre-defined delay. The form will return the new or updated
 * instance object. In the case of a delete operation, the _id of the deleted object will be returned.
 *
 * The form is activated, and any returned results are handled by the following code:
 *        var modalInstance = $modal.open({
 *                     templateUrl: './templates/eventFormModal.html',
 *                     controller: 'EventFormModalCtrl',
 *                     size: size,
 *                     resolve: {
 *                       modalParams: function () {
 *                         return {data: 123, mode: 'Create', extraData: {};
 *                       }
 *                     }
 *                   });
 *
 *        modalInstance.result.then(function (result) {
 *                     // handle result which is the instance of the Event collection the modal form worked with.
 *                     // in the case of the delete ('d' mode), the id of the deleted instance is returned.
 *                   });
 *
 */
define(['./module'], function (controllers) {
  'use strict';

  controllers.controller('EventFormModalCtrl',
      ['$scope',
        '$rootScope',
        '$modalInstance',
        'modalParams',
        'Event',
        'configService',
        '$timeout',
        'utility',
        'datetime',
        function ($scope, $rootScope, $modalInstance, modalParams, Event, configService, $timeout, utility, datetime) {
          console.log("EventFormModal controller fired");

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

          // Determine CRUD mode of form.
          // For all but 'C' the query can be by id or by the event_name property which is also unique.
          var mode = modalParams.mode.substring(0, 1).toLowerCase(),
              id = modalParams.data,
              extraData = modalParams.extraData,
              executeWatch = false,
              ignoreIndex = -1,
              notFound = configService.loctxt.event + ' "' + modalParams.data + '" ' + configService.loctxt.notFound;

          switch (mode) {
            case 'c':
              $scope.title = configService.loctxt.event_titleCreate;
              $scope.event = new Event();
              if (extraData) {
                $scope.event.title = extraData.title;
                $scope.event.start_date = extraData.start ? datetime.dateOnly(new Date(extraData.start)) : datetime.dateOnly(new Date());
                $scope.event.end_date =  extraData.end ? datetime.dateOnly(new Date(extraData.end)) : $scope.event.start_date;
              }
              else {
                $scope.event.start_date = datetime.dateOnly(new Date());
                $scope.event.end_date = $scope.event.start_date;
              }

              $scope.start_date = new Date($scope.event.start_date);
              $scope.end_date = new Date($scope.event.end_date);
              executeWatch = true;
              $scope.edit = true;
              $scope.read = false;
              break;
            case 'r':
              $scope.title = configService.loctxt.event_titleRead;
              Event.findById(id, function (err, event) {
                if (err) {
                  $scope.err = new utility.errObj(err);
                  $scope.errLoad = true;
                }
                else {
                  if (event) {
                    $scope.event = event;
                    $scope.edit = false;
                    $scope.read = true;
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
              $scope.title = configService.loctxt.event_titleUpdate;
              Event.findById(id, function (err, event) {
                if (err) {
                  $scope.err = new utility.errObj(err);
                  $scope.errLoad = true;
                }
                else {
                  if (event) {
                    $scope.event = event;
                    $scope.start_date = new Date($scope.event.start_date);
                    $scope.end_date = new Date($scope.event.end_date);
                    $scope.edit = true;
                    $scope.read = false;
                    $scope.saveTxt = configService.loctxt.update;
                    executeWatch = true;
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
              $scope.title = configService.loctxt.event_titleDelete;
              Event.findById(id, function (err, event) {
                if (err) {
                  $scope.err = new utility.errObj(err);
                  $scope.errLoad = true;
                }
                else {
                  if (event) {
                    $scope.event = event;
                    $scope.edit = false;
                    $scope.read = true;
                    $scope.deleteMode = true;
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

          //watch for changes in dates.
          $scope.$watchCollection('[start_date, end_date]', function (newvars, oldvars) {
            var varIndex = (oldvars[1] !== newvars[1]) ? 1 :
                (oldvars[0] !== newvars[0]) ? 0 : -1,
                duration;

             if (executeWatch) {
               if (varIndex === -1 || varIndex === ignoreIndex) {
                 ignoreIndex = -1;
                 return;
               }

               switch (varIndex) {
                 case 0:
                   duration = $scope.event.duration;
                   ignoreIndex = 1; //end_date
                   $scope.event.start_date = $scope.start_date;
                   $scope.event.end_date = datetime.dateOnly($scope.start_date, duration);
                   break;

                 case 1:
                   ignoreIndex = -1;
                   $scope.event.end_date = $scope.end_date;
                   break;
               }
             }
          });

          // for date pickers
          $scope.openStart = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.openedStart = true;
            //$scope.openEnd = false;
          };
          $scope.openEnd = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.openedEnd = true;
            //$scope.openStart=false;
          };
          $scope.dateOptions = {
            formatYear: 'yy',
            startingDay: 1,
            showWeeks: false,
            currentText: configService.loctxt.today,
            closeText: configService.loctxt.ok
          };
          $scope.dateFormat = "dd.MM.yyyy";

          // auto close after successful action methods
          var timer = null; // used for timer to auto close modal after a delay when a C, U or D operation occurs
          var autoClose = function (msg, val) {
            $scope.hide = true;
            $scope.actionMsg = msg;
            $scope.$apply();
            timer = $timeout(function () {
              $modalInstance.close(val);
            }, configService.constants.autoCloseTime)
          };

          // modal button click methods
          // save button handler
          $scope.save = function () {
            //perform any pre save form validation or logic here

            //save/update event and return
            $scope.event.save(function (err) {
              if (err) {
                console.log('Event save error: ' + err);
                $scope.err = new utility.errObj(err);
                $scope.errSave = true;
                $scope.$apply();
              }
              else {
                var msg = (mode === 'c' ? configService.loctxt.event + configService.loctxt.success_saved :
                    configService.loctxt.success_changes_saved);
                $rootScope.$broadcast(configService.constants.calEventChangedEvent, {data: $scope.event._id, sDate: $scope.event.start_date});
                autoClose(msg, $scope.event);
              }
            });
          };

          // Delete btn handler
          $scope.delete = function (err) {
            var id = $scope.event._id;
            $scope.event.remove(function (err) {
              if (err) {
                console.log('Event delete error: ' + err);
                $scope.err = new utility.errObj(err);
                $scope.errSave = true;
                $scope.$apply();
              }
              else {
                var msg = configService.loctxt.event + configService.loctxt.success_deleted;
                $rootScope.$broadcast(configService.constants.calEventChangedEvent, {data: id});
                autoClose(msg, id);
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
        }]);
});
