const fs = require('fs');

function refactorHome() {
  const filePath = 'src/pages/Home.tsx';
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(/  const \[isDockVisible, setIsDockVisible\] = useState\(true\);\n/, '');
  content = content.replace(/padding: \{ top: 24, bottom: 120 \}/, 'padding: { top: 16, bottom: 16 }');
  content = content.replace(/p-4 sm:p-8 pb-32/g, 'p-4 sm:p-8');

  const searchStart = '  return (\n    <div className="relative h-screen w-screen bg-[#1e1e1e] overflow-hidden">';
  const returnIdx = content.indexOf(searchStart);

  if (returnIdx === -1) {
    console.error(`Return statement not found in Home.tsx`);
    return;
  }

  const newReturnHome = `  return (
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
                  onClick={() => window.dispatchEvent(new CustomEvent("open_history"))}
                >
                  <History size={20} />
                </Button>
              }
            />
            <TooltipContent side="right">History</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex flex-col items-center gap-4">
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                >
                  <Settings size={20} />
                </Button>
              }
            />
            <PopoverContent
              className="w-80 sm:w-96 p-6 bg-zinc-900/95 backdrop-blur-xl border-zinc-800/50 rounded-2xl shadow-2xl mb-4 ml-4"
              side="right"
              align="end"
            >
              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-zinc-400">
                    Description
                  </Label>
                  <Input
                    id="description"
                    placeholder="Brief description..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-zinc-900/50 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags" className="text-zinc-400">
                    Tags
                  </Label>
                  <Input
                    id="tags"
                    placeholder="react, node, sql..."
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="bg-zinc-900/50 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-400">Visibility</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={visibility === "public" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setVisibility("public")}
                      className="w-full justify-center rounded-xl h-10"
                    >
                      <Globe size={14} className="mr-2" /> Public
                    </Button>
                    <Button
                      type="button"
                      variant={
                        visibility === "unlisted" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setVisibility("unlisted")}
                      className="w-full justify-center rounded-xl h-10"
                    >
                      <EyeOff size={14} className="mr-2" /> Unlisted
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-zinc-400">
                    Password Protection
                  </Label>
                  <div className="relative">
                    <Lock
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                    />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Optional password"
                      className="pl-9 bg-zinc-900/50 rounded-xl"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Top Bar */}
        <div className="h-12 bg-[#1e1e1e] border-b border-[#2b2b2b] flex items-center justify-between px-4 shrink-0 z-40 gap-4 overflow-x-auto no-scrollbar">
          {/* File Info */}
          <div className="flex items-center gap-2">
            <Code2 size={18} className="text-zinc-400 shrink-0" />
            <Input
              placeholder="Untitled Snippet"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 w-48 bg-transparent border-none focus-visible:ring-1 focus-visible:ring-zinc-700 shadow-none text-zinc-100 font-medium px-2 rounded-md"
            />
          </div>

          {/* Actions & Toggles */}
          <div className="flex items-center gap-3">
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                if (e.target.value !== "html" && e.target.value !== "css") setViewMode("code");
              }}
              className="h-8 rounded-md border border-zinc-800 bg-[#1e1e1e] px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500 cursor-pointer"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>

            {(language === "html" || language === "css") && (
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

            <Button
              className="h-8 rounded-md px-4 shadow-sm hover:shadow-md transition-all text-xs text-white"
              onClick={handleSubmit}
              disabled={isSubmitting || !code.trim()}
            >
              <Share2 size={13} className="mr-1.5" />
              {isSubmitting ? "Saving..." : "Share"}
            </Button>
          </div>
        </div>

        {/* Editor / Preview */}
        <div className="flex-1 relative overflow-hidden">
          {viewMode === "split" ? (
            <PanelGroup direction="horizontal" className="w-full h-full">
              <Panel defaultSize={50} minSize={20}>
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
          )}
        </div>
      </div>
    </div>
  );
}`;

  content = content.slice(0, returnIdx) + newReturnHome + "\n";
  fs.writeFileSync(filePath, content);
  console.log('Refactored Home.tsx');
}

refactorHome();
