import { readFileSync, appendFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("ensure-trailing-newline: missing file argument");
  process.exit(1);
}
const contents = readFileSync(file, "utf8");
if (!contents.endsWith("\n")) appendFileSync(file, "\n");
