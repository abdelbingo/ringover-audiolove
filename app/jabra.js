// const { enumDeviceBtnType } = require("@gnaudio/jabra-node-sdk");
// const {
//     ipcMain,
// } = require("electron");

// const devices = [];
// let window;
// let currentDevice = null;
// let jabra = null;
// let isUsingJabra = false;
// let dualcall = false;
// const hasEventsBound = [];
// let muted = false;
// let hold = false;
// let hook = false;

// ipcMain.on("electron-msg", (e, data) => {
    
//     if (!isUsingJabra) return;
//     switch (data.action) {
//         case "call:ring":
//             // Start ringing
//             currentDevice.ringAsync();
//             break;
//         case "call:accepted":
//         currentDevice.unringAsync();
//             currentDevice.offhookAsync();
//             break;
//         case "call:progress":
//             // Start call timer
//             currentDevice.offhookAsync();
//             break;
//         case "call:terminated":
//             // Reset call timer
//             if (!dualcall) {
//                 reset();
//                 currentDevice.onhookAsync();
//                 currentDevice.unringAsync();
//             } else {
//                 currentDevice.onhookAsync();
//                 dualcall = false;
//             }
//             break;
//         case "call:toggleMute":
//             _toggleMute();
//             break;
//         case "call:toggleHold":
//             _toggleHold();
//             break;
//         case "dualcall:accepted":
//             currentDevice.unringAsync();
//             dualcall = true;
//             currentDevice.holdAsync();
//             setTimeout(_ => currentDevice.offhookAsync(), 250);
//             break;
//         case "dualcall:rejected":
//             currentDevice.unringAsync();
//             break;
//         case "dualcall:endHold":
//             currentDevice.onhookAsync();
//             dualcall = false;
//             hold = true;
//             let tempHook = hook;
//             hook = true;
//             setTimeout(_ => hook = tempHook, 1000);
//             break;
//         case "dualcall:endUnhold":
//             currentDevice.onhookAsync();
//             dualcall = false;
//             currentDevice.resumeAsync();
//             break;
//         case "set-jabra-id":
//             break;
//         case "unplug-jabra":
//             if(jabra){
//                 let remainingAttachedDevices = jabra.getAttachedDevices();
//                 if (remainingAttachedDevices.length == 0) {
//                     isUsingJabra = false;
//                     jabra.disposeAsync().then (() => {}); // Cleanup and allow node process to exit.
//                 }
//             }
//             break;
//         default:
//             break;
//     }
// });

// function reset() {
//     if (isUsingJabra && currentDevice) {
//         if (muted) currentDevice.unmuteAsync();
//         if (hold) currentDevice.resumeAsync();
//         currentDevice.onhookAsync();
//     }
//     return;
// }


// function _toggleMute() {
//     if (!isUsingJabra) return
//     muted = !muted;
//     if (muted) currentDevice.muteAsync();
//     if (!muted) currentDevice.unmuteAsync();
// }

// function _toggleHold() {
//     if (!isUsingJabra) return
//     hold = !hold;

//     if (hold) currentDevice.holdAsync();
//     if (!hold) currentDevice.resumeAsync();
// }

// function unplug() {
//     isUsingJabra = false;
//     return
// }

// function init(window, ready, err) {
//     // window.webContents.send('electron-msg', action);
//     if (devices.length > 0) {
//         isUsingJabra = true;
//         return ready(JSON.parse(JSON.stringify(devices)));
//     };

//     // jabra = require("jabra")("EFnXrKBUcDSs9Fi0ufFHX/UbXmeQPpOlXaiZ5E8TPAA=");
//     //  jabra = require("@gnaudio/jabra-node-sdk");


//     const j = require("@gnaudio/jabra-node-sdk");
//     j.createJabraApplication('EFnXrKBUcDSs9Fi0ufFHX/UbXmeQPpOlXaiZ5E8TPAA=').then((jabra) => { // 123 is appID here

//         jabra.scanForDevicesDoneAsync().then(_ => {
//             devices.splice(0, devices.length,  ...jabra.getAttachedDevices());
//             if (devices.length < 1) {
//                 isUsingJabra = false;
//                 return err();
//             }
//             currentDevice = devices[devices.length - 1];
//             return ready(JSON.parse(JSON.stringify(devices)));
//         });

//         jabra.on('detach', deviceToRemove => {
//             // let deviceToRemove;
//             devices.splice(devices.findIndex(d=>d.deviceID == deviceToRemove.deviceID), 1);
//             currentDevice.deviceID === deviceToRemove.deviceID
//             if (currentDevice.deviceID === deviceToRemove.deviceID){
//                if(devices.length > 0){
//                 setJabraId(devices[0].ESN, window);
//                }else{
//                 isUsingJabra = false;
//                 currentDevice = null;
//                }
//             }

