"use client";

import { FolderGit2, GitCommit, Users } from "lucide-react";
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
    // Get today's date at the start of the day (midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create array of last 7 days, starting from 6 days ago
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i)); // This makes today the last day
      return d;
    });

    // Map each date to its data point
    const chartData = last7Days.map((day) => {
      const dayString = day.toISOString().split("T")[0];
      const dayName = day.toLocaleDateString("en-US", { weekday: "short" });
      return {
        name: dayName,
        date: day.toISOString(), // Store full ISO string for accurate comparison
        commits: 0,
      };
    });

    recentCommits.forEach((commit) => {
      const commitDate = new Date(commit.date);
      commitDate.setHours(0, 0, 0, 0);

      // Find matching day by comparing dates directly
      const dayData = chartData.find((d) => {
        const chartDate = new Date(d.date);
        return (
          chartDate.getFullYear() === commitDate.getFullYear() &&
          chartDate.getMonth() === commitDate.getMonth() &&
          chartDate.getDate() === commitDate.getDate()
        );
      });

      if (dayData) {
        dayData.commits += 1;
      }
    });

    return chartData;
  })();

  return (
    <section className="relative">
      <div className="flex justify-center gap-6 mb-8">
        {/* Stat cards - modern, colorful, with icons and gradients */}
        <div className="bg-gradient-to-br from-[#6e1fff]/80 via-[#a259ff]/80 to-[#2d006b]/80 rounded-2xl shadow-xl p-6 flex flex-col gap-2 border-none relative group w-56 min-w-[12rem] max-w-[15rem] backdrop-blur-md bg-opacity-70 transition-all duration-200 hover:shadow-[0_0_32px_8px_rgba(162,89,255,0.7)] hover:ring-2 hover:ring-purple-400/60">
          {/* Icon */}
          <div className="absolute top-4 right-4">
            <FolderGit2 className="w-7 h-7 text-white drop-shadow-lg" />
          </div>
          {/* Metric */}
          <div className="text-4xl font-extrabold text-white drop-shadow-lg">
            {repos.length}
          </div>
          {/* Label */}
          <div className="text-base text-white/80 font-medium">Total Repos</div>
        </div>
        <div className="bg-gradient-to-br from-[#a259ff]/80 via-[#6e1fff]/80 to-[#2d006b]/80 rounded-2xl shadow-xl p-6 flex flex-col gap-2 border-none relative group w-56 min-w-[12rem] max-w-[15rem] backdrop-blur-md bg-opacity-70 transition-all duration-200 hover:shadow-[0_0_32px_8px_rgba(162,89,255,0.7)] hover:ring-2 hover:ring-purple-400/60">
          {/* Icon */}
          <div className="absolute top-4 right-4">
            <Users className="w-7 h-7 text-white drop-shadow-lg" />
          </div>
          {/* Metric */}
          <div className="text-4xl font-extrabold text-white drop-shadow-lg">
            {orgs.length}
          </div>
          {/* Label */}
          <div className="text-base text-white/80 font-medium">Total Orgs</div>
        </div>
        <div className="bg-gradient-to-br from-[#2d006b]/80 via-[#6e1fff]/80 to-[#a259ff]/80 rounded-2xl shadow-xl p-6 flex flex-col gap-2 border-none relative group w-56 min-w-[12rem] max-w-[15rem] backdrop-blur-md bg-opacity-70 transition-all duration-200 hover:shadow-[0_0_32px_8px_rgba(162,89,255,0.7)] hover:ring-2 hover:ring-purple-400/60">
          {/* Icon */}
          <div className="absolute top-4 right-4">
            <GitCommit className="w-7 h-7 text-white drop-shadow-lg" />
          </div>
          {/* Metric */}
          <div className="text-4xl font-extrabold text-white drop-shadow-lg">
            {recentCommits.length}
          </div>
          {/* Label */}
          <div className="text-base text-white/80 font-medium">
            Recent Commits
          </div>
        </div>
      </div>

      {/* Commits and Activity side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Latest Commits List */}
        <div className="bg-gradient-to-br from-[#2d006b]/60 via-[#6e1fff]/60 to-[#a259ff]/60 rounded-xl border-none p-6 flex flex-col mb-0 shadow-lg backdrop-blur-md bg-opacity-60 transition-all duration-200 hover:shadow-[0_0_32px_8px_rgba(162,89,255,0.7)] hover:ring-2 hover:ring-purple-400/60">
          <h3 className="text-lg font-semibold text-white mb-4">
            Latest Commits
          </h3>
          <div className="space-y-4">
            {recentCommits.length > 0 ? (
              displayedCommits.map((commit) => (
                <div
                  key={commit.sha}
                  className="flex items-center gap-4 p-3 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium text-gray-200 truncate"
                      title={commit.message}
                    >
                      {commit.message}
                    </p>
                    <p className="text-sm text-gray-400">
                      to <span className="font-semibold">{commit.repo}</span>
                    </p>
                  </div>
                  <div className="text-sm text-gray-400 whitespace-nowrap">
                    {new Date(commit.date).toLocaleDateString()}
                  </div>
                  <a
                    href={`https://github.com/${commit.repo}/commit/${commit.sha}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:underline"
                  >
                    View
                  </a>
                </div>
              ))
            ) : (
              <p className="text-gray-400">No recent public commits found.</p>
            )}
          </div>

          {/* Controls for commits */}
          <div className="mt-6 flex justify-between items-center">
            <div>
              {!commitsExpanded && recentCommits.length > 3 && (
                <button
                  onClick={() => setCommitsExpanded(true)}
                  className="text-sm font-semibold text-blue-600 hover:underline hover:cursor-pointer"
                >
                  See more
                </button>
              )}
              {commitsExpanded && (
                <button
                  onClick={() => {
                    setCommitsExpanded(false);
                    setCommitPage(1);
                  }}
                  className="text-sm font-semibold text-blue-600 hover:underline"
                >
                  See less
                </button>
              )}
            </div>

            {commitsExpanded && recentCommits.length > commitsPerPage && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCommitPage((p) => Math.max(1, p - 1))}
                  disabled={commitPage === 1}
                  className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-blue-400/10 border-blue-400/20 text-gray-200"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-400">
                  Page {commitPage} of {totalCommitPages}
                </span>
                <button
                  onClick={() =>
                    setCommitPage((p) => Math.min(totalCommitPages, p + 1))
                  }
                  disabled={commitPage === totalCommitPages}
                  className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-blue-400/10 border-blue-400/20 text-gray-200"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Commit Activity Chart - consider updating to a modern, sleek line graph */}
        <div className="bg-gradient-to-br from-[#a259ff]/60 via-[#6e1fff]/60 to-[#2d006b]/60 rounded-xl border-none p-6 min-h-[300px] flex flex-col mb-0 shadow-lg backdrop-blur-md bg-opacity-60 transition-all duration-200 hover:shadow-[0_0_32px_8px_rgba(162,89,255,0.7)] hover:ring-2 hover:ring-purple-400/60">
          <div className="font-semibold text-white mb-2">
            Commit Activity (Last 7 Days)
          </div>
          <div className="flex-1 -ml-6">
            {/* TODO: Update CommitActivityChart to a more modern, sleek line graph */}
            <CommitActivityChart data={commitActivityData} />
          </div>
        </div>
      </div>
    </section>
  );
}
