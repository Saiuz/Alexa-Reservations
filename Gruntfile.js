var nwVer =  '0.24.3'; //'0.15.4'; //'0.12.3';

var isWin32 = /^win/.test(process.platform) || nwVer === '0.10.5';
var isWin64 = (/^win/.test(process.platform) && nwVer !== '0.10.5') && /^x64/.test(process.arch);
var isMac32 = /^darwin/.test(process.platform) && /^ia32/.test(process.arch);
var isMac64 = /^darwin/.test(process.platform) && /^x64/.test(process.arch);
var isLinux32 = /^linux/.test(process.platform);
var isLinux64 = /^linux64/.test(process.platform);

var os = "unknown";

if (isWin32)
  os = "win32";
if (isWin64)
  os = "win64";
if (isMac32)
    os = "osx32";
if (isMac64)
    os = "osx64";
if (isLinux32)
    os = "linux32";
if (isLinux64)
    os = "linux64";

var appDir = "~//Alexa-Reservations";  //hard wired todo - figure out how to get this programmatically for mac

var nwExec = "";

if (!isMac32 && !isMac64)
    nwExec = "cd cache/" + nwVer + "/" + os + " && nw ../../../src";
else
    nwExec = appDir + "/cache/" + nwVer + "/" + os + "/nwjs.app/Contents/MacOS/nwjs " + appDir + "/src";


console.log("OS: " + os);
console.log("nwExec: " + nwExec);

module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('./package.json'),
        less: {
            './src/css/app.css': ['./src/css/app.less']
        },
        nwjs: {
            options: {
                version: nwVer,
                build_dir: './releases',
                //platforms: ['osx', 'win'],
                osx64: isMac64,
                win32: isWin32,
                win64: isWin64,
                //linux32: isLinux32,
                //linux64: isLinux64,
                keep_nw: false,
                zip: false,
                mac_icns:'./src/images/AlexaLogo2014.icns'
            },
            src: ['./src/**/*']
        },
        clean: ["./releases/**/*"],
        shell: {
            innobuild32: {
                command: function () {
                    return '"C:\\Program Files (x86)\\Inno Setup 5\\iscc" InnoScript32.iss'
                },
                options: {
                    stdout: true,
                    stderr: true,
                    stdin: true
                }
            },
            install: {
                command: function() {
                    return 'bower cache clean && bower install && cd src && npm install';
                },
                options: {
                    stdout: true,
                    stderr: true,
                    stdin: true
                }
            },
            run: {
                command: function() {
                    return nwExec;
                },
                options: {
                    stdout: true,
                    stderr: true,
                    stdin: true,
                    maxBuffer: Infinity
                }
            }
        }

    });

    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-nw-builder');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-shell');

    grunt.registerTask('default', ['less', 'shell:run']);
    grunt.registerTask('run', ['default']);
    grunt.registerTask('install', ['shell:install', 'nwjs']);
    grunt.registerTask('build', ['less', 'nwjs']);


};