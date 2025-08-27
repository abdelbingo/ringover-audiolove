const {
  app,
  session,
  BrowserWindow,
  ipcMain,
  Menu,
  MenuItem,
  shell,
  Notification,
  Tray,
  screen,
  nativeTheme,
  systemPreferences,
  dialog
} = require("electron");
const path = require("path");
const os = require("os");
const fs = require("fs");
const osu = require("node-os-utils");
const Badge = require("electron-windows-badge");
const words = require("./trad");
var pjson = require("../package.json");
// const jabra = require('./jabra');
const fetch = require("node-fetch");
const prompt = require("electron-prompt");

const isMac = process.platform === "darwin";
const isWindows = process.platform === "win32";
const isLinux = process.platform == "linux";
var Width = 380;
var Height = isWindows ? 670 : 670;
let mainWindow = null;
let aboutWindow = null;
let appTray = null;
let isDark = nativeTheme
  ? nativeTheme.shouldUseDarkColors
  : systemPreferences.isDarkMode();
let check_number_version = null;
var isDev = process.env.APP_DEV ? process.env.APP_DEV.trim() == "true" : false;
const platform =
  "Electron-" +
  app.getVersion() +
  "/" +
  (isMac ? "MacOS" : isWindows ? "Windows" : "Unix") +
  "_" +
  os.platform() +
  "_" +
  os.release();
let os_version = process.platform + ":" + process.arch;
var myringoverversion = [
  "chromeVersion/" + process.versions.chrome,
  "version/" + pjson.version,
  "electronVersion/" + process.versions.electron,
  "osVersion/" + os_version,
];
const ws = require("nodejs-websocket");
let server;
let isRestarting = false;
let hasUpdate = false;
let updateReady = false;
let appQuitFromTray = false;
let contextMenuTrayDisconnected = null;
let contextMenuTrayDisconnectedHideMenuBar = null;
let contextMenuTrayConnected = null;
let contextMenuTrayConnectedHideMenuBar = null;
let ctxMenu;
let hideMenuBar;
let get_lang_user;
var AutoLaunch = require("auto-launch");
const re = require("rage-edit");
const { argv, electron } = require("process");
const registry = re.Registry;
let willQuitApp;
let appName = pjson.name ? pjson.name : "Ringover";
const cpu = osu.cpu;
let defaulTpinToTop = true;
const { autoUpdater } = require("electron-updater");
const Store = require("electron-store");
const { url } = require("inspector");
const store = new Store();
var lang_process = process.env.LANG ? process.env.LANG.substr(0, 2) : "en";
let user_lang = process.env.LANG ? process.env.LANG.substring(0, 2) : "en";
// Badges
let count = 0;
let unreadMsg = 0;
let missdCall = 0;
let chatMsg = 0;
let appStatus = null;
let cpuPercentageValue = 0;
const express = require("express");
let urlWebApp = true ? "https://app.ringover.com" : "https://joan-ringover-webapp.dev145.scw.ringover.net";

const appex = express();
const PORT = 3000;
let size_x = 0;
let size_y = 0;

// Determine log directory based on environment
const logDirectory = app.isPackaged
  ? app.getPath("userData") // Production: user data directory
  : app.getAppPath(); // Development: project directory

// Create a writable stream in write mode (overwrites file on each run)
const logFilePath = path.join(logDirectory, "logs.txt");
const logStream = fs.createWriteStream(logFilePath, { flags: "w" });

// Function to log messages
function log(message) {
  const timestamp = new Date().toISOString();

  let formattedMessage;
  if (typeof message === "object") {
    // Prettify objects or arrays using JSON.stringify
    formattedMessage = JSON.stringify(message, null, 2);
  } else {
    // Use the message directly if it's a string
    formattedMessage = message;
  }

  logStream.write(`[${timestamp}] ${formattedMessage}\n`);
}

appex.use("/static", express.static(path.join(__dirname, "assets")));

appex.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

app.disableHardwareAcceleration();
let message_dialog = null;
let checkstats = false;
let response_dailog = false;
let x_timer = 0;
function getStats() {
  // Retrieve CPU data

  setTimeout(function () {
    cpu.usage().then((cpuPercentage) => {
      if (cpuPercentage > 90) {
        cpuPercentageValue = cpuPercentage + "%";
        // RAM data

        const options = {
          type: "warning",
          buttons: [translate("close", user_lang)],
          defaultId: 2,
          title: translate("cpu_alert", user_lang),
          message:
            translate("cpu_display_text_part1", user_lang) +
            cpuPercentageValue +
            translate("cpu_display_text_part2", user_lang),
          //checkboxLabel: 'Remember my answer',
          //checkboxChecked: typeof store.get('show_cpu_notif') != 'undefined' && store.get('show_cpu_notif') ? store.get('show_cpu_notif') : true,
        };
        if (
          typeof store.get("show_cpu_notif") != "undefined" &&
          store.get("show_cpu_notif")
        ) {
          dialog
            .showMessageBox(mainWindow ? mainWindow : null, options)
            .then((data) => {
              //console.log(data.checkboxChecked);
              if (
                data.response == 0 ||
                data.response == 1 ||
                data.response == 2
              ) {
                //store.set('show_cpu_notif',  data.checkboxChecked);
                create_menu(user_lang);
                getStats();
              }
            });
        }
      }
    });
  }, x_timer);
  x_timer = 1800000;
}

