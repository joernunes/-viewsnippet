/**
 * Edge Web Inspector - Background Service Worker (Manifest V3)
 * Handles Side Panel activation, active tab sync, multi-site state management, and screenshot routing.
 */

// Enable side panel opening on action icon click
if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => {
    console.error("Failed to set side panel behavior:", error);
  });
}

// Setup context menu on installation and inject into existing open tabs
chrome.runtime.onInstalled.addListener(async () => {
  chrome.contextMenus.create({
    id: "edge_inspect_element",
    title: "Inspecionar elemento no Edge Inspector",
    contexts: ["all"]
  });

  chrome.contextMenus.create({
    id: "edge_capture_page",
    title: "Capturar ecrã da página no Edge Inspector",
    contexts: ["all"]
  });

  console.log("Edge Web Inspector v2.0 installed successfully!");

  // Inject content script into all currently open http/https tabs
  try {
    const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*", "file://*/*"] });
    for (const tab of tabs) {
      if (tab.id) {
        injectContentScript(tab.id).catch(() => {});
      }
    }
  } catch (e) {
    console.warn("Auto injection on install skipped:", e);
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !tab.id) return;

  if (chrome.sidePanel && chrome.sidePanel.open) {
    try {
      await chrome.sidePanel.open({ tabId: tab.id });
    } catch (e) {
      console.warn("Could not open side panel directly:", e);
    }
  }

  if (info.menuItemId === "edge_inspect_element") {
    sendTabMessageWithFallback(tab.id, { action: "START_INSPECTOR" });
  } else if (info.menuItemId === "edge_capture_page") {
    sendTabMessageWithFallback(tab.id, { action: "CAPTURE_REQUESTED" });
  }
});

// Handle commands (Keyboard shortcuts)
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;

  if (command === "toggle_inspect") {
    sendTabMessageWithFallback(tab.id, { action: "TOGGLE_INSPECTOR" });
  }
});

// Track Tab switches and notify Sidepanel to isolate per-site data
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab && tab.url) {
      chrome.runtime.sendMessage({
        action: "TAB_SWITCHED",
        tabId: tab.id,
        url: tab.url,
        title: tab.title,
        favIconUrl: tab.favIconUrl,
      }).catch(() => {});
    }
  } catch (e) {
    // Tab might have closed
  }
});

// Track Tab URL updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab && tab.url) {
    chrome.runtime.sendMessage({
      action: "TAB_UPDATED",
      tabId: tabId,
      url: tab.url,
      title: tab.title,
      favIconUrl: tab.favIconUrl,
    }).catch(() => {});
  }
});

// Helper to inject content script dynamically if not present
async function injectContentScript(tabId) {
  try {
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ["content.css"]
    });
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"]
    });
  } catch (error) {
    console.warn("Failed to inject content script (system page?):", error);
  }
}

async function sendTabMessageWithFallback(tabId, message) {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (err) {
    await injectContentScript(tabId);
    try {
      return await chrome.tabs.sendMessage(tabId, message);
    } catch (e) {
      console.warn("Message failed after script injection:", e);
      return null;
    }
  }
}

// Track Sidepanel connection to clean up active tab when Sidepanel closes
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "edge_sidepanel_port") {
    port.onDisconnect.addListener(async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.id) {
          sendTabMessageWithFallback(tab.id, { action: "CLEANUP_ALL_INSPECTOR" });
        }
      } catch (e) {
        console.warn("Could not clean up tab on sidepanel close:", e);
      }
    });
  }
});

// Central Message router
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Inject content script request
  if (message.action === "INJECT_CONTENT_SCRIPT" && message.tabId) {
    injectContentScript(message.tabId).then(() => {
      sendResponse({ success: true });
    }).catch((err) => {
      sendResponse({ success: false, error: err.message });
    });
    return true;
  }

  // Sidepanel closed cleanup trigger
  if (message.action === "SIDEPANEL_CLOSED") {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, async (tabs) => {
      if (tabs.length > 0 && tabs[0].id) {
        sendTabMessageWithFallback(tabs[0].id, { action: "CLEANUP_ALL_INSPECTOR" });
      }
    });
    return true;
  }

  // Capture visible tab screenshot
  if (message.action === "CAPTURE_VISIBLE_TAB") {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, dataUrl });
      }
    });
    return true;
  }

  // Forward messages to active tab
  if (message.target === "CONTENT_SCRIPT") {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs.length > 0 && tabs[0].id) {
        const res = await sendTabMessageWithFallback(tabs[0].id, message);
        sendResponse(res);
      } else {
        sendResponse({ error: "Nenhuma aba ativa encontrada" });
      }
    });
    return true;
  }
});
