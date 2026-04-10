import React, { useState, useEffect } from "react";
import { Plus, History, X, Code2, Trash2 } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import {
  getRecentSnippets,
  RecentSnippet,
  removeRecentSnippet,
} from "../lib/history";
import { formatDistanceToNow } from "date-fns";

export function Layout({ children }: { children: React.ReactNode }) {
  const [showHistory, setShowHistory] = useState(false);
  const [recentSnippets, setRecentSnippets] = useState<RecentSnippet[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Force dark mode always
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
    localStorage.setItem("theme", "dark");

    // Load history
    setRecentSnippets(getRecentSnippets());
    const handleHistoryUpdate = () => setRecentSnippets(getRecentSnippets());
    const handleOpenHistory = () => setShowHistory(true);

    window.addEventListener("recent_snippets_updated", handleHistoryUpdate);
    window.addEventListener("open_history", handleOpenHistory);

    return () => {
      window.removeEventListener(
        "recent_snippets_updated",
        handleHistoryUpdate,
      );
      window.removeEventListener("open_history", handleOpenHistory);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col font-sans transition-colors duration-300 selection:bg-blue-500/30">
      <main className="flex-1 w-full h-screen flex flex-col">{children}</main>

      {/* History Drawer Overlay */}
      {showHistory && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setShowHistory(false)}
        />
      )}

      {/* History Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-zinc-900/90 backdrop-blur-2xl border-r border-zinc-800/50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${showHistory ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <History className="text-blue-500" size={20} />
            My Snippets
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHistory(false)}
            className="rounded-full hover:bg-zinc-800"
          >
            <X size={18} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {recentSnippets.length === 0 ? (
            <div className="text-center text-zinc-400 mt-10 text-sm">
              No recent snippets found.
              <br />
              Snippets you create or view will appear here.
            </div>
          ) : (
            recentSnippets.map((snippet) => (
              <div
                key={snippet.id}
                className="group relative flex flex-col gap-1 p-3 rounded-xl hover:bg-zinc-800/50 border border-transparent hover:border-zinc-700/50 transition-all cursor-pointer"
                onClick={() => {
                  navigate(`/s/${snippet.id}`);
                  setShowHistory(false);
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium truncate pr-6">
                    {snippet.title}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-blue-900/30 text-blue-400">
                    {snippet.language}
                  </span>
                </div>
                <div className="text-xs text-zinc-400">
                  {formatDistanceToNow(snippet.timestamp, { addSuffix: true })}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 hover:bg-red-900/30 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRecentSnippet(snippet.id);
                  }}
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