function createWindow() {
  let width = Width;
  let height = Height;
  let resizable = true;

  const taille = store.get("taille") || "default";

  if (!isLinux) {
    if (taille === "small") {
    } else if (taille === "medium") {
      width = Math.max(1200, parseInt(size_x / 1.5));
      height = Math.max(600, parseInt(size_y / 1.5));
    } else if (taille === "full") {
      width = size_x;
      height = size_y;
      resizable = true;
    }
  }

  let windowConfig = {
    width: width,
    height: height,
    resizable: resizable,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
    show: false,
    icon: __dirname + "/assets/icons/tray.png",
  };

  if (isLinux) {
    windowConfig.webPreferences.webSecurity = false;
  }

  if (isMac) {
    let path_icon = isDark
      ? "/assets/icons/" + process.platform + "/dark/logo_white.png"
      : "/assets/icons/" + process.platform + "/light/logo_noir.png";
    windowConfig.icon = path.join(__dirname, path_icon);
    // windowConfig.titleBarStyle = "hiddenInset";

    // windowConfig.webPreferences.contextIsolation = true;
    // windowConfig.vibrancy = "dark";
  }

  mainWindow = new BrowserWindow(windowConfig);

  app.on("browser-window-created", function (event, win) {
    ctxMenu = new Menu();
    ctxMenu.append(
      new MenuItem({
        label: translate("copy", user_lang),
        role: "copy",
        accelerator: "CommandOrControl+C",
      })
    );
    ctxMenu.append(
      new MenuItem({
        label: translate("paste", user_lang),
        role: "paste",
        accelerator: "CommandOrControl+V",
      })
    );
    ctxMenu.append(
      new MenuItem({
        label: translate("cut", user_lang),
        role: "cut",
        accelerator: "CommandOrControl+X",
      })
    );
    ctxMenu.append(
      new MenuItem({
        label: translate("cancel", user_lang),
        role: "undo",
        accelerator: "CommandOrControl+Z",
      })
    );
    ctxMenu.append(new MenuItem({ type: "separator" }));
    ctxMenu.append(
      new MenuItem({
        label: translate("format", user_lang),
        submenu: [
          {
            label: translate("small", user_lang),
            click: function () {
              store.set("taille", "small");
              if (isWindows) {
                mainWindow.restore();
                mainWindow.setSize(Width, Height);
                mainWindow.center();
                mainWindow.resizable = true;
              } else {
                mainWindow.resizable = true;
                mainWindow.setSize(Width, Height);
                mainWindow.center();
                mainWindow.resizable = true;
              }
            },
          },
          {
            label: translate("medium", user_lang),
            click: function () {
              store.set("taille", "medium");
              if (isWindows) {
                //1200, 600
                mainWindow.restore();
                mainWindow.setSize(
                  Math.max(1200, parseInt(size_x / 1.5)),
                  Math.max(600, parseInt(size_y / 1.5))
                );
                mainWindow.center();
                mainWindow.resizable = true;
              } else {
                mainWindow.resizable = true;
                //1200, 600
                mainWindow.setSize(
                  Math.max(1200, parseInt(size_x / 1.5)),
                  Math.max(600, parseInt(size_y / 1.5))
                );
                mainWindow.center();
                mainWindow.resizable = true;
              }
            },
          },
          {
            label: translate("full_screen", user_lang),
            visible: isWindows ? false : true,
            click: function () {
              store.set("taille", "full");
              if (!isWindows) {
                mainWindow.resizable = true;
                mainWindow.setSize(size_x, size_y);
                mainWindow.center();
                mainWindow.resizable = true;
              }
            },
          },
        ],
      })
    );

    contextMenuTrayConnected = Menu.buildFromTemplate([
      {
        label: "Ringover",
        click: function () {
          if (
            BrowserWindow.getAllWindows().length === 0 ||
            mainWindow === null
          ) {
            createWindow();
          } else {
            focusRingover();
          }
        },
      },
      { type: "separator" },
      {
        id: "id",
        label: translate("getto", user_lang),
        submenu: [
          {
            label: translate("call", user_lang),
            click: function () {
              mainWindow.webContents.send("electron-msg", {
                action: "change-page",
                data: "call-logs",
              });
              if (mainWindow.isMinimized()) {
                mainWindow.restore();
              }
              mainWindow.show();
            },
          },
          {
            label: translate("chat", user_lang),
            click: function () {
              mainWindow.webContents.send("electron-msg", {
                action: "change-page",
                data: "chat",
              });
              if (mainWindow.isMinimized()) {
                mainWindow.restore();
              }
              mainWindow.show();
            },
          },
          {
            label: translate("sms", user_lang),
            click: function () {
              mainWindow.webContents.send("electron-msg", {
                action: "change-page",
                data: "sms",
              });
              if (mainWindow.isMinimized()) {
                mainWindow.restore();
              }
              mainWindow.show();
            },
          },
          {
            label: translate("contacts", user_lang),
            click: function () {
              mainWindow.webContents.send("electron-msg", {
                action: "change-page",
                data: "contacts",
              });
              if (mainWindow.isMinimized()) {
                mainWindow.restore();
              }
              mainWindow.show();
            },
          },
          {
            label: translate("settings", user_lang),
            click: function () {
              mainWindow.webContents.send("electron-msg", {
                action: "change-page",
                data: "settings",
              });
              if (mainWindow.isMinimized()) {
                mainWindow.restore();
              }
              mainWindow.show();
            },
          },
        ],
      },
      {
        label: translate("relaunch", user_lang),
        click: function () {
          app.relaunch();
          app.exit();
        },
      },
      {
        label: translate("reload", user_lang),
        click: function () {
          if (
            BrowserWindow.getAllWindows().length === 0 ||
            mainWindow === null
          ) {
            createWindow();
          } else {
            mainWindow.reload();
          }
        },
      },
      {
        type: "separator",
      },
      {
        label: translate("settings_desktop", user_lang),
        submenu: [
          {
            label: store.get("hideMenuBar")
              ? translate("hide_menu_bar", user_lang)
              : translate("show_menu_bar", user_lang),
            visible: isWindows || isLinux ? true : false,
            click: function () {
              if (mainWindow) {
                hideMenuBar = !hideMenuBar;
                mainWindow.setMenuBarVisibility(!store.get("hideMenuBar"));
                store.set("hideMenuBar", !store.get("hideMenuBar"));
                appTray.setContextMenu(contextMenuTrayConnectedHideMenuBar);
                create_menu(user_lang);
              }
            },
          },
          {
            label: translate("auto_launch", user_lang),
            click: function () {
              store.set("open_at_start", !store.get("open_at_start"));
              app.setLoginItemSettings({
                openAtLogin: store.get("open_at_start"),
              });
              create_menu(user_lang);
            },
            type: "checkbox",
            checked: store.get("open_at_start"),
          },
          {
            label: translate("pin_to_top", user_lang),
            click: function () {
              store.set("pintotop", !store.get("pintotop"));
              if (store.get("pintotop")) {
                mainWindow.setAlwaysOnTop(true);
                mainWindow.setVisibleOnAllWorkspaces(true);
              } else {
                mainWindow.setAlwaysOnTop(false);
                mainWindow.setVisibleOnAllWorkspaces(false);
              }
              create_menu(user_lang);
              // app.relaunch();
              // app.exit();
            },
            type: "checkbox",
            checked: store.get("pintotop"),
          },
          {
            label: translate("cpu_notify", user_lang),
            click: function () {
              if (typeof store.get("show_cpu_notif") != "undefined") {
                store.set("show_cpu_notif", !store.get("show_cpu_notif"));
              }
              create_menu(user_lang);
              getStats();
            },
            type: "checkbox",
            checked:
              typeof store.get("show_cpu_notif") != "undefined"
                ? store.get("show_cpu_notif")
                : true,
          },
          {
            label: translate("open_link_with", user_lang),
            submenu: [
              {
                label: translate("browser", user_lang),
                click: function () {
                  store.set("open_external_url_browser", "browser");
                  create_menu(user_lang);
                },
                type: "radio",
                checked:
                  typeof store.get("open_external_url_browser") !=
                    "undefined" &&
                  store.get("open_external_url_browser") == "browser"
                    ? true
                    : false,
              },
              {
                label: "App",
                click: function () {
                  store.set("open_external_url_browser", "desktop");
                  create_menu(user_lang);
                },
                type: "radio",
                checked:
                  typeof store.get("open_external_url_browser") !=
                    "undefined" &&
                  store.get("open_external_url_browser") == "desktop"
                    ? true
                    : false,
              },
            ],
          },
        ],
      },
      // {
      //   label: 'url de base ' + store.get('url_base'),
      //   click: function () {
      //     changeUrlBase();
      //   }
      // },
      {
        label: translate("clear_cache_and_restart", user_lang),
        click: async function () {
          await session.defaultSession.clearStorageData();
          app.relaunch();
          app.exit();
        },
      },
      {
        label: translate("close", user_lang),
        click: function () {
          app.isQuiting = true;
          appQuitFromTray = true;
          quit();
        },
      },
    ]);

    contextMenuTrayDisconnected = Menu.buildFromTemplate([
      {
        label: "Ringover",
        click: function () {
          if (
            BrowserWindow.getAllWindows().length === 0 ||
            mainWindow === null
          ) {
            createWindow();
          } else {
            focusRingover();
          }
        },
      },
      {
        label: translate("relaunch", user_lang),
        click: function () {
          app.relaunch();
          app.exit();
        },
      },
      {
        label: translate("reload", user_lang),
        click: function () {
          if (
            BrowserWindow.getAllWindows().length === 0 ||
            mainWindow === null
          ) {
            createWindow();
          } else {
            mainWindow.reload();
          }
        },
      },
      {
        label: translate("settings_desktop", user_lang),
        submenu: [
          {
            label: store.get("hideMenuBar")
              ? translate("hide_menu_bar", user_lang)
              : translate("show_menu_bar", user_lang),
            visible: isWindows || isLinux ? true : false,
            click: function () {
              if (mainWindow) {
                hideMenuBar = !hideMenuBar;
                mainWindow.setMenuBarVisibility(!store.get("hideMenuBar"));
                store.set("hideMenuBar", !store.get("hideMenuBar"));
                appTray.setContextMenu(contextMenuTrayConnectedHideMenuBar);
                create_menu(user_lang);
              }
            },
          },
          {
            label: translate("auto_launch", user_lang),
            click: function () {
              store.set("open_at_start", !store.get("open_at_start"));
              app.setLoginItemSettings({
                openAtLogin: store.get("open_at_start"),
              });
              create_menu(user_lang);
            },
            type: "checkbox",
            checked: store.get("open_at_start"),
          },
          {
            label: translate("pin_to_top", user_lang),
            click: function () {
              store.set("pintotop", !store.get("pintotop"));
              if (store.get("pintotop")) {
                mainWindow.setAlwaysOnTop(true);
                mainWindow.setVisibleOnAllWorkspaces(true);
              } else {
                mainWindow.setAlwaysOnTop(false);
                mainWindow.setVisibleOnAllWorkspaces(false);
              }
              create_menu(user_lang);
              // app.relaunch();
              // app.exit();
            },
            type: "checkbox",
            checked: store.get("pintotop"),
          },
          {
            label: translate("cpu_notify", user_lang),
            click: function () {
              if (typeof store.get("show_cpu_notif") != "undefined") {
                store.set("show_cpu_notif", !store.get("show_cpu_notif"));
              }
              create_menu(user_lang);
              getStats();
            },
            type: "checkbox",
            checked:
              typeof store.get("show_cpu_notif") != "undefined"
                ? store.get("show_cpu_notif")
                : true,
          },
          {
            label: translate("open_link_with", user_lang),
            submenu: [
              {
                label: translate("browser", user_lang),
                click: function () {
                  store.set("open_external_url_browser", "browser");
                  create_menu(user_lang);
                },
                type: "radio",
                checked:
                  typeof store.get("open_external_url_browser") !=
                    "undefined" &&
                  store.get("open_external_url_browser") == "browser"
                    ? true
                    : false,
              },
              {
                label: "App",
                click: function () {
                  store.set("open_external_url_browser", "desktop");
                  create_menu(user_lang);
                },
                type: "radio",
                checked:
                  typeof store.get("open_external_url_browser") !=
                    "undefined" &&
                  store.get("open_external_url_browser") == "desktop"
                    ? true
                    : false,
              },
            ],
          },
        ],
      },
      // {
      //   label: 'url de base ' + store.get('url_base'),
      //   click: function () {
      //     changeUrlBase();
      //   }
      // },
      {
        label: translate("clear_cache_and_restart", user_lang),
        click: async function () {
          await session.defaultSession.clearStorageData();
          app.relaunch();
          app.exit();
        },
      },
      {
        label: translate("close", user_lang),
        click: function () {
          appQuitFromTray = true;
          quit();
        },
      },
    ]);

    contextMenuTrayConnectedHideMenuBar = Menu.buildFromTemplate([
      {
        label: "Ringover",
        click: function () {
          if (
            BrowserWindow.getAllWindows().length === 0 ||
            mainWindow === null
          ) {
            createWindow();
          } else {
            focusRingover();
          }
        },
      },
      { type: "separator" },
      {
        id: "id",
        label: translate("getto", user_lang),
        submenu: [
          {
            label: translate("call", user_lang),
            click: function () {
              mainWindow.webContents.send("electron-msg", {
                action: "change-page",
                data: "call-logs",
              });
              if (mainWindow.isMinimized()) {
                mainWindow.restore();
              }
              mainWindow.show();
            },
          },
          {
            label: translate("chat", user_lang),
            click: function () {
              mainWindow.webContents.send("electron-msg", {
                action: "change-page",
                data: "chat",
              });
              if (mainWindow.isMinimized()) {
                mainWindow.restore();
              }
              mainWindow.show();
            },
          },
          {
            label: translate("sms", user_lang),
            click: function () {
              mainWindow.webContents.send("electron-msg", {
                action: "change-page",
                data: "sms",
              });
              if (mainWindow.isMinimized()) {
                mainWindow.restore();
              }
              mainWindow.show();
            },
          },
          {
            label: translate("contacts", user_lang),
            click: function () {
              mainWindow.webContents.send("electron-msg", {
                action: "change-page",
                data: "contacts",
              });
              if (mainWindow.isMinimized()) {
                mainWindow.restore();
              }
              mainWindow.show();
            },
          },
          {
            label: translate("settings", user_lang),
            click: function () {
              mainWindow.webContents.send("electron-msg", {
                action: "change-page",
                data: "settings",
              });
              if (mainWindow.isMinimized()) {
                mainWindow.restore();
              }
              mainWindow.show();
            },
          },
        ],
      },
      {
        label: translate("relaunch", user_lang),
        click: function () {
          app.relaunch();
          app.exit();
        },
      },
      {
        label: translate("reload", user_lang),
        click: function () {
          if (
            BrowserWindow.getAllWindows().length === 0 ||
            mainWindow === null
          ) {
            createWindow();
          } else {
            mainWindow.reload();
          }
        },
      },
      {
        label: translate("settings_desktop", user_lang),
        submenu: [
          {
            label: translate("hide_menu_bar", user_lang),
            visible: isWindows || isLinux ? true : false,
            click: function () {
              if (mainWindow) {
                hideMenuBar = !hideMenuBar;
                mainWindow.setMenuBarVisibility(!store.get("hideMenuBar"));
                store.set("hideMenuBar", !store.get("hideMenuBar"));
                appTray.setContextMenu(contextMenuTrayConnectedHideMenuBar);
                create_menu(user_lang);
              }
            },
          },
          {
            label: translate("auto_launch", user_lang),
            click: function () {
              store.set("open_at_start", !store.get("open_at_start"));
              app.setLoginItemSettings({
                openAtLogin: store.get("open_at_start"),
              });
              create_menu(user_lang);
            },
            type: "checkbox",
            checked: store.get("open_at_start"),
          },
          {
            label: translate("pin_to_top", user_lang),
            click: function () {
              store.set("pintotop", !store.get("pintotop"));
              if (store.get("pintotop")) {
                mainWindow.setAlwaysOnTop(true);
                mainWindow.setVisibleOnAllWorkspaces(true);
              } else {
                mainWindow.setAlwaysOnTop(false);
                mainWindow.setVisibleOnAllWorkspaces(false);
              }
              create_menu(user_lang);
              // app.relaunch();
              // app.exit();
            },
            type: "checkbox",
            checked: store.get("pintotop"),
          },
          {
            label: translate("cpu_notify", user_lang),
            click: function () {
              if (typeof store.get("show_cpu_notif") != "undefined") {
                store.set("show_cpu_notif", !store.get("show_cpu_notif"));
              }
              create_menu(user_lang);
              getStats();
            },
            type: "checkbox",
            checked:
              typeof store.get("show_cpu_notif") != "undefined"
                ? store.get("show_cpu_notif")
                : true,
          },
          {
            label: translate("open_link_with", user_lang),
            submenu: [
              {
                label: translate("browser", user_lang),
                click: function () {
                  store.set("open_external_url_browser", "browser");
                  create_menu(user_lang);
                },
                type: "radio",
                checked:
                  typeof store.get("open_external_url_browser") !=
                    "undefined" &&
                  store.get("open_external_url_browser") == "browser"
                    ? true
                    : false,
              },
              {
                label: "App",
                click: function () {
                  store.set("open_external_url_browser", "desktop");
                  create_menu(user_lang);
                },
                type: "radio",
                checked:
                  typeof store.get("open_external_url_browser") !=
                    "undefined" &&
                  store.get("open_external_url_browser") == "desktop"
                    ? true
                    : false,
              },
            ],
          },
        ],
      },
      // {
      //   label: 'url de base ' + store.get('url_base'),
      //   click: function () {
      //     changeUrlBase();
      //   }
      // },
      {
        label: translate("clear_cache_and_restart", user_lang),
        click: async function () {
          await session.defaultSession.clearStorageData();
          app.relaunch();
          app.exit();
        },
      },
      {
        label: translate("close", user_lang),
        click: function () {
          app.isQuiting = true;
          appQuitFromTray = true;
          quit();
        },
      },
    ]);

    contextMenuTrayDisconnectedHideMenuBar = Menu.buildFromTemplate([
      {
        label: "Ringovder",
        click: function () {
          if (
            BrowserWindow.getAllWindows().length === 0 ||
            mainWindow === null
          ) {
            createWindow();
          } else {
            focusRingover();
          }
        },
      },
      {
        label: translate("relaunch", user_lang),
        click: function () {
          app.relaunch();
          app.exit();
        },
      },
      {
        label: translate("reload", user_lang),
        click: function () {
          if (
            BrowserWindow.getAllWindows().length === 0 ||
            mainWindow === null
          ) {
            createWindow();
          } else {
            mainWindow.reload();
          }
        },
      },
      {
        label: translate("settings_desktop", user_lang),
        submenu: [
          {
            label: store.get("hideMenuBar")
              ? translate("hide_menu_bar", user_lang)
              : translate("show_menu_bar", user_lang),
            visible: isWindows || isLinux ? true : false,
            click: function () {
              if (mainWindow) {
                hideMenuBar = !hideMenuBar;
                mainWindow.setMenuBarVisibility(!store.get("hideMenuBar"));
                store.set("hideMenuBar", !store.get("hideMenuBar"));
                appTray.setContextMenu(contextMenuTrayConnectedHideMenuBar);
                create_menu(user_lang);
              }
            },
          },
          {
            label: translate("auto_launch", user_lang),
            click: function () {
              store.set("open_at_start", !store.get("open_at_start"));
              app.setLoginItemSettings({
                openAtLogin: store.get("open_at_start"),
              });
              create_menu(user_lang);
            },
            type: "checkbox",
            checked: store.get("open_at_start"),
          },
          {
            label: translate("pin_to_top", user_lang),
            click: function () {
              store.set("pintotop", !store.get("pintotop"));
              if (store.get("pintotop")) {
                mainWindow.setAlwaysOnTop(true);
                mainWindow.setVisibleOnAllWorkspaces(true);
              } else {
                mainWindow.setAlwaysOnTop(false);
                mainWindow.setVisibleOnAllWorkspaces(false);
              }
              create_menu(user_lang);
              // app.relaunch();
              // app.exit();
            },
            type: "checkbox",
            checked: store.get("pintotop"),
          },
          {
            label: translate("cpu_notify", user_lang),
            click: function () {
              if (typeof store.get("show_cpu_notif") != "undefined") {
                store.set("show_cpu_notif", !store.get("show_cpu_notif"));
              }
              create_menu(user_lang);
              getStats();
            },
            type: "checkbox",
            checked:
              typeof store.get("show_cpu_notif") != "undefined"
                ? store.get("show_cpu_notif")
                : true,
          },
          {
            label: translate("open_link_with", user_lang),
            submenu: [
              {
                label: translate("browser", user_lang),
                click: function () {
                  store.set("open_external_url_browser", "browser");
                  create_menu(user_lang);
                },
                type: "radio",
                checked:
                  typeof store.get("open_external_url_browser") !=
                    "undefined" &&
                  store.get("open_external_url_browser") == "browser"
                    ? true
                    : false,
              },
              {
                label: "App",
                click: function () {
                  store.set("open_external_url_browser", "desktop");
                  create_menu(user_lang);
                },
                type: "radio",
                checked:
                  typeof store.get("open_external_url_browser") !=
                    "undefined" &&
                  store.get("open_external_url_browser") == "desktop"
                    ? true
                    : false,
              },
            ],
          },
        ],
      },
      // {
      //   label: 'url de base ' + store.get('url_base'),
      //   click: function () {
      //     changeUrlBase();
      //   }
      // },
      {
        label: translate("clear_cache_and_restart", user_lang),
        click: async function () {
          await session.defaultSession.clearStorageData();
          app.relaunch();
          app.exit();
        },
      },
      {
        label: translate("close", user_lang),
        click: function () {
          appQuitFromTray = true;
          quit();
        },
      },
    ]);
    appTray.setToolTip("Ringover");
    appTray.on("click", function () {
      focusRingover();
    });

    mainWindow.webContents.on(
      "did-fail-load",
      (event, errorCode, errorDescription) => {
        console.log(`Page load failed with error: ${errorDescription}`);
        mainWindow.reload();
      }
    );

    mainWindow.webContents.on(
      "render-process-gone",
      function (event, detailed) {
        mainWindow.reload();
      }
    );

    mainWindow.webContents.on("context-menu", function (e, props) {
      const template = [
        // { role: 'appMenu' }
        ...(isMac
          ? [
              {
                label: app.name,
                submenu: [
                  { role: "about" },
                  { type: "separator" },
                  { role: "services" },
                  { type: "separator" },
                  { role: "hide" },
                  { role: "hideothers" },
                  { role: "unhide" },
                  { type: "separator" },
                  { role: "quit" },
                ],
              },
            ]
          : []),
        // { role: 'editMenu' }
        {
          label: translate("edit", user_lang),
          submenu: [
            { label: translate("cancel", user_lang), role: "undo" },
            { type: "separator" },
            { label: translate("cut", user_lang), role: "cut" },
            { label: translate("copy", user_lang), role: "copy" },
            { label: translate("paste", user_lang), role: "paste" },
            { label: translate("delete", user_lang), role: "delete" },
            { type: "separator" },
            { label: translate("selectAll", user_lang), role: "selectAll" },
          ],
        },
        // { role: 'viewMenu' }
        {
          label: translate("view", user_lang),
          submenu: [
            {
              label: translate("relaunch", user_lang),
              click: function () {
                app.relaunch();
                app.exit();
              },
            },
            { label: translate("reload", user_lang), role: "reload" },
            ...(isDev
              ? [
                  //{ role: 'toggleDevTools' },
                  { role: "forceReload" },
                ]
              : ""),
            // { label: 'Console', role: 'toggleDevTools', accelerator: "F12" },

            { label: translate("reload", user_lang), type: "separator" },
            { label: translate("zoom_in", user_lang), role: "zoomIn" },
            {
              label: translate("zoom_out", user_lang),
              role: "zoomOut",
              accelerator: "CommandOrControl+O",
            },
            {
              type: "separator",
            },
            {
              label: translate("auto_launch", user_lang),
              click: function () {
                store.set("open_at_start", !store.get("open_at_start"));
                app.setLoginItemSettings({
                  openAtLogin: store.get("open_at_start"),
                });
                create_menu(user_lang);
              },
              type: "checkbox",
              checked: store.get("open_at_start"),
            },
            {
              label: translate("pin_to_top", user_lang),
              click: function () {
                store.set("pintotop", !store.get("pintotop"));
                if (store.get("pintotop")) {
                  mainWindow.setAlwaysOnTop(true);
                  mainWindow.setVisibleOnAllWorkspaces(true);
                } else {
                  mainWindow.setAlwaysOnTop(false);
                  mainWindow.setVisibleOnAllWorkspaces(false);
                }
                create_menu(user_lang);
                // app.relaunch();
                // app.exit();
              },
              type: "checkbox",
              checked: store.get("pintotop"),
            },
            {
              label: translate("cpu_notify", user_lang),
              click: function () {
                if (typeof store.get("show_cpu_notif") != "undefined") {
                  store.set("show_cpu_notif", !store.get("show_cpu_notif"));
                }
                create_menu(user_lang);
                getStats();
              },
              type: "checkbox",
              checked:
                typeof store.get("show_cpu_notif") != "undefined"
                  ? store.get("show_cpu_notif")
                  : true,
            },
            {
              label: translate("open_link_with", user_lang),
              submenu: [
                {
                  label: translate("browser", user_lang),
                  click: function () {
                    store.set("open_external_url_browser", "browser");
                    create_menu(user_lang);
                  },
                  type: "radio",
                  checked:
                    typeof store.get("open_external_url_browser") !=
                      "undefined" &&
                    store.get("open_external_url_browser") == "browser"
                      ? true
                      : false,
                },
                {
                  label: "App",
                  click: function () {
                    store.set("open_external_url_browser", "desktop");
                    create_menu(user_lang);
                  },
                  type: "radio",
                  checked:
                    typeof store.get("open_external_url_browser") !=
                      "undefined" &&
                    store.get("open_external_url_browser") == "desktop"
                      ? true
                      : false,
                },
              ],
            },
          ],
        },
        // { role: 'windowMenu' }
        {
          label: translate("window", user_lang),
          submenu: [
            { label: translate("minimize", user_lang), role: "minimize" },
            {
              label: translate("format", user_lang),
              submenu: [
                {
                  label: translate("small", user_lang),
                  click: function () {
                    store.set("taille", "small");
                    if (isWindows) {
                      mainWindow.restore();
                      mainWindow.setSize(Width, Height);
                      mainWindow.center();
                      mainWindow.resizable = true;
                    } else {
                      mainWindow.resizable = true;
                      mainWindow.setSize(Width, Height);
                      mainWindow.center();
                      mainWindow.resizable = true;
                    }
                  },
                },
                {
                  label: translate("medium", user_lang),
                  click: function () {
                    store.set("taille", "medium");
                    if (isWindows) {
                      //1200, 600
                      mainWindow.restore();
                      mainWindow.setSize(
                        Math.max(1200, parseInt(size_x / 1.5)),
                        Math.max(600, parseInt(size_y / 1.5))
                      );
                      mainWindow.center();
                      mainWindow.resizable = true;
                    } else {
                      mainWindow.resizable = true;
                      //1200, 600
                      mainWindow.setSize(
                        Math.max(1200, parseInt(size_x / 1.5)),
                        Math.max(600, parseInt(size_y / 1.5))
                      );
                      mainWindow.center();
                      mainWindow.resizable = true;
                    }
                  },
                },
                {
                  label: translate("full_screen", user_lang),
                  visible: isWindows ? false : true,
                  click: function () {
                    store.set("taille", "full");
                    if (!isWindows) {
                      mainWindow.resizable = true;
                      mainWindow.setSize(size_x, size_y);
                      mainWindow.center();
                      mainWindow.resizable = true;
                    }
                  },
                },
              ],
            },
            ...(isMac
              ? [
                  { type: "separator" },
                  { role: "front" },
                  { type: "separator" },
                  { role: "window" },
                ]
              : [
                  { type: "separator" },
                  {
                    label: translate("close", user_lang),
                    click: function () {
                      quit();
                    },
                  },
                ]),
          ],
        },
        {
          label: translate("help", user_lang),
          submenu: [
            {
              label: translate("about", user_lang),
              click: function () {
                if (!aboutWindow) {
                  aboutWindow = new BrowserWindow({
                    width: 340,
                    height: 400,
                    parent: mainWindow,
                    backgroundThrottling: false,
                    show: false,
                    minimizable: false,
                    resizable: false,
                    maximizable: false,
                    alwaysOnTop: true,
                    icon: isMac
                      ? path.join(__dirname, "/assets/icons/darwin/app.icns")
                      : path.join(__dirname, "assets/icons/png/64x64.png"),
                  });
                  aboutWindow.on("close", (_) => {
                    aboutWindow = null;
                    if (mainWindow && !app.isQuiting) mainWindow.show();
                  });
                  aboutWindow.loadFile(__dirname + "/pages/about.html", {
                    search: "myringover=" + myringoverversion,
                  });
                  // aboutWindow.loadURL("data:text/html;charset=utf-8," + __dirname + '/assets/about.html'
                }
                aboutWindow.setMenu(null);
                aboutWindow.show();
              },
            },
            {
              label: translate("support", user_lang),
              click: function () {
                let ext = null;
                switch (user_lang) {
                  case "en":
                    ext = "com";
                    break;
                  case "fr":
                    ext = "fr";
                    break;
                  case "es":
                    ext = "es";
                    break;
                  default:
                    ext = "com";
                    break;
                }
                return shell.openExternal(
                  "https://ringover." + ext + "/support"
                );
              },
            },
            {
              label: translate("check_for_update", user_lang),
              click: function () {
                checkForUpdate("https://api.ringover.com/v2/versions", "menu");
              },
            },
            {
              label: translate("clear_cache_and_restart", user_lang),
              click: async function () {
                await session.defaultSession.clearStorageData();
                app.relaunch();
                app.exit();
              },
            },
          ],
        },
      ];

      const minimize = {
        label: translate("minimize", user_lang),
        role: "minimize",
      };

      const formatMenu = {
        label: translate("format", user_lang),
        submenu: [
          {
            label: translate("small", user_lang),
            click: function () {
              store.set("taille", "small");
              if (isWindows) {
                mainWindow.restore();
                mainWindow.setSize(Width, Height);
                mainWindow.center();
                mainWindow.resizable = true;
              } else {
                mainWindow.resizable = true;
                mainWindow.setSize(Width, Height);
                mainWindow.center();
                mainWindow.resizable = true;
              }
            },
          },
          {
            label: translate("medium", user_lang),
            click: function () {
              store.set("taille", "medium");
              if (isWindows) {
                //1200, 600
                mainWindow.restore();
                mainWindow.setSize(
                  Math.max(1200, parseInt(size_x / 1.5)),
                  Math.max(600, parseInt(size_y / 1.5))
                );
                mainWindow.center();
                mainWindow.resizable = true;
              } else {
                mainWindow.resizable = true;
                //1200, 600
                mainWindow.setSize(
                  Math.max(1200, parseInt(size_x / 1.5)),
                  Math.max(600, parseInt(size_y / 1.5))
                );
                mainWindow.center();
                mainWindow.resizable = true;
              }
            },
          },
          {
            label: translate("full_screen", user_lang),
            visible: isWindows ? false : true,
            click: function () {
              store.set("taille", "full");
              if (!isWindows) {
                mainWindow.resizable = true;
                mainWindow.setSize(size_x, size_y);
                mainWindow.center();
                mainWindow.resizable = true;
              }
            },
          },
        ],
      };

      let windowMenu;

      if (isMac) {
        windowMenu = {
          label: translate("window", user_lang),
          role: "window",
          submenu: [
            formatMenu,
            { role: "minimize" },
            { role: "zoom" },
            { type: "separator" },
            { role: "front", label: translate("all_window_front", user_lang) },
          ],
        };
      } else {
        windowMenu = {
          label: translate("window", user_lang),
          submenu: [
            minimize,
            formatMenu,
            { type: "separator" },
            {
              label: translate("close", user_lang),
              click: function () {
                quit();
              },
            },
          ],
        };
      }

      template.splice(template.length - 1, 0, windowMenu);

      const menu = Menu.buildFromTemplate(template);
      Menu.setApplicationMenu(menu);
    });
  });

  mainWindow.webContents.on("did-create-window", (childWindow) => {
    // childWindow.setAlwaysOnTop(true);
    // childWindow.setVisibleOnAllWorkspaces(true);
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setVisibleOnAllWorkspaces(false);
    childWindow.on("close", () => {
      if (typeof store.get("pintotop") !== "undefined") {
        if (store.get("pintotop")) {
          mainWindow.setAlwaysOnTop(store.get("pintotop"), "floating");
          mainWindow.setVisibleOnAllWorkspaces(store.get("pintotop"));
        } else {
          mainWindow.setAlwaysOnTop(false);
          mainWindow.setVisibleOnAllWorkspaces(false);
        }
      } else {
        store.set("pintotop", false);
        mainWindow.setAlwaysOnTop(store.get("pintotop"), "floating");
        mainWindow.setVisibleOnAllWorkspaces(true);
      }
    });
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (store.get("open_external_url_browser") === "browser") {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return {
      action: "allow",
      overrideBrowserWindowOptions: {
        resizable: true,
      },
    };
  });

  //win.loadFile('/home/koussai/t/index.html');
  //win.loadURL('https://xyz.dev157.ringover.dev').then(() => {
  //https://v4.dev157.ringover.dev
  //https://myringoverkoussai.dev.bjtpartners.fr

  if (appTray === null) {
    let lunch_tray_icon = null;
    if (isMac) {
      if (isDark) {
        lunch_tray_icon =
          __dirname +
          "/assets/icons/" +
          process.platform +
          "/dark/logo_white.png";
      } else {
        lunch_tray_icon =
          __dirname +
          "/assets/icons/" +
          process.platform +
          "/light/logo_noir.png";
      }
    } else {
      lunch_tray_icon = __dirname + "/assets/icons/png/64x64_warning.png";
    }
    appTray = new Tray(lunch_tray_icon);
  }

  app.setName(appName);

  // We'll manually install app on quit
  autoUpdater.autoInstallOnAppQuit = false;
  // Autoplay policy
  app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
  //autoUpdater.autoDownload = false;
  //https://beta-app.ringover.com/

  // allow hid devices from Jabra
  mainWindow.webContents.session.setDevicePermissionHandler((details) => {
    if (details.deviceType === 'hid' && details.origin === urlWebApp && [2830, 0xb0e].includes(details.device.vendorId)) {
      return true
    }
  });

  mainWindow
    // .loadURL("https://app.ringover.com")
    .loadURL(urlWebApp)
    .then((cb) => {
      mainWindow.webContents.on(
        "did-fail-load",
        (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
          if (isMainFrame && errorDescription.includes("ERR_FAILED")) {
            // clear cache and restart
            session.defaultSession.clearStorageData().then(() => {
              app.relaunch();
              app.exit();
            });
          }
        }
      );

      ipcMain.on("electron-msg", (event, arg) => {
        switch (arg.action) {
          case "user_language":
            user_lang = arg.data.lang ? arg.data.lang : user_lang;
            if (!["en", "fr", "es"].includes(user_lang)) user_lang = "en";
            create_menu(user_lang);
            break;
          case "getOSVersion":
            if (isMac) {
              mainWindow.webContents.send("electron-msg", {
                action: "check-type",
                data: "macos",
              });
            } else if (isLinux) {
              mainWindow.webContents.send("electron-msg", {
                action: "check-type",
                data: "linux",
              });
            } else if (isWindows) {
              mainWindow.webContents.send("electron-msg", {
                action: "check-type",
                data: "windows",
              });
            }
            event.returnValue = platform;
            //myringoverversion.push("osVersion/" + arg.returnValue);
            break;
          case "keepROVersion":
            check_number_version = arg.version;
            myringoverversion.push("myRingoverVersion/" + arg.version);
            checkForUpdate("https://api.ringover.com/v2/versions");
            break;
          case "notification-electron":
            showNotification(arg.data);
            break;
          // case "init-jabra":
          //   jabra.init(mainWindow, devices => {
          //     mainWindow.webContents.send("electron-msg", {
          //       action: "jabra:init",
          //       data: {
          //         devices: devices,
          //         // default
          //         device: devices[devices.length - 1],
          //         status: "ok",
          //         message: "Jabra library initialized successfully"
          //       }
          //     });
          //   }, err => {
          //     mainWindow.webContents.send("electron-msg", {
          //       action: "jabra:init",
          //       data: {
          //         status: "error",
          //         message: "Error while attaching Jabra device."
          //       }
          //     });
          //   });
          //   break;
          case "sip:on":
            //change icon to green
            if (!server) createWebSocket();
            appStatus = "green";
            if (
              !contextMenuTrayConnected ||
              !contextMenuTrayConnectedHideMenuBar
            ) {
              create_menu(user_lang)
                .then(() => {
                  if (typeof store.get("hideMenuBar") !== "undefined") {
                    if (store.get("hideMenuBar")) {
                      appTray.setContextMenu(
                        contextMenuTrayConnectedHideMenuBar
                      );
                    } else {
                      appTray.setContextMenu(contextMenuTrayConnected);
                    }
                  } else {
                    appTray.setContextMenu(contextMenuTrayConnected);
                  }
                })
                .catch((e) => console.log(e));
            } else {
              if (typeof store.get("hideMenuBar") !== "undefined") {
                if (store.get("hideMenuBar")) {
                  appTray.setContextMenu(contextMenuTrayConnectedHideMenuBar);
                } else {
                  appTray.setContextMenu(contextMenuTrayConnected);
                }
              } else {
                appTray.setContextMenu(contextMenuTrayConnected);
              }
            }
            if (isLinux && count > 0) {
            } else {
              setIcon("green");
            }
            break;
          case "sip:off":
            //change icon to yellow
            if (server) destroyWebSocket();
            appStatus = "red";
            if (
              !contextMenuTrayDisconnected ||
              !contextMenuTrayDisconnectedHideMenuBar
            ) {
              console.log(user_lang);
              create_menu(user_lang)
                .then(() => {
                  if (typeof store.get("hideMenuBar") !== "undefined") {
                    if (store.get("hideMenuBar")) {
                      appTray.setContextMenu(
                        contextMenuTrayDisconnectedHideMenuBar
                      );
                    } else {
                      appTray.setContextMenu(contextMenuTrayDisconnected);
                    }
                  } else {
                    appTray.setContextMenu(contextMenuTrayDisconnected);
                  }
                })
                .catch((e) => console.log(e));
            } else {
              if (typeof store.get("hideMenuBar") !== "undefined") {
                if (store.get("hideMenuBar")) {
                  appTray.setContextMenu(
                    contextMenuTrayDisconnectedHideMenuBar
                  );
                } else {
                  appTray.setContextMenu(contextMenuTrayDisconnected);
                }
              } else {
                appTray.setContextMenu(contextMenuTrayDisconnected);
              }
            }
            setIcon("red");
            break;
          case "sip:stop":
            //change icon to yellow
            appStatus = "yellow";

            if (
              !contextMenuTrayDisconnected ||
              !contextMenuTrayDisconnectedHideMenuBar
            ) {
              create_menu(user_lang)
                .then(() => {
                  if (typeof store.get("hideMenuBar") !== "undefined") {
                    if (store.get("hideMenuBar")) {
                      appTray.setContextMenu(
                        contextMenuTrayDisconnectedHideMenuBar
                      );
                    } else {
                      appTray.setContextMenu(contextMenuTrayDisconnected);
                    }
                  } else {
                    appTray.setContextMenu(contextMenuTrayDisconnected);
                  }
                })
                .catch((e) => console.log(e));
            } else {
              if (typeof store.get("hideMenuBar") !== "undefined") {
                if (store.get("hideMenuBar")) {
                  appTray.setContextMenu(
                    contextMenuTrayDisconnectedHideMenuBar
                  );
                } else {
                  appTray.setContextMenu(contextMenuTrayDisconnected);
                }
              } else {
                appTray.setContextMenu(contextMenuTrayDisconnected);
              }
            }
            setIcon("yellow");
            break;
          case "badge:logs":
            missdCall = arg.data ? parseInt(arg.data) : 0;
            updateBadge();
            break;
          case "badge:sms":
            unreadMsg = arg.data ? parseInt(arg.data) : 0;
            updateBadge();
            break;
          case "badge:chat":
            chatMsg = arg.data ? parseInt(arg.data) : 0;
            updateBadge();
            break;
          case "callNotification":
            if (arg.data.enable) {
              getStats();
            }
            break;
          default:
            break;
        }
      });
    })
    .catch((error) => {
      console.log(error), create_menu(user_lang);
    });

  //mainWindow.setMaximizable(false)
  let winBadge = new Badge(mainWindow, {});

  //check for update

  app.setAppUserModelId("Ringover");

  let updateBadge = (_) => {
    count = unreadMsg + missdCall + chatMsg;
    if (count <= 0) count = "";
    if (count > 9) count = "9+";
    if (isMac && app.dock) {
      app.dock.setBadge(count.toString());
    } else if (isWindows && mainWindow && winBadge) {
      winBadge.update(count ? parseInt(count) : null);
    } else if (isLinux) {
      if (count > 0) {
        appTray.setImage(
          __dirname + "/assets/images/tray_notification_linux.png"
        );
      } else {
        setIcon(appStatus);
      }
    }
  };

  mainWindow.webContents.on("did-finish-load", function () {
    // splash.destroy();
    mainWindow.show();
    handleAppArguments(process.argv);
  });
}
app.on("open-url", function (event, url) {
  event.preventDefault();
  handleAppArguments([url]);
});

app.on("render-process-gone", function (e, webContents, details) {
  mainWindow.reload();
});

// Récupération d'une demande focus de l'application de la part du site
ipcMain.on("focus-me", function () {
  focusRingover();
});

app.whenReady().then(() => {
  // if (typeof store.get('url_base') === 'undefined') {
  //   store.set('url_base', 'https://app.ringover.com');
  // } else {
  //   store.set('url_base', store.get('url_base'));
  // }

  createWindow();
  mainWindow.webContents.on("did-fail-load", () => {
    mainWindow.reload();
  });

  app.setAsDefaultProtocolClient("tel");
  app.setAsDefaultProtocolClient("callto");

  const displays = screen.getAllDisplays();
  const externalDisplay = displays.find((display) => {
    return display.bounds.x !== 0 || display.bounds.y !== 0;
  });

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  (size_x = width + screen.getPrimaryDisplay().workArea.x),
    (size_y = height + screen.getPrimaryDisplay().workArea.y);
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0 || mainWindow === null) {
      createWindow();
    } else {
      focusRingover();
    }
  });

  if (isWindows) {
    app.setUserTasks([]);
  }

  if (isMac) {
    systemPreferences.subscribeNotification(
      "AppleInterfaceThemeChangedNotification",
      function theThemeHasChanged() {
        let themeChanged = nativeTheme
          ? nativeTheme.shouldUseDarkColors
          : systemPreferences.isDarkMode();
        let tray_icon_theme_changed = null;
        if (isMac) {
          if (isDark) {
            tray_icon_theme_changed =
              __dirname +
              "/assets/icons/" +
              process.platform +
              "/dark/logo_white.png";
          } else {
            tray_icon_theme_changed =
              __dirname +
              "/assets/icons/" +
              process.platform +
              "/light/logo_noir.png";
          }
        }
        appTray.setImage(tray_icon_theme_changed);
      }
    );
  }

  app.on("before-quit", function () {
    app.isQuiting = true;
  });

  if (mainWindow) {
    mainWindow.on("close", function (e) {
      if (!app.isQuiting) {
        e.preventDefault();
        mainWindow.hide();

        if (mainWindow.isFullScreen()) {
          // Exit full screen before closing
          mainWindow.once("leave-full-screen", () => {
            mainWindow.close();
          });
          mainWindow.setFullScreen(false);
        }
      }
    });
  }
  // Désallocation de la fenêtre
  if (mainWindow) {
    mainWindow.on("closed", function () {
      mainWindow = null;
      if (process.platform !== "darwin") {
        app.quit();
      }
    });
  }

  if (typeof store.get("open_external_url_browser") === "undefined") {
    store.set("open_external_url_browser", "desktop");
  } else {
    store.set(
      "open_external_url_browser",
      store.get("open_external_url_browser")
    );
  }

  if (typeof store.get("show_cpu_notif") === "undefined") {
    store.set("show_cpu_notif", false);
  } else {
    store.set("show_cpu_notif", store.get("show_cpu_notif"));
  }

  if (typeof store.get("hideMenuBar") !== "undefined") {
    mainWindow.setMenuBarVisibility(store.get("hideMenuBar"));
  } else {
    mainWindow.setMenuBarVisibility(false);
  }

  console.log(path.basename(process.execPath));
  app.setLoginItemSettings({
    openAtLogin: true,
    path: app.getAppPath(path.basename(process.execPath)),
  });
  if (typeof store.get("open_at_start") !== "undefined") {
    app.setLoginItemSettings({ openAtLogin: store.get("open_at_start") });
  } else {
    store.set("open_at_start", true);
    app.setLoginItemSettings({ openAtLogin: true });
  }

  if (typeof store.get("pintotop") !== "undefined") {
    if (store.get("pintotop")) {
      mainWindow.setAlwaysOnTop(store.get("pintotop"), "floating");
      mainWindow.setVisibleOnAllWorkspaces(store.get("pintotop"));
    } else {
      mainWindow.setAlwaysOnTop(false);
      mainWindow.setVisibleOnAllWorkspaces(false);
    }
  } else {
    store.set("pintotop", false);
    mainWindow.setAlwaysOnTop(store.get("pintotop"), "floating");
    mainWindow.setVisibleOnAllWorkspaces(true);
  }

  process.on("uncaughtException", (err) => {
    console.log(err);
  });

  mainWindow.webContents.on("render-process-gone", function (event, detailed) {
    mainWindow.reload();
  });

  process.on("unhandledRejection", (e) => {
    console.log(e);
  });

  autoUpdater.on("checking-for-update", () => {
    console.log("check");
  });
  autoUpdater.on("update-available", (data) => {
    console.log("there is an update!");
    hasUpdate = true;
  });

  autoUpdater.on("update-downloaded", (data) => {
    console.log("update downloaded!");
    updateReady = true;
  });

  autoUpdater.on("error", (data) => {
    console.log(data, "error");
    handleUpdateError();
  });
  autoUpdater.checkForUpdates();

  updateFetchingLoop();

  getStats();
});

