import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import simpleGit from "simple-git";
import fs from "fs";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for deployment

export async function POST(req) {
  let repoDir = null;
  
  try {
    const { repoUrl, projectDirectory } = await req.json();
    const vercelToken = process.env.VERCEL_TOKEN;

    if (!vercelToken) {
      return NextResponse.json(
        { error: "Vercel token not configured" },
        { status: 500 }
      );
    }

    if (!repoUrl) {
      return NextResponse.json(
        { error: "Repository URL is required" },
        { status: 400 }
      );
    }

    // Create temp directory
    repoDir = path.join(os.tmpdir(), `deploy-${Date.now()}`);
    const git = simpleGit();

    console.log("Step 1: Cloning repository...");
    await git.clone(repoUrl, repoDir);

    // Determine working directory
    const workDir = projectDirectory 
      ? path.join(repoDir, projectDirectory)
      : repoDir;

    if (!fs.existsSync(workDir)) {
      throw new Error(`Directory "${projectDirectory}" not found in repository`);
    }

    // Check for package.json
    if (!fs.existsSync(path.join(workDir, "package.json"))) {
      throw new Error("package.json not found in project directory");
    }

    console.log("Step 2: Installing dependencies...");
    await execAsync("npm install", { cwd: workDir, maxBuffer: 10 * 1024 * 1024 });

    console.log("Step 3: Deploying to Vercel...");
    
    // Deploy using Vercel CLI
    const { stdout, stderr } = await execAsync(
      `npx vercel --prod --token ${vercelToken} --yes`,
      { 
        cwd: workDir,
        maxBuffer: 10 * 1024 * 1024,
        env: {
          ...process.env,
          VERCEL_TOKEN: vercelToken,
        }
      }
    );

    console.log("Vercel output:", stdout);
    if (stderr) console.error("Vercel stderr:", stderr);

    // Extract URL from output
    const urlMatch = stdout.match(/https:\/\/[^\s]+\.vercel\.app/);
    const deploymentUrl = urlMatch ? urlMatch[0] : null;

    if (!deploymentUrl) {
      throw new Error("Could not extract deployment URL from Vercel output");
    }

    // Cleanup
    try {
      fs.rmSync(repoDir, { recursive: true, force: true });
    } catch (e) {
      console.error("Cleanup error:", e);
    }

    return NextResponse.json({
      success: true,
      url: deploymentUrl,
      message: "Deployment successful! Your site is now live.",
    });

  } catch (error) {
    // Cleanup on error
    if (repoDir && fs.existsSync(repoDir)) {
      try {
        fs.rmSync(repoDir, { recursive: true, force: true });
      } catch (e) {
        console.error("Cleanup error:", e);
      }
    }

    console.error("Deployment error:", error);
    
    return NextResponse.json(
      { 
        error: error.message || "Deployment failed",
        details: error.toString()
      },
      { status: 500 }
    );
  }
}