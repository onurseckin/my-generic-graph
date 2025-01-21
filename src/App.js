import React, { useState, useEffect, useCallback } from "react";
import { formatGraphData } from "./utils/layoutHelper";
import TextEditor from "./components/TextEditor";
import GraphView from "./components/GraphView";
import { useZoom } from "./hooks/useZoom";
import { Button } from "./components/ui/button";
import { ThemeProvider } from "./components/ThemeProvider";
import {
  PlayIcon,
  SaveIcon,
  ZoomInIcon,
  ZoomOutIcon,
  RefreshCwIcon,
} from "lucide-react";
import graphData from "./data/editorContent.json";
import { ToastContextProvider } from "./components/ui/toast-context";
import { useToast } from "./components/ui/toast-context";

export default function App() {
  return (
    <ToastContextProvider>
      <AppContent />
    </ToastContextProvider>
  );
}

function AppContent() {
  const { zoom, handleZoom, handleReset } = useZoom();
  const { showToast } = useToast();

  const [data, setData] = useState(() => {
    try {
      return graphData || { nodes: [], edges: [], layoutConfig: {} };
    } catch (error) {
      return { nodes: [], edges: [], layoutConfig: {} };
    }
  });

  const [editorContent, setEditorContent] = useState(
    JSON.stringify(data, null, 2)
  );
  const [visualData, setVisualData] = useState(data);

  const handleEditorChange = (newContent) => {
    setEditorContent(newContent);
  };

  const handlePlay = useCallback(() => {
    try {
      const formattedJson = formatGraphData(editorContent);
      const parsedData = JSON.parse(formattedJson);
      setEditorContent(formattedJson);
      setData(parsedData);
      setVisualData(parsedData);
      showToast("Graph rendered successfully", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  }, [editorContent, showToast]);

  const handleSave = async () => {
    try {
      const response = await fetch("http://localhost:3001/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: editorContent,
      });

      if (!response.ok) {
        throw new Error("Failed to save file");
      }

      const result = await response.json();
      if (result.success) {
        showToast("File saved successfully", "success");
      }
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        handlePlay();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handlePlay]);

  return (
    <ThemeProvider>
      <main className="flex h-screen">
        <div className="w-2/5 min-w-[400px] border-r border-border flex flex-col h-full bg-background">
          <div className="flex-1 min-h-0">
            <TextEditor
              value={editorContent}
              onChange={handleEditorChange}
              onZoomIn={() => handleZoom("in")}
              onZoomReset={handleReset}
              onZoomOut={() => handleZoom("out")}
              onPlay={handlePlay}
            />
          </div>
          <div className="shrink-0 flex justify-between items-center p-4 border-t border-border bg-background">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleZoom("in")}
                className="bg-background/80 backdrop-blur-sm"
              >
                <ZoomInIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleReset}
                className="bg-background/80 backdrop-blur-sm"
              >
                <RefreshCwIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleZoom("out")}
                className="bg-background/80 backdrop-blur-sm"
              >
                <ZoomOutIcon className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button onClick={handlePlay} className="gap-2">
                <PlayIcon className="h-4 w-4" />
                Play
              </Button>
              <Button variant="outline" onClick={handleSave} className="gap-2">
                <SaveIcon className="h-4 w-4" />
                Save
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-black">
          <GraphView data={visualData} zoom={zoom} />
        </div>
      </main>
    </ThemeProvider>
  );
}