process.on("unhandledRejection", (e) => {
  console.log(e);
});

app.on("window-all-closed", () => {
  if (!isMac) {
    app.quit();
  }
});

process.on("uncaughtException", (err) => {
  console.error(err);
});

/*
 * Une seule instance de l'application est autorisée
 */

//var shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
let isPrimaryInstance = app.requestSingleInstanceLock();
app.on("second-instance", (event, argv, cwd) => {
  if (mainWindow) {
    handleAppArguments(argv);
    focusRingover();
  }
});

if (!isPrimaryInstance) {
  app.quit();
}

// function focusRingover() {
//   if (mainWindow) {
//     if (mainWindow.isMinimized()) {
//       mainWindow.restore();
//     }
//     mainWindow.show();
//     app.focus();
//     mainWindow.focus();
//   }
// }

function focusRingover() {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();

    if (process.platform === "darwin") {
      // Use 'pop-up-menu' level so that it doesnâ€™t interfere with the menu's behavior.
      mainWindow.setAlwaysOnTop(true, "pop-up-menu");
      mainWindow.focus();
      setTimeout(() => {
        mainWindow.setAlwaysOnTop(false);
      }, 100);
    } else {
      // Fallback for other platforms.
      mainWindow.setAlwaysOnTop(true);
      mainWindow.focus();
      setTimeout(() => {
        mainWindow.setAlwaysOnTop(false);
      }, 100);
    }
  }
}

