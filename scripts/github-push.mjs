import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

const TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
const OWNER = "Bustwana";
const REPO = "pitlaneautomotive";
const BASE = "https://api.github.com";

const EXCLUDE_DIRS = new Set([
  ".git", "node_modules", "dist", ".local", ".agents",
  "attached_assets", ".cache", ".tsbuildinfo"
]);

function getAllFiles(dir, root = dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    if (EXCLUDE_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    let stat;
    try { stat = statSync(full); } catch { continue; }
    if (stat.isDirectory()) {
      results.push(...getAllFiles(full, root));
    } else {
      if (entry.endsWith(".tsbuildinfo")) continue;
      results.push(relative(root, full));
    }
  }
  return results;
}

async function ghFetch(path, method = "GET", body = null) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `token ${TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: body ? JSON.stringify(body) : null,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`GitHub API ${method} ${path} => ${res.status}: ${JSON.stringify(json).slice(0, 200)}`);
  return json;
}

async function main() {
  const root = process.cwd();
  const files = getAllFiles(root);
  console.log(`Found ${files.length} files to push`);

  // Step 1: Initialize repo with a placeholder file via Contents API
  console.log("Initializing repo...");
  const initResult = await ghFetch(`/repos/${OWNER}/${REPO}/contents/.gitkeep`, "PUT", {
    message: "init",
    content: Buffer.from("").toString("base64"),
  });
  const baseCommitSha = initResult.commit.sha;
  console.log(`Base commit: ${baseCommitSha}`);

  // Step 2: Create blobs for all project files
  console.log("Creating blobs...");
  const treeItems = [];
  let i = 0;
  for (const file of files) {
    i++;
    const fullPath = join(root, file);
    let content;
    try {
      content = readFileSync(fullPath).toString("base64");
    } catch {
      console.warn(`Skipping unreadable: ${file}`);
      continue;
    }

    try {
      const blob = await ghFetch(`/repos/${OWNER}/${REPO}/git/blobs`, "POST", {
        content,
        encoding: "base64",
      });
      treeItems.push({ path: file, mode: "100644", type: "blob", sha: blob.sha });
      if (i % 50 === 0) console.log(`  ${i}/${files.length} blobs created...`);
    } catch (err) {
      console.warn(`Blob failed for ${file}: ${err.message.slice(0, 120)}`);
    }
  }
  console.log(`Created ${treeItems.length} blobs`);

  // Step 3: Create tree
  console.log("Creating tree...");
  const tree = await ghFetch(`/repos/${OWNER}/${REPO}/git/trees`, "POST", {
    tree: treeItems,
  });

  // Step 4: Create commit with base as parent
  console.log("Creating commit...");
  const commit = await ghFetch(`/repos/${OWNER}/${REPO}/git/commits`, "POST", {
    message: "Initial commit — Pitlane Automotive Group full platform",
    tree: tree.sha,
    parents: [baseCommitSha],
  });

  // Step 5: Update main branch to point to new commit
  console.log("Updating main branch...");
  await ghFetch(`/repos/${OWNER}/${REPO}/git/refs/heads/main`, "PATCH", {
    sha: commit.sha,
    force: true,
  });

  console.log(`\n✓ Done! https://github.com/${OWNER}/${REPO}`);
}

main().catch((err) => {
  console.error("Push failed:", err.message);
  process.exit(1);
});
