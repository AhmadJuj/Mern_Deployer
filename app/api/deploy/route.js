import { NextResponse } from "next/server";
import { exec } from "child_process";
import simpleGit from "simple-git";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

export const runtime = "nodejs";  // IMPORTANT

function run(cmd, cwd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd }, (err, stdout, stderr) => {
      if (err) return reject(stderr);
      resolve(stdout);
    });
  });
}

export async function POST(req) {
  try {
    const { repoUrl, vercelToken } = await req.json();

    const repoDir = `/tmp/${Date.now()}`;
    const git = simpleGit();

    // 1. Clone
    await git.clone(repoUrl, repoDir);

    // 2. Install & build
    await run("npm install", repoDir);
    await run("npm run build", repoDir);

    // 3. Read build folder
    const dist = fs.existsSync(`${repoDir}/dist`)
      ? `${repoDir}/dist`
      : `${repoDir}/build`;

    function walk(dir) {
      let out = [];
      for (const item of fs.readdirSync(dir)) {
        const full = path.join(dir, item);
        if (fs.statSync(full).isDirectory()) {
          out = out.concat(walk(full));
        } else {
          out.push({
            file: full.replace(dist + "/", ""),
            data: fs.readFileSync(full).toString("base64"),
          });
        }
      }
      return out;
    }

    const files = walk(dist);

    // 4. Deploy to Vercel
    const res = await fetch("https://api.vercel.com/v13/deployments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "frontend-app",
        files,
        projectSettings: {
          framework: "vite",
          outputDirectory: "dist",
        },
      }),
    });

    const json = await res.json();

    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: e.toString() }, { status: 500 });
  }
}
