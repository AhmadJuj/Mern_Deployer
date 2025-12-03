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

  const [copied, setCopied] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeploy = async () => {
    setDeploying(true);
    setError(null);
    setDeploymentResult(null);

    try {
      const response = await fetch("/api/renderDeploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl,
          projectDirectory: "client", // Adjust if needed
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setDeploymentResult(data);
      } else {
        setError(data.error || "Deployment failed");
      }
    } catch (err) {
      setError(err.message || "Network error");
    } finally {
      setDeploying(false);
    }
  };

  // Fallback Vercel URL
  const vercelDeployUrl = `https://vercel.com/new/clone?repository-url=${encodeURIComponent(repoUrl)}`;

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500 rounded-2xl mb-6 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0l12 24H0z"/>
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-white mb-3">Deploy to Vercel</h1>
          <p className="text-blue-200 text-lg">Get your project live in minutes</p>
        </div>

        {/* Repository Card */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="w-14 h-14 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-white mb-2">{repoName}</h2>
              <div className="bg-slate-900/50 rounded-lg p-3 mb-2">
                <code className="text-green-400 text-sm break-all">{repoUrl}</code>
              </div>
              <button
                onClick={() => handleCopy(repoUrl)}
                className="text-xs px-3 py-1.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
              >
                {copied ? '✓ Copied!' : '📋 Copy URL'}
              </button>
            </div>
          </div>
        </div>

        {/* Main Deploy Button */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-10 mb-8 text-center shadow-2xl">
          <h3 className="text-3xl font-bold text-white mb-3">🚀 Deploy Your Project</h3>
          <p className="text-blue-100 mb-8 text-lg">
            Click below to deploy directly from our platform
          </p>
          
          {!deploymentResult && !error && (
            <button
              onClick={handleDeploy}
              disabled={deploying}
              className="inline-flex items-center gap-3 px-10 py-5 bg-white text-blue-600 font-bold text-xl rounded-xl hover:bg-blue-50 transition-all transform hover:scale-105 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deploying ? (
                <>
                  <svg className="animate-spin h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deploying...
                </>
              ) : (
                <>
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0l12 24H0z"/>
                  </svg>
                  Deploy Now
                </>
              )}
            </button>
          )}

          {deploymentResult && (
            <div className="bg-green-500 text-white p-6 rounded-xl">
              <div className="text-2xl font-bold mb-3">✅ Deployment Successful!</div>
              <p className="mb-4">{deploymentResult.message}</p>
              <a
                href={deploymentResult.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-green-600 font-semibold rounded-lg hover:bg-green-50 transition"
              >
                Visit Your Site
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <div className="mt-4 p-3 bg-white/20 rounded text-sm">
                <code className="break-all">{deploymentResult.url}</code>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500 text-white p-6 rounded-xl">
              <div className="text-xl font-bold mb-2">❌ Deployment Failed</div>
              <p className="text-sm mb-4">{error}</p>
              <button
                onClick={() => { setError(null); setDeploymentResult(null); }}
                className="px-4 py-2 bg-white text-red-600 font-semibold rounded-lg hover:bg-red-50 transition"
              >
                Try Again
              </button>
            </div>
          )}
          
          {!deploymentResult && !deploying && (
            <p className="text-xs text-blue-100 mt-5">
              This will clone, build, and deploy your project automatically
            </p>
          )}
        </div>

        {/* Steps Guide */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 mb-8">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white text-sm rounded-full">?</span>
            How It Works
          </h3>
          
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                1
              </div>
              <div className="flex-1">
                <h4 className="text-white font-semibold mb-1 text-lg">Import Repository</h4>
                <p className="text-blue-200 text-sm">
                  Vercel will automatically detect your GitHub repository
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                2
              </div>
              <div className="flex-1">
                <h4 className="text-white font-semibold mb-1 text-lg">Configure Settings</h4>
                <div className="bg-slate-900/50 rounded-lg p-4 mt-2 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-300">Framework:</span>
                    <span className="text-white font-mono">Vite</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-300">Root Directory:</span>
                    <span className="text-white font-mono">client</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-300">Build Command:</span>
                    <span className="text-white font-mono">npm run build</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-300">Output Directory:</span>
                    <span className="text-white font-mono">dist</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                3
              </div>
              <div className="flex-1">
                <h4 className="text-white font-semibold mb-1 text-lg">Deploy!</h4>
                <p className="text-blue-200 text-sm">
                  Click "Deploy" and Vercel will build your project (takes 2-5 minutes)
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                ✓
              </div>
              <div className="flex-1">
                <h4 className="text-white font-semibold mb-1 text-lg">Live!</h4>
                <p className="text-blue-200 text-sm">
                  Your site will be live with a unique URL like: yourproject.vercel.app
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Manual Option */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span>⚙️</span>
            Prefer Manual Deployment?
          </h3>
          <p className="text-blue-200 text-sm mb-3">
            You can also import your repository manually:
          </p>
          <a
            href="https://vercel.com/new"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition"
          >
            Go to Vercel Dashboard
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.back()}
            className="text-blue-300 hover:text-white transition flex items-center gap-2 mx-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to repositories
          </button>
        </div>
      </div>
    </div>
  );
}