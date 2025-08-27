require("dotenv").config();
const { notarize } = require("@electron/notarize");

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== "darwin") {
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  return await notarize({
    appBundleId: "com.ringover.desktop",
    appPath: `${appOutDir}/${appName}.app`,
    teamId: process.env.npm_package_config_TEAMID,
    appleId: process.env.npm_package_config_APPLEID,
    appleIdPassword: process.env.npm_package_config_APPLEIDPASS,
  });
};
