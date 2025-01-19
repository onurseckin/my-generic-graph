import { useRef } from "react";

function TextEditor({ content, onChange, onZoomIn, onZoomReset, onZoomOut }) {
  const editorRef = useRef(null);

  return (
    <div className="editor-container">
      <textarea
        ref={editorRef}
        value={content}
        onChange={onChange}
        className="editor-textarea"
        spellCheck="false"
      />
      <div className="editor-zoom-controls">
        <button className="zoom-button" onClick={onZoomIn}>
          +
        </button>
        <button className="zoom-button" onClick={onZoomReset}>
          Reset
        </button>
        <button className="zoom-button" onClick={onZoomOut}>
          -
        </button>
      </div>
    </div>
  );
}

export default TextEditor;