// function focusRingover() {
//   if (!mainWindow) return;

//   // Initial state
//   const wasAlwaysOnTop = mainWindow.isAlwaysOnTop();

//   // Focus sequence
//   if (mainWindow.isMinimized()) mainWindow.restore();
//   mainWindow.show();

//   if (process.platform === "win32") {
//     mainWindow.setAlwaysOnTop(true);
//     mainWindow.focus();
//     setTimeout(() => mainWindow.setAlwaysOnTop(wasAlwaysOnTop), 100);
//   } else {
//     mainWindow.setAlwaysOnTop(true);
//     app.focus({ steal: true });
//     setTimeout(() => {
//       mainWindow.setAlwaysOnTop(wasAlwaysOnTop);
//       mainWindow.focus();
//     }, 100);
//   }

//   // Extra macOS activation
//   if (process.platform === "darwin") {
//     app.dock.show().catch(() => { });
//     setTimeout(() => {
//       mainWindow.show();
//       mainWindow.focus();
//     }, 200);
//   }
// }

function translate(word, lng) {
  if (word && lng) {
    return words.find((o) => o.key === word)["value"][lng]
      ? words.find((o) => o.key === word)["value"][lng]
      : "";
  }
  return "";
}

function setIcon(color) {
  switch (color) {
    case "green":
      let icon_path_green = null;
      if (isMac) {
        if (isDark) {
          icon_path_green =
            __dirname +
            "/assets/icons/" +
            process.platform +
            "/dark/logo_white.png";
        } else {
          icon_path_green =
            __dirname +
            "/assets/icons/" +
            process.platform +
            "/light/logo_noir.png";
        }
      } else {
        icon_path_green =
          __dirname + "/assets/icons/" + process.platform + "/tray.png";
      }
      appTray.setImage(icon_path_green);
      break;
    case "red":
      let icon_path_red = null;
      if (isMac) {
        if (isDark) {
          icon_path_red =
            __dirname +
            "/assets/icons/" +
            process.platform +
            "/dark/logo_black.png";
        } else {
          icon_path_red =
            __dirname +
            "/assets/icons/" +
            process.platform +
            "/light/outline_black.png";
        }
      } else {
        icon_path_red = __dirname + "/assets/icons/png/64x64_error.png";
      }
      appTray.setImage(icon_path_red);
      break;
    case "yellow":
      let icon_path_warning = null;
      if (isMac) {
        if (isDark) {
          icon_path_warning =
            __dirname +
            "/assets/icons/" +
            process.platform +
            "/dark/logo_black.png";
        } else {
          icon_path_warning =
            __dirname +
            "/assets/icons/" +
            process.platform +
            "/light/outline_black.png";
        }
      } else {
        icon_path_warning = __dirname + "/assets/icons/png/64x64_warning.png";
      }
      appTray.setImage(icon_path_warning);
      break;
    default:
      break;
  }
}

