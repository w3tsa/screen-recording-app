module.exports = {
  packagerConfig: { icon: "./app_icon" },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        // iconUrl: "./app_icon.ico",
        icon: "./app_icon.ico",
        // The ICO file to use as the icon for the generated Setup.exe
        setupIcon: "./app_icon.ico",
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-deb",
      config: {},
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {},
    },
  ],
};
