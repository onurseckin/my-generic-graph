import React, { useState, useEffect } from "react";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-json";
import "prismjs/themes/prism.css";
import "../styles/prism-custom.css";
import { Button } from "./ui/button";
import { ZoomInIcon, ZoomOutIcon, RefreshCwIcon } from "lucide-react";

export default function TextEditor({
  value,
  onChange,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onPlay,
}) {
  const [code, setCode] = useState("");

  useEffect(() => {
    const initialValue =
      typeof value === "string" ? value : JSON.stringify(value, null, 2);
    setCode(initialValue);
  }, [value]);

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    onChange(newCode);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      onPlay();
    }
  };

  // Custom highlight function to ensure consistent styling
  const customHighlight = (code) => {
    const highlighted = highlight(code || "", languages.json, "json");
    return highlighted.replace(
      /<span class="token punctuation">(:)<\/span>/g,
      '<span style="color: rgba(255, 255, 255, 0.5); background: none; text-shadow: none;">$1</span>'
    );
  };

  return (
    <div className="h-full flex flex-col relative">
      <div className="absolute -left-14 top-0 flex flex-col gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onZoomIn}
          className="bg-background/80 backdrop-blur-sm"
        >
          <ZoomInIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onZoomReset}
          className="bg-background/80 backdrop-blur-sm"
        >
          <RefreshCwIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onZoomOut}
          className="bg-background/80 backdrop-blur-sm"
        >
          <ZoomOutIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 rounded-md border border-input">
        <Editor
          value={code}
          onValueChange={handleCodeChange}
          onKeyDown={handleKeyDown}
          highlight={customHighlight}
          padding={10}
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 14,
            backgroundColor: "rgb(0, 0, 0)",
            color: "white",
          }}
          className="w-full min-h-full"
        />
      </div>
    </div>
  );
}