function showNotification(type) {
  let body_msg = null;
  let is_sms = false;
  let is_call = false;
  if (type) {
    // if (
    //   type !== "Incoming call from  Nouveau contact Ringover" &&
    //   "Llamada entrante de  Nouveau contact Ringover" &&
    //   "Appel entrant de  Nouveau contact Ringover"
    // ) {
    console.log(type);
    let type_notification = type.split(" ")[0] + " " + type.split(" ")[1];
    switch (type_notification) {
      case "Incoming call":
      case "Appel entrant":
      case "Llamada entrante":
      case "Restricted incoming":
      case "Eingehender Anruf":
        is_call = true;
        focusRingover();
        body_msg =
          translate("notification_body_call", user_lang) +
          " " +
          extractMessageNotification(type);
        break;
      case "New message":
      case "Nouveau message":
      case "Nuevo mensaje":
      case "Neue Nachricht":
        is_sms = true;
        body_msg = translate("notification_body_sms", user_lang);
        break;
      default:
        break;
    }

    const options = {
      title: translate("notification_title", user_lang),
      body: body_msg,
      silent: false,
      icon: path.join(__dirname + "/assets/icons/tray.png"),
      hasReply: true,
      replyPlaceholder: "Reply Here",
      sound: false,
      urgency: "critical",
      closeButtonText: "Close Button",
      actions: [
        {
          type: "button",
          text: "Show Button",
        },
      ],
    };

    if (app.isReady()) {
      const customNotification = new Notification(options);
      customNotification.show();

      customNotification.on("click", (event, arg) => {
        if (is_sms) {
          mainWindow.webContents.send("electron-msg", {
            action: "change-page",
            data: "sms",
          });
          if (mainWindow.isMinimized()) {
            mainWindow.restore();
          }
          mainWindow.show();
        } else {
          focusRingover();
        }
      });
      let duration_hide = type_notification === "Incoming call" ? 20000 : 10000;
      setTimeout((_) => {
        customNotification.close();
      }, duration_hide);
    }
    // }
  }
}

app.commandLine.appendSwitch(
  "force-fieldtrials",
  "WebRTC-Audio-Red-For-Opus/Enabled-2/"
);

function extractMessageNotification(message) {
  let deli = null;
  if (message) {
    if (message.includes("from")) {
      deli = "from";
    } else if (message.includes("de")) {
      deli = "de";
    } else if (message.includes("masqu")) {
      return " masqué";
    } else if (message.includes("Restricted")) {
      return " Restricted";
    } else if (message.includes("oculta")) {
      return " oculta";
    }
    return message.slice(message.indexOf(deli) + deli.length);
  }
  return "";
}

function checkForUpdate(url, type = null) {
  if (url) {
    let api_obj = null;
    fetch(url)
      .then((res) => res.json())
      .then((out) => {
        api_obj = out;
        if (checkVersion(api_obj.webapp_v4, check_number_version) === 1) {
          showUpgradePopup();
        } else {
          if (type == "menu") {
            dialog.showMessageBox(mainWindow ? mainWindow : null, {
              message: translate("update_is_ok", user_lang),
            });
          }
        }
      })
      .catch((err) => {
        throw err;
      });
  }
}

function showUpgradePopup() {
  let get_lang = user_lang;

  const options = {
    type: "question",
    buttons: [
      translate("upgrade", user_lang),
      translate("not_upgrade", user_lang),
    ],
    defaultId: 2,
    title: "Question",
    message: translate("new_version", user_lang),
    detail: translate("new_version_help", user_lang),
  };

  dialog
    .showMessageBox(mainWindow ? mainWindow : null, options)
    .then((data) => {
      if (data.response === 0) {
        mainWindow.reload();
      }
    });
}

