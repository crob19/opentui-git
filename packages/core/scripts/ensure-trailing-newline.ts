import { readFileSync, appendFileSync } from "node:fs";

const file = process.argv[2];
if (!file) process.exit(0);
const contents = readFileSync(file, "utf8");
if (!contents.endsWith("\n")) appendFileSync(file, "\n");
