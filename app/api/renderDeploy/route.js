import { NextResponse } from "next/server";
import { exec } from "child_process";
import simpleGit from "simple-git";
import fs from "fs";
import path from "path";


export const runtime = "nodejs";

function run(cmd, cwd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd, maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
      if (err) return reject(stderr || err.message);
      resolve(stdout);
    });
  });
}

export async function POST(req) {
  try {
    const { repoUrl, vercelToken, framework, buildCommand, outputDirectory } = await req.json();

    if (!repoUrl || !vercelToken) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const repoDir = `/tmp/repo-${Date.now()}`;
    const git = simpleGit();

    console.log("Cloning repository...");
    await git.clone(repoUrl, repoDir);

    console.log("Installing dependencies...");
    await run("npm install", repoDir);

    console.log("Building project...");
    await run(buildCommand || "npm run build", repoDir);

    // Determine build output directory
    const outputDir = outputDirectory || "dist";
    const distPath = path.join(repoDir, outputDir);

    if (!fs.existsSync(distPath)) {
      throw new Error(`Output directory "${outputDir}" not found after build`);
    }

    console.log("Reading build files...");
    function walk(dir) {
      let out = [];
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          out = out.concat(walk(fullPath));
        } else {
          const relativePath = fullPath.replace(distPath + path.sep, "").replace(/\\/g, "/");
          out.push({
            file: relativePath,
            data: fs.readFileSync(fullPath).toString("base64"),
          });
        }
      }
      return out;
    }

    const files = walk(distPath);
    console.log(`Found ${files.length} files to deploy`);

    // Extract repo name from URL
    const repoName = repoUrl.split("/").pop().replace(".git", "");

    console.log("Deploying to Vercel...");
    const res = await fetch("https://api.vercel.com/v13/deployments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: repoName,
        files,
        projectSettings: {
          framework: framework || "vite",
          outputDirectory: outputDir,
        },
      }),
    });

    const json = await res.json();

    // Cleanup
    try {
      fs.rmSync(repoDir, { recursive: true, force: true });
    } catch (cleanupErr) {
      console.error("Cleanup error:", cleanupErr);
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: json.error?.message || "Deployment failed" },
        { status: res.status }
      );
    }

    // Extract deployment URL from Vercel response
    const deploymentUrl = json.url || json.alias?.[0] || null;

    return NextResponse.json({
      success: true,
      url: deploymentUrl,
      id: json.id,
      readyState: json.readyState,
      inspectorUrl: json.inspectorUrl,
    });
  } catch (e) {
    console.error("Deployment error:", e);
    return NextResponse.json(
      { error: e.toString() },
      { status: 500 }
    );
  }
}