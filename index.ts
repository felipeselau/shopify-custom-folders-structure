// Primeira Rotina: Copiar os arquivos da raíz para src

const fs = require("fs");
const path = require("path");

const folderName = process.env.TARGET_FOLDER;
const rootPath = `./${folderName}`;

console.log(`Pasta Raíz: ${rootPath}`);

if (!fs.existsSync(rootPath)) {
  throw new Error("Pasta Raíz não encontrada");
}

// copia os arquivos da pasta sections e snippets
copyContentsOfFolder(rootPath, "sections");
copyContentsOfFolder(rootPath, "snippets");

// copia os assets para suas respectivas pastas
// arquivo começando com 'component' -> snippets
// arquivo começando com 'section' -> sections
const assetsFolder = fs.readdirSync(`${rootPath}/assets`);
if (!fs.existsSync("./src/assets")) {
  fs.mkdirSync("./src/assets");
}
assetsFolder.forEach((file) => {
  const filePath = path.resolve(`${rootPath}/assets/${file}`);
  const fileName = file.split(".")[0];
  const prefix = fileName.split("-")[0];
  const sufix = fileName.substring(prefix.length + 1);
  let targetFolderPath = "";

  switch (prefix) {
    case "section":
      targetFolderPath = `./src/sections/${sufix}`;
      break;
    case "component":
      targetFolderPath = `./src/snippets/${sufix}`;
      break;
    default:
      let fileExtension = file.split(".")[1];
      targetFolderPath = `./src/assets`;

      if (fileExtension == "js") targetFolderPath += "/js";
      if (fileExtension == "css") targetFolderPath += "/css";
      break;
  }

  if (!fs.existsSync(targetFolderPath) && targetFolderPath != "") {
    fs.mkdirSync(targetFolderPath);
  }

  fs.copyFileSync(filePath, `${targetFolderPath}/${file}`);
});
console.log("Pasta 'assets' copiada com sucesso");

function copyContentsOfFolder(rootFolderPath, sourceFolderName){
    const selectedFolder = fs.readdirSync(`${rootFolderPath}/${sourceFolderName}`);
    if (!fs.existsSync(`./src/${sourceFolderName}`)) {
      fs.mkdirSync(`./src/${sourceFolderName}`);
    }

    selectedFolder.forEach((file) => {
      const filePath = path.resolve(`${rootFolderPath}/${sourceFolderName}/${file}`);
      const fileName = file.split(".")[0];
      let targetFolderPath = `./src/${sourceFolderName}/${fileName}`;

      if (!fs.existsSync(targetFolderPath)) {
        fs.mkdirSync(targetFolderPath);
      }
      fs.copyFileSync(filePath, `${targetFolderPath}/${file}`);
    });
    console.log(`Pasta '${sourceFolderName}' copiada com sucesso`);
}