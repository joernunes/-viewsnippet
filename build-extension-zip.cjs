const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");

async function generateExtensionZip() {
  const zip = new JSZip();
  const extensionDir = path.join(__dirname, "extension");

  function addFolderToZip(folderPath, zipFolder) {
    const files = fs.readdirSync(folderPath);
    for (const file of files) {
      const fullPath = path.join(folderPath, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        const subFolder = zipFolder.folder(file);
        addFolderToZip(fullPath, subFolder);
      } else {
        const content = fs.readFileSync(fullPath);
        zipFolder.file(file, content);
      }
    }
  }

  addFolderToZip(extensionDir, zip);

  const content = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

  const rootZipPath = path.join(__dirname, "edge-sidepanel-inspector-extension.zip");
  fs.writeFileSync(rootZipPath, content);

  const publicDir = path.join(__dirname, "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const publicZipPath = path.join(publicDir, "edge-sidepanel-inspector-extension.zip");
  fs.writeFileSync(publicZipPath, content);

  console.log("Extension ZIP generated successfully at:", rootZipPath, "and", publicZipPath);
}

generateExtensionZip().catch(console.error);
