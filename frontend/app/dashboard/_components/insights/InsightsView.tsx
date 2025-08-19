"use client";

import { FolderGit2, GitCommit, Users, Activity, TrendingUp, Code2 } from "lucide-react";
import { useState } from "react";
import { CommitActivityChart } from "./CommitActivityChart";

export function InsightsView({
  repos,
  orgs,
  recentCommits,
}: {
  repos: any[];
  orgs: any[];
  recentCommits: any[];
}) {
  const [commitsExpanded, setCommitsExpanded] = useState(false);
  const [commitPage, setCommitPage] = useState(1);

  const commitsPerPage = 10;
  const displayedCommits = commitsExpanded
    ? recentCommits.slice(
        (commitPage - 1) * commitsPerPage,
        commitPage * commitsPerPage
      )
    : recentCommits.slice(0, 3);

  const totalCommitPages = Math.ceil(recentCommits.length / commitsPerPage);

  const commitActivityData = (() => {
    // Use current exact date and time
    const now = new Date();

    // Create array of last 7 days, starting from 6 days ago
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i)); // 6 days ago to today
      return d;
    });

    // Map each date to its data point
    const chartData = last7Days.map((day) => {
      const dayName = day.toLocaleDateString("en-US", { weekday: "short" });
      return {
        name: dayName,
        date: day.toISOString(), // Full ISO string for comparison
        commits: 0,
      };
    });

    // Increment commits for matching days
    recentCommits.forEach((commit) => {
      const commitDate = new Date(commit.date);
      const commitDayString = commitDate.toISOString().split("T")[0];

      const dayData = chartData.find(
        (d) => d.date.split("T")[0] === commitDayString
      );
      if (dayData) {
        dayData.commits += 1;
      }
    });

    return chartData;
  })();

  return (
    <section className="space-y-8">


      {/* Stat cards - Gotham-inspired design */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6 relative overflow-hidden group hover:border-white/20 transition-all duration-300">
          {/* Background accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-full"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
                <FolderGit2 className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-right">
                <div className="text-xs text-white/40 font-mono uppercase tracking-wider">REPOS</div>
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{repos.length}</div>
            <div className="text-sm text-white/60">Active repositories</div>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6 relative overflow-hidden group hover:border-white/20 transition-all duration-300">
          {/* Background accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/5 to-transparent rounded-full"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center border border-purple-500/20">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-right">
                <div className="text-xs text-white/40 font-mono uppercase tracking-wider">ORGS</div>
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{orgs.length}</div>
            <div className="text-sm text-white/60">Organizations</div>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6 relative overflow-hidden group hover:border-white/20 transition-all duration-300">
          {/* Background accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-green-500/5 to-transparent rounded-full"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center border border-green-500/20">
                <GitCommit className="w-6 h-6 text-green-400" />
              </div>
              <div className="text-right">
                <div className="text-xs text-white/40 font-mono uppercase tracking-wider">COMMITS</div>
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{recentCommits.length}</div>
            <div className="text-sm text-white/60">Recent activity</div>
          </div>
        </div>
      </div>

      {/* Commits and Activity side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Latest Commits List */}
        <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Code2 className="w-5 h-5 text-white/60" />
              Latest Commits
            </h3>
          </div>
          
          <div className="space-y-3">
            {recentCommits.length > 0 ? (
              displayedCommits.map((commit, index) => (
                <div
                  key={commit.sha}
                  className="flex items-center gap-4 p-4 rounded-lg border border-white/5 hover:border-white/10 transition-all duration-200 group"
                >
                  <div className="w-2 h-2 bg-blue-400 rounded-full opacity-60"></div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium text-white truncate group-hover:text-blue-300 transition-colors"
                      title={commit.message}
                    >
                      {commit.message}
                    </p>
                    <p className="text-sm text-white/60 mt-1">
                      to <span className="font-mono text-white/80">{commit.repo}</span>
                    </p>
                  </div>
                  <div className="text-xs text-white/40 font-mono whitespace-nowrap">
                    {new Date(commit.date).toLocaleDateString()}
                  </div>
                  <a
                    href={`https://github.com/${commit.repo}/commit/${commit.sha}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 font-mono transition-colors"
                  >
                    VIEW
                  </a>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-white/40">
                <Code2 className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No recent commits found</p>
              </div>
            )}
          </div>

          {/* Controls for commits */}
          <div className="mt-6 flex justify-between items-center pt-4 border-t border-white/10">
            <div>
              {!commitsExpanded && recentCommits.length > 3 && (
                <button
                  onClick={() => setCommitsExpanded(true)}
                  className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors font-mono"
                >
                  EXPAND
                </button>
              )}
              {commitsExpanded && (
                <button
                  onClick={() => {
                    setCommitsExpanded(false);
                    setCommitPage(1);
                  }}
                  className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors font-mono"
                >
                  COLLAPSE
                </button>
              )}
            </div>

            {commitsExpanded && recentCommits.length > commitsPerPage && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCommitPage((p) => Math.max(1, p - 1))}
                  disabled={commitPage === 1}
                  className="px-3 py-1.5 text-xs border border-white/20 rounded-md disabled:opacity-30 hover:bg-white/5 text-white/80 font-mono transition-all duration-200"
                >
                  PREV
                </button>
                <span className="text-xs text-white/40 font-mono">
                  {commitPage}/{totalCommitPages}
                </span>
                <button
                  onClick={() =>
                    setCommitPage((p) => Math.min(totalCommitPages, p + 1))
                  }
                  disabled={commitPage === totalCommitPages}
                  className="px-3 py-1.5 text-xs border border-white/20 rounded-md disabled:opacity-30 hover:bg-white/5 text-white/80 font-mono transition-all duration-200"
                >
                  NEXT
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Commit Activity Chart */}
        <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-white/60" />
              Activity Pattern
            </h3>
          </div>
          
          <div className="flex-1 -ml-6">
            <CommitActivityChart data={commitActivityData} />
          </div>
        </div>
      </div>
    </section>
  );
}