//             window.webContents.send('electron-msg', {
//                 action: 'jabra:unplugged',
//                 data: {
//                     devices: JSON.parse(JSON.stringify(devices)), 
//                     current_device : JSON.parse(JSON.stringify(currentDevice))
//                 },
//             });
//             if(jabra){
//                 let remainingAttachedDevices = jabra.getAttachedDevices();
//                 if (remainingAttachedDevices.length == 0) {
//                     jabra.disposeAsync().then (() => {}); // Cleanup and allow node process to exit.
//                 }
//             }
            
//             for (let i = 0; i < hasEventsBound.length; i++) {
//                 if (hasEventsBound[i].deviceID === deviceToRemove.deviceID) {
//                     hasEventsBound.splice(i, 1);
//                     break;
//                 }
//             }
//         });

//         jabra.on("attach", newDevice => {
//            if(devices.find(d=>newDevice.deviceID == d.deviceID)){
//             return
//             }    
//             devices.push(newDevice);

//             currentDevice = newDevice;

//             window.webContents.send('electron-msg', {
//                 action: 'jabra:new-device',
//                 data: {
//                     devices: JSON.parse(JSON.stringify(devices)),
//                     current_device: JSON.parse(JSON.stringify(newDevice)),
//                 },
//             });

//             _sendBtnEvent(newDevice, j, window)
//             isUsingJabra = true;
//             reset();
//             return;
//         });
//     });
// }

// function setJabraId(ESN, window) {
//     currentDevice = null;
//     for (let i = 0; i < devices.length; i++) {
//         if (devices[i].ESN === ESN) {
//             currentDevice = devices[i];
//             let isBound = false
//             for (let j = 0; j < hasEventsBound.length; j++) {
//                 if (hasEventsBound[j].ESN === currentDevice.ESN) {
//                     isBound = true;
//                     break;
//                 };
//             }
//             //if (!isBound) _bindEvents(window, currentDevice)
//             break;
//         }
//     }
// }
// function getDevices() {
//     return devices;
// }
// module.exports = {
//     reset,
//     init,
//     isUsingJabra,
//     unplug,
//     getDevices,
//     setJabraId
// };

// function _sendBtnEvent(newDevice, j, window) {
//     if (newDevice) {

//         newDevice.on('btnPress', (btnType, btnValue) => {

//             let getBtnName = null;
//             let getBtnType = null;
//             let btnActionName = j.enumDeviceBtnType[btnType];

//             switch (btnActionName) {
//                 //key digit
//                 case "Key0":
//                     getBtnName = "0";
//                     getBtnType = "jabra:digit";
//                     break;
//                 case "Key1":
//                     getBtnName = "1";
//                     getBtnType = "jabra:digit";
//                     break;
//                 case "Key2":
//                     getBtnName = "2";
//                     getBtnType = "jabra:digit";
//                     break;
//                 case "Key3":
//                     getBtnName = "3";
//                     getBtnType = "jabra:digit";
//                     break;
//                 case "Key4":
//                     getBtnName = "4";
//                     getBtnType = "jabra:digit";
//                     break;
//                 case "Key5":
//                     getBtnName = "5";
//                     getBtnType = "jabra:digit";
//                     break;
//                 case "Key6":
//                     getBtnName = "6";
//                     getBtnType = "jabra:digit";
//                     break;
//                 case "Key7":
//                     getBtnName = "7";
//                     getBtnType = "jabra:digit";
//                     break;
//                 case "Key8":
//                     getBtnName = "8";
//                     getBtnType = "jabra:digit";
//                     break;
//                 case "Key9":
//                     getBtnName = "9";
//                     getBtnType = "jabra:digit";
//                     break;
//                 case "KeyStar":
//                     getBtnName = "Star";
//                     getBtnType = "jabra:digit";
//                     break;
//                 case "KeyPound":
//                     getBtnName = "Pound";
//                     getBtnType = "jabra:digit";
//                     break;
//                 case "KeyClear":
//                     getBtnName = "Clear";
//                     getBtnType = "jabra:digit";
//                     break;
//                 //others
//                 case "Redial":
//                     getBtnName = "Redial";
//                     getBtnType = "jabra:request";
//                     break;
//                 case "OffHook":
//                     getBtnName = "acceptCall";
//                     getBtnType = "jabra:request";
//                     break;
//                 case "RejectCall":
//                     getBtnName = "rejectCall";
//                     getBtnType = "jabra:request";
//                     break;
//                 case "Mute":
//                     getBtnName = "toggleMute";
//                     getBtnType = "jabra:request";
//                     break;
//                 case "Flash":
//                     getBtnName = "toggleHold";
//                     getBtnType = "jabra:request";
//                     break;
//                 default:
//                     getBtnName = null;
//                     break;
//             }

//             if(getBtnName){
//                 window.webContents.send('electron-msg', {
//                     action: getBtnType,
//                     data: getBtnName ,
//                 });
//             }
//         });
//     }
// }