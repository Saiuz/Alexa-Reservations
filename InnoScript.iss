; Inno script to create an installer for Windows 32
; **NOTE**: This script contains absolute file paths. Be sure to change the definition of "MyBaseDir" to point to the
; local code repository.
; **NOTE2**: If the compilation apports with a message about a file in use by another process, turn off the antivirus
; software during compilation.
;

#define MyAppName "AlexaReservierungen"
#define MyAppVersion "1.4.0"
#define MyAppPublisher "Vogel Software Consulting LLC"
#define MyAppURL "https://github.com/vogelrh/Alexa-Reservations"
#define MyAppExeName "Alexa.exe"

#define MyBaseDir "C:\Users\nb88843\AppDevP\working\Alexa-Reservations"
#define NwVersion "0.25.4-sdk"
#define Architecture "win64"

#define NwSourcePath MyBaseDir + "\cache\" + NwVersion + "\" + Architecture

[Setup]
; NOTE: The value of AppId uniquely identifies this application.
; Do not use the same AppId value in installers for other applications.
; (To generate a new GUID, click Tools | Generate GUID inside the IDE.)
Uninstallable=yes
UninstallDisplayIcon={app}\images\AlexaLogo2014.ico
AppId={{1004C81A-2BBB-4BA5-AC25-EF412B1245DB}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
;AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={pf}\{#MyAppName}
DefaultGroupName=Alexa Reservierungen
OutputDir="{#MyBaseDir}\releases\inno32"
OutputBaseFilename=Alexa_Reservierungen_setup_{#MyAppVersion}
Compression=lzma
SolidCompression=yes

[Languages]
Name: "german"; MessagesFile: "compiler:Languages\German.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

;Remove old files - for NW.js, the locale files must be in subdirectory - clean up other files
;before install
[InstallDelete]
Type: files; Name: "{app}\*.pak"
Type: files; Name: "{app}\pdf.dll"
;Type: filesandordirs; Name: "{app}\node_modules"
;Type: filesandordirs; Name: "{app}\lib"

[Files]
Source: "{#NwSourcePath}\*"; DestDir: "{app}"; Flags: ignoreversion
Source: "{MyBaseDir}\..\src\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "{MyBaseDir}\..\extra\mongodump*"; DestDir: "{app}"; Flags: ignoreversion
; NOTE: Don't use "Flags: ignoreversion" on any shared system files

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\images\AlexaLogo2014.ico"
Name: "{commondesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\images\AlexaLogo2014.ico"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

