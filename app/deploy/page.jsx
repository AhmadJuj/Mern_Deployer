"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function DeployPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const repoName = searchParams.get("repo");
  const repoUrl = searchParams.get("url");

  const [framework, setFramework] = useState("vite");
  const [buildCommand, setBuildCommand] = useState("npm run build");
  const [outputDirectory, setOutputDirectory] = useState("dist");
  const [deploying, setDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  const handleDeploy = async () => {
    setDeploying(true);
    setError(null);
    setDeploymentResult(null);

    try {
      const response = await fetch("/api/renderDeploy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repoUrl,
          framework,
          buildCommand,
          outputDirectory,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setDeploymentResult(data);
      } else {
        setError(data.error || "Deployment failed");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setDeploying(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-slate-600 hover:text-slate-900 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-slate-900">Deploy Configuration</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {repoName}
          </h2>
          <p className="text-slate-600 text-sm">{repoUrl}</p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Framework
            </label>
            <select
              value={framework}
              onChange={(e) => setFramework(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
            >
              <option value="vite">Vite</option>
              <option value="nextjs">Next.js</option>
              <option value="create-react-app">Create React App</option>
              <option value="vue">Vue</option>
              <option value="angular">Angular</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Build Command
            </label>
            <input
              type="text"
              value={buildCommand}
              onChange={(e) => setBuildCommand(e.target.value)}
              placeholder="npm run build"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Output Directory
            </label>
            <input
              type="text"
              value={outputDirectory}
              onChange={(e) => setOutputDirectory(e.target.value)}
              placeholder="dist"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">
              The directory containing your built files (dist, build, out, etc.)
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {deploymentResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-green-800 font-medium mb-2">
                    Deployment successful! 🎉
                  </p>
                  {deploymentResult.url && (
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-green-700 mb-1">Deployment URL:</p>
                        <a
                          href={`https://${deploymentResult.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm font-medium break-all"
                        >
                          {deploymentResult.url}
                        </a>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`https://${deploymentResult.url}`);
                          alert('URL copied to clipboard!');
                        }}
                        className="px-3 py-1.5 text-xs bg-white border border-green-300 text-green-700 rounded hover:bg-green-50 transition"
                      >
                        Copy URL
                      </button>
                    </div>
                  )}
                  {deploymentResult.inspectorUrl && (
                    <div className="mt-2">
                      <a
                        href={deploymentResult.inspectorUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-green-700 hover:underline"
                      >
                        View in Vercel Dashboard →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleDeploy}
            disabled={deploying}
            className="w-full px-6 py-3 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deploying ? "Deploying..." : "Deploy to Vercel"}
          </button>
        </div>
      </main>
    </div>
  );
}