function createWebSocket() {
  server = ws
    .createServer(function (conn) {
      conn.on("text", function (str) {
        try {
          var message = JSON.parse(str);
        } catch (e) {
          return;
        }
        if (!message || !message.action) return;

        switch (message.action) {
          case "dial":
          case "sendSMS":
          case "powerDial":
            if (!message.number) return;
            if (Array.isArray(message.number)) {
              message.number = [...new Set(message.number)]; // remove duplicate numbers
              message.number = message.number.join(",");
            }
            // Trick for focus
            if (mainWindow.isMinimized()) {
              mainWindow.restore();
            }
            mainWindow.show();
            mainWindow.webContents.send("electron-msg", {
              action: "call-extension",
              data: message,
            });
            focusRingover();
            return;
          case "show":
            if (mainWindow.isMinimized()) {
              mainWindow.restore();
            }
            mainWindow.show();
            break;
        }
      });
      conn.on("close", function (code, reason) {});
    })
    .listen(30580, "127.0.0.1");
}

function destroyWebSocket() {
  server.close();
  server = null;
}

function switchOpenAtLogin() {
  app.setLoginItemSettings({
    openAtLogin: !app.getLoginItemSettings().openAtLogin,
  });
}

function checkVersion(a, b) {
  const x = a.split(".").map((e) => parseInt(e, 10));
  const y = b.split(".").map((e) => parseInt(e, 10));

  for (const i in x) {
    y[i] = y[i] || 0;
    if (x[i] === y[i]) {
      continue;
    } else if (x[i] > y[i]) {
      return 1;
    } else {
      return -1;
    }
  }
  return y.length > x.length ? -1 : 0;
}

app.setAsDefaultProtocolClient("tel");
app.setAsDefaultProtocolClient("callto");

let b = app.setAsDefaultProtocolClient("tel");
let a = app.setAsDefaultProtocolClient("callto");

