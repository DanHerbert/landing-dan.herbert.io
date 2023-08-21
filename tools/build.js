#!/usr/bin/node

import appRoot from "app-root-path";
import pug from "pug";
import stylus from "stylus";
import { promisify } from "node:util";
import { promises as fs } from "node:fs";

const PUB_ROOT = `${appRoot}/public`;
const SRC_ROOT = `${appRoot}/src`;

export async function buildSite() {
  await fs.mkdir(PUB_ROOT, { recursive: true });
  console.info("Ensured public/ dir exists.");

  await fs.mkdir(`${PUB_ROOT}/images/favicons`, { recursive: true });
  await fs.cp(`${SRC_ROOT}/images`, `${PUB_ROOT}/images`, { recursive: true, force: true });
  await fs.copyFile(`${SRC_ROOT}/images/favicons/favicon.ico`, `${PUB_ROOT}/favicon.ico`);
  console.info("Copied src/images/* to public/images");

  const files = await fs.readdir(`${SRC_ROOT}`);
  for (let f of files) {
    if (f.endsWith(".txt")) {
      await fs.copyFile(`${SRC_ROOT}/${f}`, `${PUB_ROOT}/${f}`);
      console.info(`Copied ${f} to public/`);
    }
  }

  const stylPath = `${SRC_ROOT}/main.styl`;
  const cssPath = `${PUB_ROOT}/main.css`;
  const mainStyl = await fs.readFile(stylPath, { encoding: "utf8" });
  const renderStylus = promisify(stylus.render);
  const mainCss = await renderStylus(mainStyl, {
    filename: stylPath,
    compress: true,
    inline: true,
  });
  await fs.writeFile(cssPath, mainCss);
  console.info("Rendered main.styl to public/main.css");

  const renderPugFile = promisify(pug.renderFile);
  const htmlStr = await renderPugFile(`${SRC_ROOT}/index.pug`, {
    basedir: PUB_ROOT,
    pretty: true,
  });
  await fs.writeFile(`${PUB_ROOT}/index.html`, htmlStr);
  console.info("Rendered index.pug to public/index.html");

  await fs.unlink(cssPath);
  console.info("Cleaned up main.css from public/");
}
