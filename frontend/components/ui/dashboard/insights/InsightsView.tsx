"use client";

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
    const last7Days = Array.from({ length: 7 })
      .map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d;
      })
      .reverse();

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const chartData = last7Days.map((day) => {
      const dayString = day.toISOString().split("T")[0];
      return {
        name: dayNames[day.getDay()],
        date: dayString,
        commits: 0,
      };
    });

    recentCommits.forEach((commit) => {
      const commitDate = new Date(commit.date).toISOString().split("T")[0];
      const dayData = chartData.find((d) => d.date === commitDate);
      if (dayData) {
        dayData.commits += 1;
      }
    });

    return chartData;
  })();

  return (
    <section>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Stat cards */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col justify-between">
          <div className="text-md font-semibold text-gray-600 mb-2">
            Total Repos
          </div>
          <div className="text-3xl font-bold text-gray-900">{repos.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col justify-between">
          <div className="text-md font-semibold text-gray-600 mb-2">
            Total Orgs
          </div>
          <div className="text-3xl font-bold text-gray-900">{orgs.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col justify-between">
          <div className="text-md font-semibold text-gray-600 mb-2">
            Recent Commits
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {recentCommits.length}
          </div>
        </div>
      </div>

      {/* Recent Commits List */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
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
                    className="text-sm font-medium text-gray-800 truncate"
                    title={commit.message}
                  >
                    {commit.message}
                  </p>
                  <p className="text-sm text-gray-500">
                    to <span className="font-semibold">{commit.repo}</span>
                  </p>
                </div>
                <div className="text-sm text-gray-500 whitespace-nowrap">
                  {new Date(commit.date).toLocaleDateString()}
                </div>
                <a
                  href={`https://github.com/${commit.repo}/commit/${commit.sha}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  View
                </a>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No recent public commits found.</p>
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
                className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-gray-100"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {commitPage} of {totalCommitPages}
              </span>
              <button
                onClick={() =>
                  setCommitPage((p) => Math.min(totalCommitPages, p + 1))
                }
                disabled={commitPage === totalCommitPages}
                className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 min-h-[300px] flex flex-col mb-8">
        <div className="font-semibold text-gray-900 mb-2">
          Commit Activity (Last 7 Days)
        </div>
        <div className="flex-1 -ml-6">
          <CommitActivityChart data={commitActivityData} />
        </div>
      </div>
    </section>
  );
}
