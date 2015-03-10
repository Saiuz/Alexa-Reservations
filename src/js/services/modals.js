/**
 * Service that provides methods for displaying the modal forms for performing CRUD operations on individual
 * Mongoose Models.
 */
define(['./module'], function (services) {
  'use strict';
  services.service('modals', ['$q', '$modal', '$document', function ($q, $modal, $document) {
    // define the Mongoose Models the service knows about and the modal form - also other utility modals
    // templates and controllers.
    var models = ['Reservation', 'Guest', 'Firm', 'Event', 'ItemType', 'Room', 'Resource', 'YesNo', 'Bill'],
        templates = ['./templates/reservationFormModal.html',
                     './templates/guestFormModal.html',
                     './templates/firmFormModal.html',
                     './templates/eventFormModal.html',
                     './templates/itemTypeFormModal.html',
                     './templates/roomFormModal.html',
                     './templates/resourceFormModal.html',
                     './templates/yesNoFormModal.html',
                     './templates/billDisplayModal.html'],
        controllers = ['ReservationFormModalCtrl',
                       'GuestFormModalCtrl',
                       'FirmFormModalCtrl',
                       'EventFormModalCtrl',
                       'ItemTypeFormModalCtrl',
                       'RoomFormModalCtrl',
                       'ResourceFormModalCtrl',
                       'YesNoFormModalCtrl',
                       'BillDisplayModalCtrl'],
        formSize = ['lg', 'lg', 'lg', 'lg', 'lg', 'lg', 'lg', 'sm', 'lg'], // size of modal
        mode = {c: 0, r: 1, u: 2, d: 3}, // CRUD mode object
        modeStr = ['c', 'r', 'u', 'd'];

    // Method returns a simple "Enum" object with properties representing the various db models that have modal forms.
    this.getModelEnum = function () {
      return {
        reservation: 0,
        guest: 1,
        firm: 2,
        event: 3,
        itemType: 4,
        room: 5,
        resource: 6,
        yesNo: 7,
        bill: 8
      }
    };

    // calls the specified modal form in 'create' mode
    // parameters for all CRUD methods:
    //   mModel - the value of the modelEnum property representing the DB model
    //   dataObj - an object that has two properties: 'data' and 'extraData' this object is passed to the modal form.
    //   callback - an optional function to call when the modal form successfully performs its operation. The callback
    //              function has one parameter 'result' which is the result of the modal operation, typically the Model
    //              object of the CRUD operation was performed on. For the delete method, the id of the deleted object
    //              is returned.
    this.create = function (mModel, dataObj, callback ) {
      _executeModal(mModel, mode.c, dataObj, callback);
    };

    // calls the specified modal form in 'read' mode
    this.read = function (mModel, dataObj, callback ) {
      _executeModal(mModel, mode.r, dataObj, callback);
    };

    // calls the specified modal form in 'update' mode
    this.update = function (mModel, dataObj, callback ) {
      _executeModal(mModel, mode.u, dataObj, callback);
    };

    // calls the specified modal form in 'delete' mode
    this.delete = function (mModel, dataObj, callback ) {
      _executeModal(mModel, mode.d, dataObj, callback);
    };

    // For non Mongoose Model modals very specific
    this.yesNoShow = function(message, callback, yesText, noText, level) {
      var bodyRef = angular.element( $document[0].body),
          modeParams = {message: message, yes: yesText, no: noText, level: level},
          mModel = this.getModelEnum().yesNo,
          modalInstance;

      bodyRef.addClass('ovh'); //This is supposed to take care of a scrolling bug in modal, doesn't seem to work.
      modalInstance = $modal.open({
        templateUrl: templates[mModel],
        controller: controllers[mModel],
        size: formSize[mModel],
        resolve: {
          modalParams: function () {
            return modeParams;
          }
        }
      });

      modalInstance.result.then(function(result) {
        bodyRef.removeClass('ovh');
        if (callback) {
          callback(result); // call the user provided callback on successful completion.
        }
      });
    };

    this.billShow = function (reservation_number, room, guest) {
      var bodyRef = angular.element( $document[0].body),
          modeParams = {reservation_number: reservation_number, room: room, guest: guest},
          mModel = this.getModelEnum().bill,
          modalInstance;

      bodyRef.addClass('ovh'); //This is supposed to take care of a scrolling bug in modal.
      modalInstance = $modal.open({
        templateUrl: templates[mModel],
        controller: controllers[mModel],
        size: formSize[mModel],
        resolve: {
          modalParams: function () {
            return modeParams;
          }
        }
      });

      modalInstance.result.then(function(result) {
        bodyRef.removeClass('ovh');
      });
    };

    // launches the modal form
    function _executeModal(mModel, mode, dataObj, callback) {
      var bodyRef = angular.element( $document[0].body),
          modeParams,
          modalInstance,
          data,
          extraData,
          displayMode;

      if (dataObj) { //add mode property and pass to form
        modeParams = dataObj;
        modeParams.mode = modeStr[mode]
      }
      else {
        modeParams = {data: undefined, mode: modeStr[mode]}; //minimum properties
      }

      bodyRef.addClass('ovh'); //This is supposed to take care of a scrolling bug in modal, doesn't seem to work.
      modalInstance = $modal.open({
        templateUrl: templates[mModel],
        controller: controllers[mModel],
        size: formSize[mModel],
        resolve: {
          modalParams: function () {
            return modeParams;
          }
        }
      });

      modalInstance.result.then(function(result) {
        bodyRef.removeClass('ovh');
        if (callback) {
          callback(result); // call the user provided callback on successful completion.
        }
      });
    }

  }]);
});
