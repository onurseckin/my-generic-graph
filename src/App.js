import React, { useState } from "react";
import GraphEngine from "./GraphEngine";
import { formatGraphData } from "./utils/layoutHelper";
import TextEditor from "./components/TextEditor";
import GraphView from "./components/GraphView";
import { useZoom } from "./hooks/useZoom";

export default function App() {
  const { zoom, handleZoom, handleReset } = useZoom();
  // Load and parse the JSON data
  const [graphData, setGraphData] = useState(() => {
    try {
      const data = require("./editorContent.json");
      return data || { nodes: [], edges: [], layoutConfig: {} };
    } catch (error) {
      return { nodes: [], edges: [], layoutConfig: {} };
    }
  });

  // Add state for editor content and visualization
  const [editorContent, setEditorContent] = useState(
    JSON.stringify(graphData, null, 2)
  );
  const [visualData, setVisualData] = useState(graphData);

  const handleEditorChange = (e) => {
    setEditorContent(e.target.value);
  };

  const handlePlay = () => {
    try {
      const parsedData = JSON.parse(editorContent);
      const formattedJson = formatGraphData(
        JSON.stringify(parsedData, null, 2)
      );
      const finalData = JSON.parse(formattedJson);
      setGraphData(finalData);
      setVisualData(finalData);
    } catch (error) {
      console.error("Failed to parse or format JSON:", error);
    }
  };

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
        console.log("File saved successfully");
      }
    } catch (e) {
      console.error("Save Error:", e);
      alert("Failed to save file");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        color: "white",
        background: "black",
      }}
    >
      {/* Left side - Text Editor */}
      <div
        style={{
          flex: "0 0 400px",
          padding: "1rem",
          borderRight: "1px solid gray",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          background: "#1e1e1e",
        }}
      >
        {/* Buttons */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginBottom: "1rem",
          }}
        >
          <button
            onClick={handlePlay}
            style={{
              padding: "0.5rem 1rem",
              background: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            ▶ Play
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: "0.5rem 1rem",
              background: "#2196F3",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Save
          </button>
        </div>

        <TextEditor
          content={editorContent}
          onChange={handleEditorChange}
          onZoomIn={() => handleZoom("in")}
          onZoomReset={handleReset}
          onZoomOut={() => handleZoom("out")}
        />
      </div>

      {/* Right side - Graph View */}
      <div style={{ flex: 1, height: "100vh", background: "black" }}>
        <GraphView
          data={visualData}
          zoom={zoom}
          onZoomIn={() => handleZoom("in")}
          onZoomReset={handleReset}
          onZoomOut={() => handleZoom("out")}
        />
      </div>
    </div>
  );
}
