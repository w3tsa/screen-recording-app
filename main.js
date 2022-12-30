const {
  app,
  BrowserWindow,
  desktopCapturer,
  ipcMain,
  Menu,
  dialog,
} = require("electron");
const path = require("path");
const { writeFile } = require("fs");

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: false,
    },
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

  win.webContents.openDevTools();
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