if (isWindows) {
  registry.set(
    "HKCU\\Software\\Ringover\\Capabilities",
    "ApplicationName",
    "Ringover"
  );
  registry.set(
    "HKCU\\Software\\Ringover\\Capabilities",
    "ApplicationDescription",
    "Ringover"
  );
  registry.set(
    "HKCU\\Software\\Ringover\\Capabilities\\URLAssociations",
    "tel",
    "Ringover.tel"
  );
  registry.set(
    "HKCU\\Software\\Ringover\\Capabilities\\URLAssociations",
    "callto",
    "Ringover.callto"
  );
  registry.set(
    "HKCU\\Software\\Classes\\Ringover.tel\\DefaultIcon",
    "",
    process.execPath
  );
  registry.set(
    "HKCU\\Software\\Classes\\Ringover.callto\\DefaultIcon",
    "",
    process.execPath
  );
  registry.set(
    "HKCU\\Software\\Classes\\Ringover.tel\\shell\\open\\command",
    "",
    `"${process.execPath}" "%1"`
  );
  registry.set(
    "HKCU\\Software\\Classes\\Ringover.callto\\shell\\open\\command",
    "",
    `"${process.execPath}" "%1"`
  );
  registry.set(
    "HKCU\\Software\\RegisteredApplications",
    "Ringover",
    "Software\\Ringover\\Capabilities"
  );
}
function create_menu(user_lang) {
  try {
    ctxMenu = new Menu();
    ctxMenu.append(
      new MenuItem({
        label: translate("copy", user_lang),
        role: "copy",
        accelerator: "CommandOrControl+C",
      })
    );
    ctxMenu.append(
      new MenuItem({
        label: translate("paste", user_lang),
        role: "paste",
        accelerator: "CommandOrControl+V",
      })
    );
    ctxMenu.append(
      new MenuItem({
        label: translate("cut", user_lang),
        role: "cut",
        accelerator: "CommandOrControl+X",
      })
    );
    ctxMenu.append(
      new MenuItem({
        label: translate("cancel", user_lang),
        role: "undo",
        accelerator: "CommandOrControl+Z",
      })
    );
    ctxMenu.append(new MenuItem({ type: "separator" }));
    ctxMenu.append(
      new MenuItem({
        label: translate("format", user_lang),
        submenu: [
          {
            label: translate("small", user_lang),
            click: function () {
              store.set("taille", "small");
              if (isWindows) {
                mainWindow.restore();
                mainWindow.setSize(Width, Height);
                mainWindow.center();
                mainWindow.resizable = true;
              } else {
                mainWindow.resizable = true;
                mainWindow.setSize(Width, Height);
                mainWindow.center();
                mainWindow.resizable = true;
              }
            },
          },
          {
            label: translate("medium", user_lang),
            click: function () {
              store.set("taille", "medium");
              if (isWindows) {
                //1200, 600
                mainWindow.restore();
                mainWindow.setSize(
                  Math.max(1200, parseInt(size_x / 1.5)),
                  Math.max(600, parseInt(size_y / 1.5))
                );
                mainWindow.center();
                mainWindow.resizable = true;
              } else {
                mainWindow.resizable = true;
                //1200, 600
                mainWindow.setSize(
                  Math.max(1200, parseInt(size_x / 1.5)),
                  Math.max(600, parseInt(size_y / 1.5))
                );
                mainWindow.center();
                mainWindow.resizable = true;
              }
            },
          },
          {
            label: translate("full_screen", user_lang),
            visible: isWindows ? false : true,
            click: function () {
              store.set("taille", "full");
              if (!isWindows) {
                mainWindow.resizable = true;
                mainWindow.setSize(size_x, size_y);
                mainWindow.center();
                mainWindow.resizable = true;
              }
            },
          },
        ],
      })
    );

    contextMenuTrayConnected = Menu.buildFromTemplate([
      {
        label: "Ringover",
        click: function () {
          if (
            BrowserWindow.getAllWindows().length === 0 ||
            mainWindow === null
          ) {
            createWindow();
          } else {
            focusRingover();
          }
        },
      },
      { type: "separator" },
      {
        label: translate("getto", user_lang),
        submenu: [
          {
            label: translate("call", user_lang),
            click: function () {
              mainWindow.webContents.send("electron-msg", {
                action: "change-page",
                data: "call-logs",
              });
              if (mainWindow.isMinimized()) {
                mainWindow.restore();
              }
              mainWindow.show();
            },
          },
          {
            label: translate("chat", user_lang),
            click: function () {
              mainWindow.webContents.send("electron-msg", {
                action: "change-page",
                data: "chat",
              });
              if (mainWindow.isMinimized()) {
                mainWindow.restore();
              }
              mainWindow.show();
            },
          },
          {
            label: translate("sms", user_lang),
            click: function () {
              mainWindow.webContents.send("electron-msg", {
                action: "change-page",
                data: "sms",
              });
              if (mainWindow.isMinimized()) {
                mainWindow.restore();
              }
              mainWindow.show();
            },
          },
          {
            label: translate("contacts", user_lang),
            click: function () {
              mainWindow.webContents.send("electron-msg", {
                action: "change-page",
                data: "contacts",
              });
              if (mainWindow.isMinimized()) {
                mainWindow.restore();
              }
              mainWindow.show();
            },
          },
          {
            label: translate("settings", user_lang),
            click: function () {
              mainWindow.webContents.send("electron-msg", {
                action: "change-page",
                data: "settings",
              });
              if (mainWindow.isMinimized()) {
                mainWindow.restore();
              }
              mainWindow.show();
            },
          },
        ],
      },
      {
        label: translate("relaunch", user_lang),
        click: function () {
          app.relaunch();
          app.exit();
        },
      },
      {
        label: translate("reload", user_lang),
        click: function () {
          if (
            BrowserWindow.getAllWindows().length === 0 ||
            mainWindow === null
          ) {
            createWindow();
          } else {
            mainWindow.reload();
          }
        },
      },
      {
        label: translate("settings_desktop", user_lang),
        submenu: [
          {
            label: store.get("hideMenuBar")
              ? translate("hide_menu_bar", user_lang)
              : translate("show_menu_bar", user_lang),
            visible: isWindows || isLinux ? true : false,
            click: function () {
              if (mainWindow) {
                hideMenuBar = !hideMenuBar;
                mainWindow.setMenuBarVisibility(!store.get("hideMenuBar"));
                store.set("hideMenuBar", !store.get("hideMenuBar"));
                appTray.setContextMenu(contextMenuTrayConnectedHideMenuBar);
              }
              create_menu(user_lang);
            },
          },
          {
            label: translate("auto_launch", user_lang),
            click: function () {
              store.set("open_at_start", !store.get("open_at_start"));
              app.setLoginItemSettings({
                openAtLogin: store.get("open_at_start"),
              });
              create_menu(user_lang);
            },
            type: "checkbox",
            checked: store.get("open_at_start"),
          },
          {
            label: translate("pin_to_top", user_lang),
            click: function () {
              store.set("pintotop", !store.get("pintotop"));
              if (store.get("pintotop")) {
                mainWindow.setAlwaysOnTop(true);
                mainWindow.setVisibleOnAllWorkspaces(true);
              } else {
                mainWindow.setAlwaysOnTop(false);
                mainWindow.setVisibleOnAllWorkspaces(false);
              }
              create_menu(user_lang);
              // app.relaunch();
              // app.exit();
            },
            type: "checkbox",
            checked: store.get("pintotop"),
          },
          {
            label: translate("cpu_notify", user_lang),
            click: function () {
              if (typeof store.get("show_cpu_notif") != "undefined") {
                store.set("show_cpu_notif", !store.get("show_cpu_notif"));
              }
              create_menu(user_lang);
              getStats();
            },
            type: "checkbox",
            checked:
              typeof store.get("show_cpu_notif") != "undefined"
                ? store.get("show_cpu_notif")
                : true,
          },
          {
            label: translate("open_link_with", user_lang),
            submenu: [
              {
                label: translate("browser", user_lang),
                click: function () {
                  store.set("open_external_url_browser", "browser");
                  create_menu(user_lang);
                },
                type: "radio",
                checked:
                  typeof store.get("open_external_url_browser") !=
                    "undefined" &&
                  store.get("open_external_url_browser") == "browser"
                    ? true
                    : false,
              },
              {
                label: "App",
                click: function () {
                  store.set("open_external_url_browser", "desktop");
                  create_menu(user_lang);
                },
                type: "radio",
                checked:
                  typeof store.get("open_external_url_browser") !=
                    "undefined" &&
                  store.get("open_external_url_browser") == "desktop"
                    ? true
                    : false,
              },
            ],
          },
        ],
      },
      // {
      //   label: 'url de base ' + store.get('url_base'),
      //   click: function () {
      //     changeUrlBase();
      //   }
      // },
      {
        label: translate("clear_cache_and_restart", user_lang),
        click: async function () {
          await session.defaultSession.clearStorageData();
          app.relaunch();
          app.exit();
        },
      },
      {
        label: translate("close", user_lang),
        click: function () {
          app.isQuiting = true;
          appQuitFromTray = true;
          quit();
        },
      },
    ]);

    contextMenuTrayConnectedHideMenuBar = Menu.buildFromTemplate([
      {
        label: "Ringover",
        click: function () {
          if (
            BrowserWindow.getAllWindows().length === 0 ||
            mainWindow === null
          ) {
            createWindow();
          } else {
            focusRingover();
          }
        },
      },
      { type: "separator" },
      {
        label: translate("getto", user_lang),
        submenu: [
          {
            label: translate("call", user_lang),
            click: function () {
              mainWindow.webContents.send("electron-msg", {
                action: "change-page",
                data: "call-logs",
              });
              if (mainWindow.isMinimized()) {
                mainWindow.restore();
              }
              mainWindow.show();
            },
          },
          {
            label: translate("chat", user_lang),
            click: function () {
              mainWindow.webContents.send("electron-msg", {
                action: "change-page",
                data: "chat",
              });
              if (mainWindow.isMinimized()) {
                mainWindow.restore();
              }
              mainWindow.show();
            },
          },
          {
            label: translate("sms", user_lang),
            click: function () {
              mainWindow.webContents.send("electron-msg", {
                action: "change-page",
                data: "sms",
              });
              if (mainWindow.isMinimized()) {
                mainWindow.restore();
              }
              mainWindow.show();
            },
          },
          {
            label: translate("contacts", user_lang),
            click: function () {
              mainWindow.webContents.send("electron-msg", {
                action: "change-page",
                data: "contacts",
              });
              if (mainWindow.isMinimized()) {
                mainWindow.restore();
              }
              mainWindow.show();
            },
          },
          {
            label: translate("settings", user_lang),
            click: function () {
              mainWindow.webContents.send("electron-msg", {
                action: "change-page",
                data: "settings",
              });
              if (mainWindow.isMinimized()) {
                mainWindow.restore();
              }
              mainWindow.show();
            },
          },
        ],
      },
      {
        label: translate("relaunch", user_lang),
        click: function () {
          app.relaunch();
          app.exit();
        },
      },
      {
        label: translate("reload", user_lang),
        click: function () {
          if (
            BrowserWindow.getAllWindows().length === 0 ||
            mainWindow === null
          ) {
            createWindow();
          } else {
            mainWindow.reload();
          }
        },
      },
      {
        label: translate("settings_desktop", user_lang),
        submenu: [
          {
            label: store.get("hideMenuBar")
              ? translate("hide_menu_bar", user_lang)
              : translate("show_menu_bar", user_lang),
            visible: isWindows || isLinux ? true : false,
            click: function () {
              if (mainWindow) {
                hideMenuBar = !hideMenuBar;
                mainWindow.setMenuBarVisibility(!store.get("hideMenuBar"));
                store.set("hideMenuBar", !store.get("hideMenuBar"));
                appTray.setContextMenu(contextMenuTrayConnectedHideMenuBar);
              }
              create_menu(user_lang);
            },
          },
          {
            label: translate("auto_launch", user_lang),
            click: function () {
              store.set("open_at_start", !store.get("open_at_start"));
              app.setLoginItemSettings({
                openAtLogin: store.get("open_at_start"),
              });
              create_menu(user_lang);
            },
            type: "checkbox",
            checked: store.get("open_at_start"),
          },
          {
            label: translate("pin_to_top", user_lang),
            click: function () {
              store.set("pintotop", !store.get("pintotop"));
              if (store.get("pintotop")) {
                mainWindow.setAlwaysOnTop(true);
                mainWindow.setVisibleOnAllWorkspaces(true);
              } else {
                mainWindow.setAlwaysOnTop(false);
                mainWindow.setVisibleOnAllWorkspaces(false);
              }
              create_menu(user_lang);
              // app.relaunch();
              // app.exit();
            },
            type: "checkbox",
            checked: store.get("pintotop"),
          },
          {
            label: translate("cpu_notify", user_lang),
            click: function () {
              if (typeof store.get("show_cpu_notif") != "undefined") {
                store.set("show_cpu_notif", !store.get("show_cpu_notif"));
              }
              create_menu(user_lang);
              getStats();
            },
            type: "checkbox",
            checked:
              typeof store.get("show_cpu_notif") != "undefined"
                ? store.get("show_cpu_notif")
                : true,
          },
          {
            label: translate("open_link_with", user_lang),
            submenu: [
              {
                label: translate("browser", user_lang),
                click: function () {
                  store.set("open_external_url_browser", "browser");
                  create_menu(user_lang);
                },
                type: "radio",
                checked:
                  typeof store.get("open_external_url_browser") !=
                    "undefined" &&
                  store.get("open_external_url_browser") == "browser"
                    ? true
                    : false,
              },
              {
                label: "App",
                click: function () {
                  store.set("open_external_url_browser", "desktop");
                  create_menu(user_lang);
                },
                type: "radio",
                checked:
                  typeof store.get("open_external_url_browser") !=
                    "undefined" &&
                  store.get("open_external_url_browser") == "desktop"
                    ? true
                    : false,
              },
            ],
          },
        ],
      },
      // {
      //   label: 'url de base ' + store.get('url_base'),
      //   click: function () {
      //     changeUrlBase();
      //   }
      // },
      {
        label: translate("clear_cache_and_restart", user_lang),
        click: async function () {
          await session.defaultSession.clearStorageData();
          app.relaunch();
          app.exit();
        },
      },
      {
        label: translate("close", user_lang),
        click: function () {
          app.isQuiting = true;
          appQuitFromTray = true;
          quit();
        },
      },
    ]);

    contextMenuTrayDisconnectedHideMenuBar = Menu.buildFromTemplate([
      {
        label: "Ringover",
        click: function () {
          if (
            BrowserWindow.getAllWindows().length === 0 ||
            mainWindow === null
          ) {
            createWindow();
          } else {
            focusRingover();
          }
        },
      },
      {
        label: translate("relaunch", user_lang),
        click: function () {
          app.relaunch();
          app.exit();
        },
      },
      {
        label: translate("reload", user_lang),
        click: function () {
          if (
            BrowserWindow.getAllWindows().length === 0 ||
            mainWindow === null
          ) {
            createWindow();
          } else {
            mainWindow.reload();
          }
        },
      },
      {
        label: translate("settings_desktop", user_lang),
        submenu: [
          {
            label: store.get("hideMenuBar")
              ? translate("hide_menu_bar", user_lang)
              : translate("show_menu_bar", user_lang),
            visible: isWindows || isLinux ? true : false,
            click: function () {
              if (mainWindow) {
                hideMenuBar = !hideMenuBar;
                mainWindow.setMenuBarVisibility(!store.get("hideMenuBar"));
                store.set("hideMenuBar", !store.get("hideMenuBar"));
                appTray.setContextMenu(contextMenuTrayConnectedHideMenuBar);
              }
              create_menu(user_lang);
            },
          },
          {
            label: translate("auto_launch", user_lang),
            click: function () {
              store.set("open_at_start", !store.get("open_at_start"));
              app.setLoginItemSettings({
                openAtLogin: store.get("open_at_start"),
              });
              create_menu(user_lang);
            },
            type: "checkbox",
            checked: store.get("open_at_start"),
          },
          {
            label: translate("pin_to_top", user_lang),
            click: function () {
              store.set("pintotop", !store.get("pintotop"));
              if (store.get("pintotop")) {
                mainWindow.setAlwaysOnTop(true);
                mainWindow.setVisibleOnAllWorkspaces(true);
              } else {
                mainWindow.setAlwaysOnTop(false);
                mainWindow.setVisibleOnAllWorkspaces(false);
              }
              create_menu(user_lang);
              // app.relaunch();
              // app.exit();
            },
            type: "checkbox",
            checked: store.get("pintotop"),
          },
          {
            label: translate("cpu_notify", user_lang),
            click: function () {
              if (typeof store.get("show_cpu_notif") != "undefined") {
                store.set("show_cpu_notif", !store.get("show_cpu_notif"));
              }
              create_menu(user_lang);
              getStats();
            },
            type: "checkbox",
            checked:
              typeof store.get("show_cpu_notif") != "undefined"
                ? store.get("show_cpu_notif")
                : true,
          },
          {
            label: translate("open_link_with", user_lang),
            submenu: [
              {
                label: translate("browser", user_lang),
                click: function () {
                  store.set("open_external_url_browser", "browser");
                  create_menu(user_lang);
                },
                type: "radio",
                checked:
                  typeof store.get("open_external_url_browser") !=
                    "undefined" &&
                  store.get("open_external_url_browser") == "browser"
                    ? true
                    : false,
              },
              {
                label: "App",
                click: function () {
                  store.set("open_external_url_browser", "desktop");
                  create_menu(user_lang);
                },
                type: "radio",
                checked:
                  typeof store.get("open_external_url_browser") !=
                    "undefined" &&
                  store.get("open_external_url_browser") == "desktop"
                    ? true
                    : false,
              },
            ],
          },
        ],
      },
      // {
      //   label: 'url de base ' + store.get('url_base'),
      //   click: function () {
      //     changeUrlBase();
      //   }
      // },
      {
        label: translate("clear_cache_and_restart", user_lang),
        click: async function () {
          await session.defaultSession.clearStorageData();
          app.relaunch();
          app.exit();
        },
      },
      {
        label: translate("close", user_lang),
        click: function () {
          appQuitFromTray = true;
          quit();
        },
      },
    ]);

    contextMenuTrayDisconnected = Menu.buildFromTemplate([
      {
        label: "Ringover",
        click: function () {
          if (
            BrowserWindow.getAllWindows().length === 0 ||
            mainWindow === null
          ) {
            createWindow();
          } else {
            focusRingover();
          }
        },
      },
      {
        label: translate("relaunch", user_lang),
        click: function () {
          app.relaunch();
          app.exit();
        },
      },
      {
        label: translate("reload", user_lang),
        click: function () {
          if (
            BrowserWindow.getAllWindows().length === 0 ||
            mainWindow === null
          ) {
            createWindow();
          } else {
            mainWindow.reload();
          }
        },
      },
      {
        label: translate("settings_desktop", user_lang),
        submenu: [
          {
            label: store.get("hideMenuBar")
              ? translate("hide_menu_bar", user_lang)
              : translate("show_menu_bar", user_lang),
            visible: isWindows || isLinux ? true : false,
            click: function () {
              if (mainWindow) {
                hideMenuBar = !hideMenuBar;
                mainWindow.setMenuBarVisibility(!store.get("hideMenuBar"));
                store.set("hideMenuBar", !store.get("hideMenuBar"));
                appTray.setContextMenu(contextMenuTrayConnectedHideMenuBar);
              }
              create_menu(user_lang);
            },
          },
          {
            label: translate("auto_launch", user_lang),
            click: function () {
              store.set("open_at_start", !store.get("open_at_start"));
              app.setLoginItemSettings({
                openAtLogin: store.get("open_at_start"),
              });
              create_menu(user_lang);
            },
            type: "checkbox",
            checked: store.get("open_at_start"),
          },
          {
            label: translate("pin_to_top", user_lang),
            click: function () {
              store.set("pintotop", !store.get("pintotop"));
              if (store.get("pintotop")) {
                mainWindow.setAlwaysOnTop(true);
                mainWindow.setVisibleOnAllWorkspaces(true);
              } else {
                mainWindow.setAlwaysOnTop(false);
                mainWindow.setVisibleOnAllWorkspaces(false);
              }
              create_menu(user_lang);
              // app.relaunch();
              // app.exit();
            },
            type: "checkbox",
            checked: store.get("pintotop"),
          },
          {
            label: translate("cpu_notify", user_lang),
            click: function () {
              if (typeof store.get("show_cpu_notif") != "undefined") {
                store.set("show_cpu_notif", !store.get("show_cpu_notif"));
              }
              create_menu(user_lang);
              getStats();
            },
            type: "checkbox",
            checked:
              typeof store.get("show_cpu_notif") != "undefined"
                ? store.get("show_cpu_notif")
                : true,
          },
          {
            label: translate("open_link_with", user_lang),
            submenu: [
              {
                label: translate("browser", user_lang),
                click: function () {
                  store.set("open_external_url_browser", "browser");
                  create_menu(user_lang);
                },
                type: "radio",
                checked:
                  typeof store.get("open_external_url_browser") !=
                    "undefined" &&
                  store.get("open_external_url_browser") == "browser"
                    ? true
                    : false,
              },
              {
                label: "App",
                click: function () {
                  store.set("open_external_url_browser", "desktop");
                  create_menu(user_lang);
                },
                type: "radio",
                checked:
                  typeof store.get("open_external_url_browser") !=
                    "undefined" &&
                  store.get("open_external_url_browser") == "desktop"
                    ? true
                    : false,
              },
            ],
          },
        ],
      },
      // {
      //   label: 'url de base ' + store.get('url_base'),
      //   click: function () {
      //     changeUrlBase();
      //   }
      // },
      {
        label: translate("clear_cache_and_restart", user_lang),
        click: async function () {
          await session.defaultSession.clearStorageData();
          app.relaunch();
          app.exit();
        },
      },
      {
        label: translate("close", user_lang),
        click: function () {
          appQuitFromTray = true;
          quit();
        },
      },
    ]);

    appTray.setContextMenu(contextMenuTrayConnected);
    appTray.setToolTip("Ringover");
    appTray.on("click", function () {
      focusRingover();
    });

    const template = [
      // { role: 'appMenu' }
      ...(isMac
        ? [
            {
              label: app.name,
              submenu: [
                { role: "about" },
                { type: "separator" },
                { role: "services" },
                { type: "separator" },
                { role: "hide" },
                { role: "hideothers" },
                { role: "unhide" },
                { type: "separator" },
                { role: "quit" },
              ],
            },
          ]
        : []),
      // { role: 'editMenu' }
      {
        label: translate("edit", user_lang),
        submenu: [
          { label: translate("cancel", user_lang), role: "undo" },
          { type: "separator" },
          { label: translate("cut", user_lang), role: "cut" },
          { label: translate("copy", user_lang), role: "copy" },
          { label: translate("paste", user_lang), role: "paste" },
          { label: translate("delete", user_lang), role: "delete" },
          { type: "separator" },
          { label: translate("selectAll", user_lang), role: "selectAll" },
        ],
      },
      // { role: 'viewMenu' }
      {
        label: translate("view", user_lang),
        submenu: [
          // { role: "toggleDevTools" },
          {
            label: translate("relaunch", user_lang),
            click: function () {
              app.relaunch();
              app.exit();
            },
          },
          { label: translate("reload", user_lang), role: "reload" },
          ...(isDev
            ? [
                //{ role: 'toggleDevTools' },
                { role: "forceReload" },
              ]
            : ""),
          // { label: 'Console', role: 'toggleDevTools', accelerator: "F12" },

          { label: translate("reload", user_lang), type: "separator" },
          { label: translate("zoom_in", user_lang), role: "zoomIn" },
          {
            label: translate("zoom_out", user_lang),
            role: "zoomOut",
            accelerator: "CommandOrControl+O",
          },
          {
            type: "separator",
          },
          {
            label: translate("auto_launch", user_lang),
            click: function () {
              store.set("open_at_start", !store.get("open_at_start"));
              app.setLoginItemSettings({
                openAtLogin: store.get("open_at_start"),
              });
              create_menu(user_lang);
            },
            type: "checkbox",
            checked: store.get("open_at_start"),
          },
          {
            label: translate("pin_to_top", user_lang),
            click: function () {
              store.set("pintotop", !store.get("pintotop"));
              if (store.get("pintotop")) {
                mainWindow.setAlwaysOnTop(true);
                mainWindow.setVisibleOnAllWorkspaces(true);
              } else {
                mainWindow.setAlwaysOnTop(false);
                mainWindow.setVisibleOnAllWorkspaces(false);
              }
              create_menu(user_lang);
              // app.relaunch();
              // app.exit();
            },
            type: "checkbox",
            checked: store.get("pintotop"),
          },
          {
            label: translate("cpu_notify", user_lang),
            click: function () {
              if (typeof store.get("show_cpu_notif") != "undefined") {
                store.set("show_cpu_notif", !store.get("show_cpu_notif"));
              }
              create_menu(user_lang);
              getStats();
            },
            type: "checkbox",
            checked:
              typeof store.get("show_cpu_notif") != "undefined"
                ? store.get("show_cpu_notif")
                : true,
          },
          {
            label: translate("open_link_with", user_lang),
            submenu: [
              {
                label: translate("browser", user_lang),
                click: function () {
                  store.set("open_external_url_browser", "browser");
                  create_menu(user_lang);
                },
                type: "radio",
                checked:
                  typeof store.get("open_external_url_browser") !=
                    "undefined" &&
                  store.get("open_external_url_browser") == "browser"
                    ? true
                    : false,
              },
              {
                label: "App",
                click: function () {
                  store.set("open_external_url_browser", "desktop");
                  create_menu(user_lang);
                },
                type: "radio",
                checked:
                  typeof store.get("open_external_url_browser") !=
                    "undefined" &&
                  store.get("open_external_url_browser") == "desktop"
                    ? true
                    : false,
              },
            ],
          },
        ],
      },
      {
        label: translate("help", user_lang),
        submenu: [
          {
            label: translate("about", user_lang),
            click: function () {
              if (!aboutWindow) {
                aboutWindow = new BrowserWindow({
                  width: 340,
                  height: 400,
                  parent: mainWindow,
                  backgroundThrottling: false,
                  show: false,
                  minimizable: false,
                  resizable: false,
                  maximizable: false,
                  alwaysOnTop: true,
                  icon: isMac
                    ? path.join(__dirname, "/assets/icons/darwin/app.icns")
                    : path.join(__dirname, "assets/icons/png/64x64.png"),
                });
                aboutWindow.on("close", (_) => {
                  aboutWindow = null;
                  if (mainWindow && !app.isQuiting) mainWindow.show();
                });
                aboutWindow.loadFile(__dirname + "/pages/about.html", {
                  search: "myringover=" + myringoverversion,
                });
                // aboutWindow.loadURL("data:text/html;charset=utf-8," + __dirname + '/assets/about.html'
              }
              aboutWindow.setMenu(null);
              aboutWindow.show();
            },
          },
          {
            label: translate("support", user_lang),
            click: function () {
              let ext = null;
              switch (user_lang) {
                case "en":
                  ext = "com";
                  break;
                case "fr":
                  ext = "fr";
                  break;
                case "es":
                  ext = "es";
                  break;
                default:
                  ext = "com";
                  break;
              }
              return shell.openExternal("https://ringover." + ext + "/support");
            },
          },
          {
            label: translate("check_for_update", user_lang),
            click: function () {
              checkForUpdate("https://api.ringover.com/v2/versions", "menu");
            },
          },
          {
            label: translate("clear_cache_and_restart", user_lang),
            click: async function () {
              await session.defaultSession.clearStorageData();
              app.relaunch();
              app.exit();
            },
          },
        ],
      },
    ];

    const minimize = {
      label: translate("minimize", user_lang),
      role: "minimize",
    };

    const formatMenu = {
      label: translate("format", user_lang),
      submenu: [
        {
          label: translate("small", user_lang),
          click: function () {
            store.set("taille", "small");
            if (isWindows) {
              mainWindow.restore();
              mainWindow.setSize(Width, Height);
              mainWindow.center();
              mainWindow.resizable = true;
            } else {
              mainWindow.resizable = true;
              mainWindow.setSize(Width, Height);
              mainWindow.center();
              mainWindow.resizable = true;
            }
          },
        },
        {
          label: translate("medium", user_lang),
          click: function () {
            store.set("taille", "medium");
            if (isWindows) {
              //1200, 600
              mainWindow.restore();
              mainWindow.setSize(
                Math.max(1200, parseInt(size_x / 1.5)),
                Math.max(600, parseInt(size_y / 1.5))
              );
              mainWindow.center();
              mainWindow.resizable = true;
            } else {
              mainWindow.resizable = true;
              //1200, 600
              mainWindow.setSize(
                Math.max(1200, parseInt(size_x / 1.5)),
                Math.max(600, parseInt(size_y / 1.5))
              );
              mainWindow.center();
              mainWindow.resizable = true;
            }
          },
        },
        {
          label: translate("full_screen", user_lang),
          visible: isWindows ? false : true,
          click: function () {
            store.set("taille", "full");
            if (!isWindows) {
              mainWindow.resizable = true;
              mainWindow.setSize(size_x, size_y);
              mainWindow.center();
              mainWindow.resizable = true;
            }
          },
        },
      ],
    };

    let windowMenu;

    if (isMac) {
      windowMenu = {
        label: translate("window", user_lang),
        role: "window",
        submenu: [
          formatMenu,
          { role: "minimize" },
          { role: "zoom" },
          { type: "separator" },
          { role: "front", label: translate("all_window_front", user_lang) },
        ],
      };
    } else {
      windowMenu = {
        label: translate("window", user_lang),
        submenu: [
          minimize,
          formatMenu,
          { type: "separator" },
          {
            label: translate("close", user_lang),
            click: function () {
              quit();
            },
          },
        ],
      };
    }

    template.splice(template.length - 1, 0, windowMenu);

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    mainWindow.webContents.on("context-menu", function (e, params) {
      ctxMenu.popup(mainWindow, params.x, params.y);
    });
  } catch (err) {
    console.log("Error while creating menu: ", err);
  }
}

