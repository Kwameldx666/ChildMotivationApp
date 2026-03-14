import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const projectRoot = process.cwd();

test("frontend package has required scripts", async () => {
  const packageJsonPath = join(projectRoot, "package.json");
  const raw = await readFile(packageJsonPath, "utf8");
  const pkg = JSON.parse(raw);

  assert.ok(pkg.scripts, "scripts section is missing");
  assert.ok(pkg.scripts.dev, "dev script is missing");
  assert.ok(pkg.scripts.build, "build script is missing");
  assert.ok(pkg.scripts.lint, "lint script is missing");
  assert.ok(pkg.scripts.test, "test script is missing");
});
