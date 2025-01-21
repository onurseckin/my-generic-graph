import React, { useEffect, useState } from "react";

export const ANIMATION_SPEEDS = {
  SLOW: 0.3,
  MEDIUM: 0.6,
  FAST: 1,
};

// Helper function to convert hex color to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// Helper function to interpolate between two colors
function interpolateColor(colorA, colorB, factor) {
  const rgbA = hexToRgb(colorA);
  const rgbB = hexToRgb(colorB);

  if (!rgbA || !rgbB) return colorA; // Fallback if invalid hex

  const r = Math.round(rgbA.r + factor * (rgbB.r - rgbA.r));
  const g = Math.round(rgbA.g + factor * (rgbB.g - rgbA.g));
  const b = Math.round(rgbA.b + factor * (rgbB.b - rgbA.b));

  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export default function NodeIcon({ node, time = 0, config }) {
  const [localTime, setLocalTime] = useState(time);

  useEffect(() => {
    let animationFrameId;
    const startTime = performance.now();

    function updateAnimation(currentTime) {
      const dt = (currentTime - startTime) / 1000;
      setLocalTime(dt);
      animationFrameId = requestAnimationFrame(updateAnimation);
    }
    animationFrameId = requestAnimationFrame(updateAnimation);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const { shapes = [], animate } = node;

  const {
    boxWidth = 100,
    boxHeight = 100,
    boxMargin = 20,
    svgWidth = 120,
    svgHeight = 120,
    viewBoxWidth = 100,
    viewBoxHeight = 100,
    viewBoxMinX = 0,
    viewBoxMinY = 0,
    iconUnitSize = 1,
    maxIconSize = 12,
  } = config || {};

  const effectiveIconUnitSize = Math.min(iconUnitSize, maxIconSize);

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      viewBox={`${viewBoxMinX} ${viewBoxMinY} ${viewBoxWidth} ${viewBoxHeight}`}
      style={{ overflow: "visible" }}
    >
      <defs>
        {/* Glow filter */}
        <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Ripple filter */}
        <filter id="ripple" x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02"
            numOctaves="3"
            result="noise"
          >
            <animate
              attributeName="baseFrequency"
              dur="10s"
              values="0.02;0.005;0.02"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" />
        </filter>
      </defs>

      <rect
        x={viewBoxMinX}
        y={viewBoxMinY}
        width={viewBoxWidth}
        height={viewBoxHeight}
        fill="none"
        stroke="rgba(255, 255, 255, 0)"
      />
      <g transform={`scale(${effectiveIconUnitSize})`}>
        {shapes.map((shape, i) => (
          <AnimatedShape
            key={i}
            shape={shape}
            animation={animate}
            time={localTime}
            iconUnitSize={effectiveIconUnitSize}
            boxWidth={boxWidth}
            boxHeight={boxHeight}
            index={i}
          />
        ))}
      </g>
    </svg>
  );
}

function AnimatedShape({
  shape,
  animation,
  time,
  iconUnitSize,
  boxWidth,
  boxHeight,
  index,
}) {
  const { type, children, content, ...rawAttrs } = shape;
  const animatedAttrs = useAnimationAttributes(
    rawAttrs,
    animation,
    time,
    iconUnitSize,
    boxWidth,
    boxHeight,
    index
  );

  if (!animatedAttrs) return null;

  if (type === "g" && Array.isArray(children)) {
    return (
      <g {...animatedAttrs}>
        {children.map((child, i) => (
          <AnimatedShape
            key={i}
            shape={child}
            animation={animation}
            time={time}
            iconUnitSize={iconUnitSize}
            boxWidth={boxWidth}
            boxHeight={boxHeight}
            index={i}
          />
        ))}
      </g>
    );
  }

  switch (type) {
    case "circle":
      return <circle {...animatedAttrs} />;
    case "rect":
      return <rect {...animatedAttrs} />;
    case "path":
      return <path {...animatedAttrs} />;
    case "text":
      return <text {...animatedAttrs}>{content}</text>;
    case "line":
      return <line {...animatedAttrs} />;
    default:
      return null;
  }
}

function useAnimationAttributes(
  attrs,
  animation,
  time,
  iconUnitSize,
  boxWidth,
  boxHeight,
  index
) {
  if (!attrs || !animation || !animation.type) return attrs;

  const result = { ...attrs };
  const { type, params = {} } = animation;

  // Scale numeric attributes
  if (typeof result.r === "number") {
    result.r *= iconUnitSize;
  }
  if (typeof result.width === "number") {
    result.width *= iconUnitSize;
  }
  if (typeof result.height === "number") {
    result.height *= iconUnitSize;
  }
  if (typeof result.x === "number") {
    result.x *= iconUnitSize;
  }
  if (typeof result.y === "number") {
    result.y *= iconUnitSize;
  }

  // Get base position (if defined in attributes)
  const baseX = result.x || 0;
  const baseY = result.y || 0;
  const baseCX = result.cx || 0;
  const baseCY = result.cy || 0;

  switch (type) {
    case "float": // For Quantum Field - gentle floating motion
      const floatSpeed = params.speed || ANIMATION_SPEEDS.SLOW;
      const floatRange = params.range || 3;
      const floatY = Math.sin(time * floatSpeed * 2 * Math.PI) * floatRange;
      const floatX =
        Math.cos(time * floatSpeed * 1.5 * Math.PI) * (floatRange * 0.5);
      result.transform = `translate(${floatX},${floatY})`;
      break;

    case "multiOrbit": // For Quanta - particles orbiting like a wind turbine
      const orbitSpeed = params.speed || ANIMATION_SPEEDS.MEDIUM;
      const orbitRadius = params.radius || 8;
      const angle = time * orbitSpeed * 2 * Math.PI;
      // Calculate positions for three particles with 120-degree spacing
      const particleIndex = index % 3; // Ensure we only use 0, 1, or 2
      const particleAngle = angle + particleIndex * ((2 * Math.PI) / 3);

      // Calculate position relative to the center
      const x = baseCX + orbitRadius * Math.cos(particleAngle);
      const y = baseCY + orbitRadius * Math.sin(particleAngle);

      if (typeof result.cx !== "undefined") {
        result.cx = x;
        result.cy = y;
      } else if (typeof result.x !== "undefined") {
        result.x = x;
        result.y = y;
      }
      break;

    case "constantGlow": // For Energy - pulsing glow effect
      const glowSpeed = ANIMATION_SPEEDS.FAST;
      const glowIntensity = (Math.sin(time * glowSpeed * 2 * Math.PI) + 1) / 2;
      const baseColor = params.glowColor || "#FFFF33";
      result.fill = interpolateColor(baseColor, "#FFFFFF", glowIntensity * 0.3);
      if (result.stroke) {
        result.strokeWidth = 1 + glowIntensity;
        result.filter = "url(#glow)";
      }
      break;

    case "stringVibrate": // For Vibration - wave-like motion
      const vibrateSpeed = params.speed || ANIMATION_SPEEDS.FAST;
      const vibrateAmp = params.amplitude || 2;
      const wave = (x) =>
        Math.sin(x * 0.5 + time * vibrateSpeed * 2 * Math.PI) * vibrateAmp;
      const points = [];
      const width = params.width || 30; // Allow customizable width
      for (let i = -width / 2; i <= width / 2; i += 1) {
        points.push(`${baseX + i},${baseY + wave(i)}`);
      }
      result.d = `M ${points.join(" L ")}`;
      break;

    case "speakerBeat": // For Resonance - pulsing with ripple effect
      const beatSpeed = params.speed || ANIMATION_SPEEDS.MEDIUM;
      const scaleRange = params.scaleRange || 0.2;
      const beatPhase = (Math.sin(time * beatSpeed * 2 * Math.PI) + 1) / 2;
      const scale = 1 + scaleRange * beatPhase;
      // Scale from the center of the shape
      result.transform = `translate(${baseCX},${baseCY}) scale(${scale}) translate(${-baseCX},${-baseCY})`;
      result.opacity = 0.8 + beatPhase * 0.2;
      result.filter = "url(#ripple)";
      break;

    case "shake": // For Pattern - subtle shaking motion
      const shakeSpeed = params.speed || ANIMATION_SPEEDS.SLOW;
      const shakeAmp = params.amplitude || 1.5;
      const shakeX = Math.sin(time * shakeSpeed * 4 * Math.PI) * shakeAmp;
      const shakeY = Math.cos(time * shakeSpeed * 3 * Math.PI) * shakeAmp;
      result.transform = `translate(${baseX + shakeX},${baseY + shakeY})`;
      break;

    case "threeBarsReorder": // For Order - bars reordering
      const reorderInterval = params.interval || 1;
      const reorderPhase = Math.floor(time / reorderInterval) % 3;
      const barSpacing = params.spacing || 10; // Allow customizable spacing
      const positions = [{ y: -barSpacing }, { y: 0 }, { y: barSpacing }];
      const positionIndex =
        (((reorderPhase + (index || 0)) % positions.length) +
          positions.length) %
        positions.length;
      const newPosition = positions[positionIndex];
      if (newPosition) {
        // Keep x position relative to base, only modify y
        result.y = baseY + newPosition.y;
        result.transition = "transform 0.3s ease-in-out";
      }
      break;

    case "swapColors": // For State - quantum state representation
      const swapInterval = params.interval || 0.5;
      const swapPhase = Math.floor(time / swapInterval) % 2;
      const color1 = params.color1 || "#0000FF";
      const color2 = params.color2 || "#FF0000";
      const transitionFactor = (time % swapInterval) / swapInterval;
      result.fill = interpolateColor(
        swapPhase === 0 ? color1 : color2,
        swapPhase === 0 ? color2 : color1,
        transitionFactor
      );
      break;

    case "stretchX": // For Encoding - stretching brackets
      const stretchSpeed = params.speed || ANIMATION_SPEEDS.MEDIUM;
      const stretchAmp = params.amplitude || 0.2;
      const stretch =
        1 + Math.sin(time * stretchSpeed * 2 * Math.PI) * stretchAmp;

      // For path elements, we want to scale from the center
      if (result.d) {
        result.transform = `scale(${stretch}, 1)`;
        result.style = {
          transformOrigin: "center",
          transformBox: "fill-box",
        };
      }
      // For text elements, maintain position while scaling
      else if (result.content) {
        const currentX = result.x || 0;
        result.transform = `translate(${currentX * (1 - stretch)}) scale(${stretch}, 1)`;
        result.style = {
          transformOrigin: "center",
          transformBox: "fill-box",
        };
      }
      break;

    case "randomColorChange": // For Entropy - chaos representation
      const entropySpeed = params.speed || 0.1;
      if (
        Math.floor(time / entropySpeed) >
        Math.floor((time - 0.016) / entropySpeed)
      ) {
        result.fill = `#${Math.floor(Math.random() * 16777215)
          .toString(16)
          .padStart(6, "0")}`;
      }
      break;

    case "bitsShuffle": // For Bits - binary state changes
      const bitsInterval = params.interval || 0.5;
      const bitPhase = Math.floor(time / bitsInterval) % 2;
      if (result.content) {
        result.content = bitPhase === 0 ? "0 1" : "1 0";
      }
      break;

    case "orbit": // For Information - orbital motion with glow
      const infoSpeed = params.speed || ANIMATION_SPEEDS.SLOW;
      const infoRadius = params.radius || 6;
      // Orbit relative to the shape's base position
      const orbitX =
        baseCX + Math.cos(time * infoSpeed * 2 * Math.PI) * infoRadius;
      const orbitY =
        baseCY + Math.sin(time * infoSpeed * 2 * Math.PI) * infoRadius;
      result.transform = `translate(${orbitX - baseCX},${orbitY - baseCY})`;
      result.filter = "url(#glow)";
      break;

    case "rapidColorChange": {
      const colors = [
        "#FF0000", // Red
        "#00FF00", // Green
        "#0000FF", // Blue
        "#FFFF00", // Yellow
        "#FF00FF", // Magenta
        "#00FFFF", // Cyan
        "#FFA500", // Orange
        "#800080", // Purple
      ];
      const interval = 0.1; // 0.1 seconds per color
      const colorIndex = Math.floor(time / interval) % colors.length;
      result.fill = colors[colorIndex];
      result.stroke = colors[(colorIndex + 1) % colors.length];
      break;
    }

    default:
      break;
  }

  return result;
}
