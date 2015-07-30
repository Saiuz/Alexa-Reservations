/**
 * Service based on https://github.com/DWand/nw-fileDialog
 */
define(['./module'], function (services) {
  'use strict';

  services.service('fileDialogs', [function()  {
    var callDialog = function(dialog, callback) {
      dialog.addEventListener('change', function() {
        var result = dialog.value;
        callback(result);
      }, false);
      dialog.click();
    };

    var dialogs = {};

    dialogs.saveAs = function(callback,  defaultFilename, acceptTypes) {
      var dialog = document.createElement('input');
      dialog.type = 'file';
      dialog.nwsaveas = defaultFilename || '';
      if (angular.isArray(acceptTypes)) {
        dialog.accept = acceptTypes.join(',');
      } else if (angular.isString(acceptTypes)) {
        dialog.accept = acceptTypes;
      }
      callDialog(dialog, callback);
    };

    dialogs.openFile = function(callback, workingDir, multiple, acceptTypes) {
      var dialog = document.createElement('input');
      dialog.type = 'file';
      if (multiple) {
        dialog.multiple = 'multiple';
      }
      if (workingDir) {
        dialog.nwworkingdir = workingDir;
      }
      if (angular.isArray(acceptTypes)) {
        dialog.accept = acceptTypes.join(',');
      } else if (angular.isString(acceptTypes)) {
        dialog.accept = acceptTypes;
      }
      callDialog(dialog, callback);
    };

    dialogs.openDir = function(callback) {
      var dialog = document.createElement('input');
      dialog.type = 'file';
      dialog.nwdirectory = 'nwdirectory';
      callDialog(dialog, callback);
    };

    return dialogs;
  }]);
});