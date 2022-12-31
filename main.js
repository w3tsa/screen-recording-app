const {
  app,
  BrowserWindow,
  desktopCapturer,
  ipcMain,
  Menu,
  dialog,
  Tray,
} = require("electron");

if (require("electron-squirrel-startup")) app.quit();
// this should be placed at top of main.js to handle setup events quickly
if (handleSquirrelEvent()) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
  return;
}

function handleSquirrelEvent() {
  if (process.argv.length === 1) {
    return false;
  }

  const ChildProcess = require("child_process");
  const path = require("path");

  const appFolder = path.resolve(process.execPath, "..");
  const rootAtomFolder = path.resolve(appFolder, "..");
  const updateDotExe = path.resolve(path.join(rootAtomFolder, "Update.exe"));
  const exeName = path.basename(process.execPath);

  const spawn = function (command, args) {
    let spawnedProcess, error;

    try {
      spawnedProcess = ChildProcess.spawn(command, args, { detached: true });
    } catch (error) {}

    return spawnedProcess;
  };

  const spawnUpdate = function (args) {
    return spawn(updateDotExe, args);
  };

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case "--squirrel-install":
    case "--squirrel-updated":
      // Optionally do things such as:
      // - Add your .exe to the PATH
      // - Write to the registry for things like file associations and
      //   explorer context menus

      // Install desktop and start menu shortcuts
      spawnUpdate(["--createShortcut", exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case "--squirrel-uninstall":
      // Undo anything you did in the --squirrel-install and
      // --squirrel-updated handlers

      // Remove desktop and start menu shortcuts
      spawnUpdate(["--removeShortcut", exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case "--squirrel-obsolete":
      // This is called on the outgoing version of your app before
      // we update to the new version - it's the opposite of
      // --squirrel-updated

      app.quit();
      return true;
  }
}

const path = require("path");
const { writeFile } = require("fs");
const createWindow = () => {
  const appIcon = new Tray(path.join(__dirname, "app_icon.ico"));
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: false,
    },
    icon: path.join(__dirname, "icon.ico"),
  });

  ipcMain.handle("sources", async (event) => {
    const result = await desktopCapturer.getSources({
      types: ["window", "screen"],
    });

    return result;
  });

  ipcMain.on("show-context-menu", (event, inputSources) => {
    let template = [];

    for (let source of inputSources) {
      if (source.display_id) {
        template.push({
          label: source.name,
          type: "checkbox",
          click: () => {
            event.sender.send("context-menu-command", source.name, source.id);
          },
        });
      }
    }

    ipcMain.on("dialog-content", (event, args, buffer) => {
      dialog
        .showSaveDialog({
          buttonLabel: "Save video",
          defaultPath: `vid-${Date.now()}.webm`,
        })
        .then((result) => {
          writeFile(result.filePath, buffer, () =>
            console.log("video saved successfully!")
          );
        });
    });
    // const template = [
    //   {
    //     label: name,
    //     click: () => {
    //       event.sender.send("context-menu-command", name);
    //     },
    //   },
    //   { type: "separator" },
    //   { label: name, type: "checkbox", checked: true },
    // ];
    const menu = Menu.buildFromTemplate(template);
    menu.popup(BrowserWindow.fromWebContents(event.sender));
  });

  // win.webContents.openDevTools();
  win.loadFile("index.html");
};
app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
