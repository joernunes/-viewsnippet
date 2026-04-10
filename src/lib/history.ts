export interface RecentSnippet {
  id: string;
  title: string;
  language: string;
  timestamp: number;
}

export function getRecentSnippets(): RecentSnippet[] {
  try {
    const data = localStorage.getItem("recent_snippets");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveRecentSnippet(snippet: RecentSnippet) {
  try {
    const recent = getRecentSnippets();
    const filtered = recent.filter((s) => s.id !== snippet.id);
    filtered.unshift(snippet);
    // Keep only the last 20 snippets
    localStorage.setItem(
      "recent_snippets",
      JSON.stringify(filtered.slice(0, 20)),
    );
    // Dispatch a custom event so the Layout component can update the sidebar immediately
    window.dispatchEvent(new Event("recent_snippets_updated"));
  } catch (e) {
    console.error("Failed to save recent snippet", e);
  }
}

export function removeRecentSnippet(id: string) {
  try {
    const recent = getRecentSnippets();
    const filtered = recent.filter((s) => s.id !== id);
    localStorage.setItem("recent_snippets", JSON.stringify(filtered));
    window.dispatchEvent(new Event("recent_snippets_updated"));
  } catch (e) {
    console.error("Failed to remove recent snippet", e);
  }
}