app.on("before-quit", () => (willQuitApp = true));
// Handle app arguments like ./ringover --call 0606060606 or ./ringover --settings (will open settings page)
// This will be used for the windows task menu
function handleAppArguments(argv) {
  // Check if argv containts a phone number, if so, dial it
  let number = null;

  // --call
  const index = argv.indexOf("--call");
  if (index > -1) {
    number = argv[index + 1];
  }
  // tel:
  // callto:
  for (let arg of argv) {
    let ext = null;
    if (arg.indexOf("tel:") === 0) {
      ext = "tel:";
    }
    if (arg.indexOf("callto:") === 0) {
      ext = "callto:";
    }
    if (ext) number = arg.replace(ext, "");
  }

  if (number) {
    var message_number = { action: "dial", number: number };
    mainWindow.webContents.send("electron-msg", {
      action: "call-extension",
      data: message_number,
    });

    focusRingover();
  }
}

function handleUpdateError() {
  if (!mainWindow) return;
  // mainWindow.webContents.send('electron-msg', {
  //     action: "app-update-failed"
  // });
}
function updateFetchingLoop() {
  setTimeout(() => {
    try {
      autoUpdater.checkForUpdates();
    } catch (err) {
      console.log(err);
    }
    updateFetchingLoop();
  }, 3600 * 2 * 1000); // 2 hours
}

function quit() {
  app.isQuiting = true;
  if (!isRestarting && hasUpdate && updateReady) {
    autoUpdater.quitAndInstall(true);
    return;
  }
  app.quit();
}

function changeUrlBase() {
  let selectOptions;
  var urlBase = store.get("url_base");
  if (
    urlBase === "https://app.ringover.com" ||
    urlBase === "https://app.ringover.com/"
  ) {
    selectOptions = [
      "https://app.ringover.com/",
      "https://jimmy-webapp.dev145.scw.ringover.net/",
      "https://tests-webapp.dev145.scw.ringover.net",
    ];
  } else if (
    urlBase === "https://jimmy-webapp.dev145.scw.ringover.net/" ||
    urlBase === "https://jimmy-webapp.dev145.scw.ringover.net"
  ) {
    selectOptions = [
      "https://jimmy-webapp.dev145.scw.ringover.net/",
      "https://app.ringover.com/",
      "https://tests-webapp.dev145.scw.ringover.net",
    ];
  } else if (
    urlBase === "https://tests-webapp.dev145.scw.ringover.net" ||
    urlBase === "https://tests-webapp.dev145.scw.ringover.net/"
  ) {
    selectOptions = [
      "https://tests-webapp.dev145.scw.ringover.net",
      "https://jimmy-webapp.dev145.scw.ringover.net/",
      "https://app.ringover.com/",
    ];
  } else {
    selectOptions = [
      "https://app.ringover.com/",
      "https://jimmy-webapp.dev145.scw.ringover.net/",
      "https://tests-webapp.dev145.scw.ringover.net",
    ];
  }

  let options = {
    title: "Prompt avec Select",
    type: "select",
    label: "Choisissez une option :",
    selectOptions: selectOptions,
  };

  prompt(options, mainWindow)
    .then((response) => {
      if (response === null) {
        console.log("error.");
      } else {
        const selectedIndex = parseInt(response, 10); // Convertir la réponse en nombre entier
        const selectedOption = options.selectOptions[selectedIndex];
        store.set("url_base", selectedOption);
        app.relaunch();
        app.exit();
      }
    })
    .catch((err) => {
      console.error("Erreur lors de la boîte de dialogue prompt :", err);
    });
}
