import { useState } from "react";

export function useZoom(initialZoom = 1) {
  const [zoom, setZoom] = useState(initialZoom);

  const handleZoom = (direction) => {
    setZoom((prev) => {
      if (direction === "in") return Math.min(prev + 0.2, 3);
      return Math.max(prev - 0.2, 0.3);
    });
  };

  const handleReset = () => setZoom(1);

  return { zoom, handleZoom, handleReset };
}
