const fs = require('fs');

function refactorView() {
  const filePath = 'src/pages/ViewSnippet.tsx';
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove dock state
  content = content.replace(/  const \[isDockVisible, setIsDockVisible\] = useState\(true\);\n/, '');

  // Fix editor padding
  content = content.replace(/padding: \{ top: 16, bottom: 16 \}/, 'padding: { top: 16, bottom: 16 }'); // already 16? No wait let me replace any padding config just in case.
  content = content.replace(/padding: \{ top: 24, bottom: 120 \}/, 'padding: { top: 16, bottom: 16 }');

  // Fix preview content pb-32
  content = content.replace(/p-4 sm:p-8 pb-32/g, 'p-4 sm:p-8');

  // Extract the return block
  const searchStart = '  return (\n    <div className="relative h-screen w-screen bg-[#1e1e1e] overflow-hidden">';
  const returnIdx = content.indexOf(searchStart);

  if (returnIdx === -1) {
    console.error(`Return statement not found in ViewSnippet.tsx`);
    return;
  }

  const newReturnView = `  return (
    <div className="flex h-screen w-screen bg-[#1e1e1e] overflow-hidden">
      {/* Activity Bar (VS Code left sidebar style) */}
      <div className="w-14 shrink-0 bg-[#181818] border-r border-[#2b2b2b] flex flex-col items-center py-4 z-50">
        <div className="flex-1 flex flex-col items-center gap-4">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                  onClick={() => navigate("/")}
                >
                  <Plus size={20} />
                </Button>
              }
            />
            <TooltipContent side="right">New Snippet</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                  onClick={() => window.dispatchEvent(new CustomEvent("open_history"))}
                >
                  <History size={20} />
                </Button>
              }
            />
            <TooltipContent side="right">History</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Top Bar */}
        <div className="h-12 bg-[#1e1e1e] border-b border-[#2b2b2b] flex items-center justify-between px-4 shrink-0 z-40 gap-4 overflow-x-auto no-scrollbar">
          {/* File Info */}
          <div className="flex items-center gap-2 max-w-sm truncate whitespace-nowrap">
            <Code2 size={18} className="text-zinc-400 shrink-0" />
            <span className="text-zinc-100 font-semibold truncate">
              {snippet.title || "Untitled Snippet"}
            </span>
            <span className="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded text-xs ml-2 uppercase font-semibold shrink-0">
              {snippet.language}
            </span>
          </div>

          {/* Actions & Toggles */}
          <div className="flex items-center gap-3">
            {(snippet.language === "html" || snippet.language === "css") && (
              <div className="flex bg-zinc-900 rounded-md p-0.5 border border-zinc-800">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant={viewMode === "code" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 rounded opacity-80 hover:opacity-100 flex items-center justify-center w-8 px-0"
                        onClick={() => setViewMode("code")}
                      >
                        <Code2 size={13} />
                      </Button>
                    }
                  />
                  <TooltipContent>Code View</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant={viewMode === "split" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 rounded opacity-80 hover:opacity-100 flex items-center justify-center w-8 px-0"
                        onClick={() => setViewMode("split")}
                      >
                        <Columns size={13} />
                      </Button>
                    }
                  />
                  <TooltipContent>Split View</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant={viewMode === "preview" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 rounded opacity-80 hover:opacity-100 flex items-center justify-center w-8 px-0"
                        onClick={() => setViewMode("preview")}
                      >
                        <Eye size={13} />
                      </Button>
                    }
                  />
                  <TooltipContent>Live Preview</TooltipContent>
                </Tooltip>
              </div>
            )}

            {viewMode === "preview" && (
              <div className="flex bg-zinc-900 rounded-md p-0.5 border border-zinc-800">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant={previewDevice === "desktop" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 rounded opacity-80 hover:opacity-100 flex items-center justify-center w-8 px-0"
                        onClick={() => setPreviewDevice("desktop")}
                      >
                        <Monitor size={13} />
                      </Button>
                    }
                  />
                  <TooltipContent>Desktop</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant={previewDevice === "iphone" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 rounded opacity-80 hover:opacity-100 flex items-center justify-center w-8 px-0"
                        onClick={() => setPreviewDevice("iphone")}
                      >
                        <Smartphone size={13} />
                      </Button>
                    }
                  />
                  <TooltipContent>iPhone</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant={previewDevice === "ipad" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 rounded opacity-80 hover:opacity-100 flex items-center justify-center w-8 px-0"
                        onClick={() => setPreviewDevice("ipad")}
                      >
                        <Tablet size={13} />
                      </Button>
                    }
                  />
                  <TooltipContent>iPad</TooltipContent>
                </Tooltip>
                {previewDevice !== "desktop" && (
                  <>
                    <div className="w-px h-4 bg-zinc-700 mx-1 self-center"></div>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 rounded opacity-80 hover:opacity-100 flex items-center justify-center w-8 px-0"
                            onClick={() =>
                              setPreviewOrientation((o) =>
                                o === "portrait" ? "landscape" : "portrait"
                              )
                            }
                          >
                            <RotateCcw
                              size={13}
                              className={
                                previewOrientation === "landscape"
                                  ? "-rotate-90 transition-transform"
                                  : "transition-transform"
                              }
                            />
                          </Button>
                        }
                      />
                      <TooltipContent>Rotate Device</TooltipContent>
                    </Tooltip>
                  </>
                )}
              </div>
            )}

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    onClick={copyLink}
                    variant="outline"
                    className="h-8 rounded-md px-3 shadow-none bg-zinc-900 border-zinc-700 text-xs"
                  >
                    {copiedLink ? (
                      <Check size={13} className="mr-1.5 text-green-500" />
                    ) : (
                      <Copy size={13} className="mr-1.5" />
                    )}
                    {copiedLink ? "Copied" : "Link"}
                  </Button>
                }
              />
              <TooltipContent>Copy link to snippet</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    onClick={copyCode}
                    variant="outline"
                    className="h-8 rounded-md px-3 shadow-none bg-zinc-900 border-zinc-700 text-xs"
                  >
                    {copiedCode ? (
                      <Check size={13} className="mr-1.5" />
                    ) : (
                      <Copy size={13} className="mr-1.5" />
                    )}
                    {copiedCode ? "Copied" : "Code"}
                  </Button>
                }
              />
              <TooltipContent>Copy code to clipboard</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    onClick={() => {
                        navigate("/", {
                           state: {
                               forkedSnippet: {
                                   code: snippet.code,
                                   language: snippet.language,
                                   title: snippet.title,
                                   description: snippet.description,
                                   tags: snippet.tags
                               }
                           }
                        })
                    }}
                    className="h-8 bg-blue-600 text-white rounded-md px-3 shadow-none border-none hover:bg-blue-700 text-xs"
                  >
                    <GitFork size={13} className="mr-1.5" />
                    Fork
                  </Button>
                }
              />
              <TooltipContent>Fork snippet</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    onClick={downloadCode}
                    className="h-8 rounded-md px-3 shadow-none bg-zinc-900 border-zinc-700 text-xs"
                  >
                    <Download size={13} />
                  </Button>
                }
              />
              <TooltipContent>Download file</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Editor / Preview */}
        <div className="flex-1 relative overflow-hidden group">
          {(() => {
            const editorContent = (
              <>
                {/* Floating Zoom Controls */}
                <div className="absolute top-6 right-6 z-10 flex items-center gap-1 bg-zinc-800/80 backdrop-blur-md p-1.5 rounded-xl border border-zinc-700/50 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-zinc-700"
                    onClick={() => setFontSize((f) => Math.max(10, f - 2))}
                  >
                    <ZoomOut size={16} />
                  </Button>
                  <span className="text-xs font-mono w-8 text-center font-medium">
                    {fontSize}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-zinc-700"
                    onClick={() => setFontSize((f) => Math.min(30, f + 2))}
                  >
                    <ZoomIn size={16} />
                  </Button>
                </div>
                <Editor
                  height="100%"
                  language={snippet.language}
                  theme="vs-dark"
                  value={snippet.code}
                  options={{
                    wordWrap: "on",
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: fontSize,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    fontLigatures: true,
                    padding: { top: 16, bottom: 16 },
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    cursorBlinking: "smooth",
                    lineHeight: 1.6,
                    renderLineHighlight: "all",
                  }}
                />
              </>
            );

            const getSrcDoc = () => {
              if (snippet.language === "html") return snippet.code;
              if (snippet.language === "css") {
                return \`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <style>
                        body { margin: 0; padding: 2rem; font-family: system-ui, -apple-system, sans-serif; }
                        \${snippet.code}
                      </style>
                    </head>
                    <body>
                      <div class="preview-container">
                        <h1>CSS Preview</h1>
                        <p>This is a sample paragraph to test your CSS styling in real-time.</p>
                        <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                          <button style="padding: 0.5rem 1rem; cursor: pointer;">Button 1</button>
                          <button style="padding: 0.5rem 1rem; cursor: pointer; background: #3b82f6; color: white; border: none; rounded: 4px;">Button 2</button>
                        </div>
                        <div class="box" style="margin-top: 2rem; width: 100px; height: 100px; background: #e2e8f0; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
                          Box
                        </div>
                        <ul style="margin-top: 1.5rem;">
                          <li>Item One</li>
                          <li>Item Two</li>
                          <li>Item Three</li>
                        </ul>
                      </div>
                    </body>
                  </html>
                \`;
              }
              return "";
            };

            const previewContent = (viewMode === "split" || (viewMode === "preview" && previewDevice === "desktop")) ? (
              <div className="w-full h-full bg-white">
                <iframe
                  srcDoc={getSrcDoc()}
                  title="Preview"
                  className="w-full h-full border-none"
                  sandbox="allow-scripts allow-modals allow-forms allow-popups"
                />
              </div>
            ) : (
              <div className="w-full h-full bg-zinc-950 overflow-auto">
                <div className="min-w-full min-h-full flex flex-col items-center justify-center p-4 sm:p-8">
                  <div
                    className={\`transition-all duration-500 ease-in-out relative bg-zinc-900 shadow-2xl overflow-hidden flex flex-col \${
                      previewDevice === "desktop"
                        ? "w-full flex-1 rounded-xl border border-zinc-800 resize-x mx-auto min-w-[320px] max-w-full"
                        : \`flex-shrink-0 ring-1 ring-zinc-800 \${
                            previewDevice === "iphone"
                              ? previewOrientation === "landscape"
                                ? "w-[852px] h-[393px] rounded-[3rem] border-[14px] border-zinc-900"
                                : "w-[393px] h-[852px] rounded-[3rem] border-[14px] border-zinc-900"
                              : previewOrientation === "landscape"
                                ? "w-[1194px] h-[834px] rounded-[2rem] border-[16px] border-zinc-900"
                                : "w-[834px] h-[1194px] rounded-[2rem] border-[16px] border-zinc-900"
                          }\`
                    }\`}
                  >
                    {previewDevice === "desktop" && (
                      <div className="h-12 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 gap-4 shrink-0">
                        <div className="flex gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                          <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                        </div>
                        <div className="flex-1 flex justify-center">
                          <div className="bg-zinc-950 text-zinc-400 text-xs px-4 py-1.5 rounded-md flex items-center gap-2 border border-zinc-800 w-full max-w-md justify-center shadow-inner">
                            <Lock size={12} className="text-zinc-500" />
                            <span>preview.localhost</span>
                          </div>
                        </div>
                        <div className="w-12"></div>
                      </div>
                    )}
                    {previewDevice === "iphone" && (
                      <div
                        className={\`absolute z-20 bg-black rounded-full pointer-events-none transition-all duration-500 \${
                          previewOrientation === "landscape"
                            ? "w-7 h-36 left-3 top-1/2 -translate-y-1/2"
                            : "w-36 h-7 top-3 left-1/2 -translate-x-1/2"
                        }\`}
                      ></div>
                    )}
                    {previewDevice === "ipad" && (
                      <div
                        className={\`absolute z-20 bg-black rounded-full w-2 h-2 pointer-events-none transition-all duration-500 \${
                          previewOrientation === "landscape"
                            ? "left-3 top-1/2 -translate-y-1/2"
                            : "top-3 left-1/2 -translate-x-1/2"
                        }\`}
                      ></div>
                    )}
                    <iframe
                      srcDoc={getSrcDoc()}
                      title="Preview"
                      className={\`w-full flex-1 bg-white border-none relative z-10 \${
                        previewDevice === "iphone"
                          ? "rounded-[2.2rem]"
                          : previewDevice === "ipad"
                            ? "rounded-[1.2rem]"
                            : ""
                      }\`}
                      sandbox="allow-scripts allow-modals allow-forms allow-popups"
                    />
                  </div>
                </div>
              </div>
            );

            return viewMode === "split" ? (
              <PanelGroup direction="horizontal" className="w-full h-full">
                <Panel defaultSize={50} minSize={20} className="relative">
                  {editorContent}
                </Panel>
                <PanelResizeHandle className="w-1 bg-[#2b2b2b] hover:bg-blue-500 transition-colors cursor-col-resize z-50 flex items-center justify-center">
                  <div className="w-0.5 h-8 bg-zinc-600 rounded-full" />
                </PanelResizeHandle>
                <Panel defaultSize={50} minSize={20} className="bg-zinc-950">
                  {previewContent}
                </Panel>
              </PanelGroup>
            ) : viewMode === "code" ? (
              editorContent
            ) : (
              <div className="w-full h-full bg-zinc-950">
                {previewContent}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}`;

  content = content.slice(0, returnIdx) + newReturnView + "\n";
  fs.writeFileSync(filePath, content);
  console.log('Refactored ViewSnippet.tsx');
}

refactorView();
