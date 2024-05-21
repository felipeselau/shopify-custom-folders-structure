// Primeira Rotina: Copiar os arquivos da raíz para src

const fs = require("fs");
const path = require("path");

const folderName = process.env.TARGET_FOLDER;
const folderPath = `./${folderName}`;

console.log(`Pasta Raíz: ${folderPath}`);

if (!fs.existsSync(folderPath)) {
  throw new Error("Pasta Raíz não encontrada");
}

// copia os arquivos da pasta sections
const sectionFolder = fs.readdirSync(`${folderPath}/sections`);
if (!fs.existsSync("./src/sections")) {
  fs.mkdirSync("./src/sections");
}
sectionFolder.forEach((file) => {
  const filePath = path.resolve(`${folderPath}/sections/${file}`);
  const fileName = file.split(".")[0];
  let targetFolderPath = `./src/sections/${fileName}`;

  if (!fs.existsSync(targetFolderPath)) {
    fs.mkdirSync(targetFolderPath);
  }
  fs.copyFileSync(filePath, `${targetFolderPath}/${file}`);
});

// copia os arquivos da pasta snippets
const snippetsFolder = fs.readdirSync(`${folderPath}/snippets`);
if (!fs.existsSync("./src/snippets")) {
  fs.mkdirSync("./src/snippets");
}
snippetsFolder.forEach((file) => {
  const filePath = path.resolve(`${folderPath}/snippets/${file}`);
  const fileName = file.split(".")[0];
  let targetFolderPath = `./src/snippets/${fileName}`;

  if (!fs.existsSync(targetFolderPath)) {
    fs.mkdirSync(targetFolderPath);
  }
  fs.copyFileSync(filePath, `${targetFolderPath}/${file}`);
});

// copia os assets para suas respectivas pastas
// arquivo começando com 'component' -> snippets
// arquivo começando com 'section' -> sections
const assetsFolder = fs.readdirSync(`${folderPath}/assets`);
if (!fs.existsSync("./src/assets")) {
  fs.mkdirSync("./src/assets");
}
assetsFolder.forEach((file) => {
  const filePath = path.resolve(`${folderPath}/assets/${file}`);
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
