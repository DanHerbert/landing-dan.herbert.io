#!/usr/bin/node

import appRoot from "app-root-path";
import config from "config";
import { execSync } from "node:child_process";
import { promises as fs, Dirent, existsSync, rmSync } from "node:fs";
import { buildSite } from "./build.js";

const SHORT_HASH_LENGTH = 7;
const PUB_ROOT = `${appRoot}/public`;
const LOCK_PATH = `${appRoot}/publishing.lock`;

/**
 * @param {Dirent} a
 * @param {Dirent} b
 */
function fileSortCompare(a, b) {
  if (a == null && b == null) return 0;
  if (a == null && b != null) return -1;
  if (a != null && b == null) return 1;
  if (a.path === b.path && a.name == b.name) return 0;
  if (a.isDirectory() && !b.isDirectory()) return -1;
  if (!a.isDirectory() && b.isDirectory()) return 1;
  if (a.path === PUB_ROOT && b.path !== PUB_ROOT) return -1;
  if (a.path !== PUB_ROOT && b.path === PUB_ROOT) return 1;
  return `${a.path}/${a.name}`.localeCompare(`${b.path}/${b.name}`);
}

async function getPublicFiles(root) {
  const pubDirEnts = await fs.readdir(root, {
    recursive: true,
    withFileTypes: true,
  });
  pubDirEnts.sort(fileSortCompare);
  return pubDirEnts.map((f) =>
    `${f.path.replace(root, "")}/${f.name}`.replace(/^\//, "")
  );
}

const lastPubPath = `${appRoot}/latest-publication.txt`;
const previousPub = existsSync(lastPubPath)
  ? await fs.readFile(lastPubPath, { encoding: "utf8" })
  : "";
const gitUser = execSync("stat -c '%U' ./").toString().trim();
const currentPub = execSync(`sudo -u "${gitUser}" git rev-parse HEAD`)
  .toString()
  .trim();
if (previousPub === currentPub) {
  console.info("Previous version matches current version. Doing nothing.");
  process.exit(0);
} else {
  console.info(
    `Checked revisions ` +
      `(old:${previousPub.substring(0, SHORT_HASH_LENGTH)}) ` +
      `(new:${currentPub.substring(0, SHORT_HASH_LENGTH)}) ` +
      `and continuing to publish...`
  );
}

const startAttempts = 0;
while (existsSync(LOCK_PATH)) {
  if (startAttempts > config.get("startAttemptsMax")) {
    console.error("Timeout while waiting for publish lock.");
    process.exit(1);
  }
  startAttempts++;
  await new Promise((resolve) =>
    setTimeout(resolve, config.get("startAttemptsDelay"))
  );
}
await fs.writeFile(LOCK_PATH, new Date().toISOString());
process.on("exit", () => rmSync(LOCK_PATH));

const previousPubFiles = await getPublicFiles(PUB_ROOT);
console.log("Storing old files list for later cleanup.");

await fs.rm(PUB_ROOT, { recursive: true, force: true, maxRetries: 2 });
console.log("Removed existing public/ folder.");

await buildSite();

const newPubFiles = await getPublicFiles(PUB_ROOT);
const filesToDelete = previousPubFiles.filter((f) => !newPubFiles.includes(f));
console.log("Got list of files to cleanup.");

const deployDir = config.get("deployDir");
await fs.cp(PUB_ROOT, deployDir, { recursive: true });
console.log(`Deployed to ${deployDir}`);

const deployedFiles = await getPublicFiles(deployDir);
let filesCleanedUp = 0;
for (let f of deployedFiles) {
  const fullPath = `${deployDir}/${f}`;
  if (!existsSync(fullPath)) {
    console.log(`${f} no longer exists in deploy dir.`);
    continue;
  }
  if (filesToDelete.includes(f)) {
    filesCleanedUp++;
    console.log(`Removed ${f} from deploy dir.`);
    await fs.rm(fullPath, { recursive: true, force: true, maxRetries: 2 });
  }
}
console.log(`Cleaned up ${filesCleanedUp} files.`);

await fs.writeFile(lastPubPath, currentPub);
console.log(`Saved the current revision to ${lastPubPath}`);

const stashListOutput = execSync(`sudo -u "${gitUser}" git stash list`)
  .toString()
  .trim();
if (stashListOutput) {
  console.info(`stash list output:\n${stashListOutput}`);
  console.warn("Repository has stashed changes.");
}
