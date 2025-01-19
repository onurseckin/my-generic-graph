import { useState, useCallback } from "react";

export function useZoom(initialZoom = 1) {
  const [zoom, setZoom] = useState(initialZoom);

  const handleZoom = useCallback((direction) => {
    setZoom((prev) => {
      const delta = direction === "in" ? 0.1 : -0.1;
      const newZoom = prev + delta;
      return Math.max(0.1, Math.min(3, newZoom)); // Limit zoom range
    });
  }, []);

  const handleReset = useCallback(() => {
    setZoom(initialZoom);
  }, [initialZoom]);

  return { zoom, handleZoom, handleReset };
}
