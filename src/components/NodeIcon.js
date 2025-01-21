import React, { useEffect, useRef, useState } from "react";

const ANIMATION_SPEEDS = {
  SLOW: 0.2,
  MEDIUM: 0.3,
  FAST: 0.4,
};

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

  function renderShape(shape, index) {
    const { type, children, content, ...baseAttrs } = shape;

    if (type === "g" && Array.isArray(children)) {
      return (
        <g key={index}>{children.map((child, i) => renderShape(child, i))}</g>
      );
    }

    if (type === "text" && baseAttrs.fontSize) {
      baseAttrs.fontSize = baseAttrs.fontSize * effectiveIconUnitSize;
    }

    switch (type) {
      case "circle":
        return <circle key={index} {...baseAttrs} />;
      case "rect":
        return <rect key={index} {...baseAttrs} />;
      case "line":
        return <line key={index} {...baseAttrs} />;
      case "path":
        return <path key={index} {...baseAttrs} />;
      case "text":
        return (
          <text key={index} {...baseAttrs}>
            {content}
          </text>
        );
      default:
        return null;
    }
  }

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      viewBox={`${viewBoxMinX} ${viewBoxMinY} ${viewBoxWidth} ${viewBoxHeight}`}
      style={{ overflow: "visible" }}
    >
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
}) {
  const { type, ...attrs } = shape;
  const animatedAttrs = useAnimationAttributes(
    attrs,
    animation,
    time,
    iconUnitSize,
    boxWidth,
    boxHeight
  );

  switch (type) {
    case "circle":
      return <circle {...animatedAttrs} />;
    case "rect":
      return <rect {...animatedAttrs} />;
    case "path":
      return <path {...animatedAttrs} />;
    case "text":
      const { content, ...textAttrs } = animatedAttrs;
      return <text {...textAttrs}>{content}</text>;
    case "line":
      return <line {...animatedAttrs} />;
    case "g":
      return (
        <g {...animatedAttrs}>
          {shape.children?.map((child, i) => (
            <AnimatedShape
              key={i}
              shape={child}
              animation={animation}
              time={time}
              iconUnitSize={iconUnitSize}
              boxWidth={boxWidth}
              boxHeight={boxHeight}
            />
          ))}
        </g>
      );
    default:
      return null;
  }
}

function useAnimationAttributes(
  baseAttrs,
  animation = {},
  time,
  iconUnitSize,
  boxWidth,
  boxHeight
) {
  const attrs = { ...baseAttrs };
  const { type, params = {} } = animation;

  if (typeof attrs.r === "number") {
    attrs.r *= iconUnitSize;
  }
  if (typeof attrs.width === "number") {
    attrs.width *= iconUnitSize;
  }
  if (typeof attrs.height === "number") {
    attrs.height *= iconUnitSize;
  }
  if (typeof attrs.x === "number") {
    attrs.x *= iconUnitSize;
  }
  if (typeof attrs.y === "number") {
    attrs.y *= iconUnitSize;
  }

  switch (type) {
    case "spin":
      const spinSpeed = params.speed || ANIMATION_SPEEDS.MEDIUM;
      attrs.transform = `rotate(${(time * spinSpeed * 360) % 360})`;
      break;

    case "wave":
      const waveAmp = params.amplitude || 3;
      const waveSpeed = params.speed || ANIMATION_SPEEDS.MEDIUM;
      const waveOffset = waveAmp * Math.sin(time * waveSpeed * 2 * Math.PI);
      attrs.transform = `translate(${
        params.horizontal ? waveOffset : 0
      },${params.horizontal ? 0 : waveOffset})`;
      break;

    case "flow":
      const flowSpeed = params.speed || 50;
      attrs.strokeDasharray = params.flowPattern || "3,3";
      attrs.strokeDashoffset = time * flowSpeed;
      break;

    case "pulse":
      const pulseSpeed = params.speed || ANIMATION_SPEEDS.MEDIUM;
      const pulseIntensity =
        (Math.sin(time * pulseSpeed * 2 * Math.PI) + 1) / 2;

      if (attrs.fill && params.colors) {
        attrs.fill = interpolateColor(
          params.colors[0],
          params.colors[1],
          pulseIntensity
        );
      }
      if (attrs.stroke && params.strokeColors) {
        attrs.stroke = interpolateColor(
          params.strokeColors[0],
          params.strokeColors[1],
          pulseIntensity
        );
      }
      if (params.scale) {
        const scaleRange = params.scaleRange || 0.2;
        let scale = 1 + scaleRange * pulseIntensity;

        const maxDimension = Math.min(boxWidth, boxHeight);
        const maxAllowedScale = (maxDimension - 2) / maxDimension;
        if (scale > maxAllowedScale) scale = maxAllowedScale;

        attrs.transform = `${attrs.transform || ""} scale(${scale})`;
      }
      break;

    case "highlight":
      const highlightSpeed = params.speed || ANIMATION_SPEEDS.MEDIUM;
      const highlightIntensity =
        (Math.sin(time * highlightSpeed * 2 * Math.PI) + 1) / 2;

      if (params.targetAttr === "stroke" && attrs.stroke) {
        attrs.stroke = interpolateColor(
          attrs.stroke,
          params.highlightColor || "#fff",
          highlightIntensity * (params.intensity || 0.5)
        );
      } else if (params.targetAttr === "fill" && attrs.fill) {
        attrs.fill = interpolateColor(
          attrs.fill,
          params.highlightColor || "#fff",
          highlightIntensity * (params.intensity || 0.5)
        );
      }
      break;

    case "float":
      const floatSpeed = params.speed || ANIMATION_SPEEDS.MEDIUM;
      const range = params.range || 3;
      const dx = range * Math.sin(time * floatSpeed * 2.1 * Math.PI);
      const dy = range * Math.cos(time * floatSpeed * 1.9 * Math.PI);
      attrs.transform = `translate(${dx},${dy})`;
      break;

    case "orbit":
      const orbitSpeed = params.speed || ANIMATION_SPEEDS.MEDIUM;
      const radius = params.radius || 2;
      const angle = time * orbitSpeed * 2 * Math.PI;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      attrs.transform = `translate(${x},${y})`;
      break;

    case "shake":
      const shakeSpeed = params.speed || ANIMATION_SPEEDS.MEDIUM;
      const amp = params.amplitude || 3;
      const offsetX = amp * Math.sin(time * shakeSpeed * 2 * Math.PI);
      const offsetY = amp * Math.cos(time * shakeSpeed * 2 * Math.PI);
      attrs.transform = `translate(${offsetX},${offsetY})`;
      break;

    case "ripple":
      const rippleSpeed = params.speed || ANIMATION_SPEEDS.MEDIUM;
      const minR = params.minRadius || 5;
      const maxR = params.maxRadius || 15;
      const sinVal = (Math.sin(time * rippleSpeed * 2 * Math.PI) + 1) / 2;
      if (typeof attrs.r === "number") {
        attrs.r = minR + (maxR - minR) * sinVal;
      }
      if (attrs.stroke && params.strokeColors) {
        attrs.stroke = interpolateColor(
          params.strokeColors[0],
          params.strokeColors[1],
          sinVal
        );
      }
      break;

    case "vibrate":
      const vibrateSpeed = params.speed || ANIMATION_SPEEDS.MEDIUM;
      const vibrateAmp = params.amplitude || 2;
      const vibX = vibrateAmp * Math.sin(time * vibrateSpeed * 2 * Math.PI * 4);
      attrs.transform = `translate(${vibX}, 0)`;
      break;

    case "reorder":
      const reorderSpeed = params.speed || ANIMATION_SPEEDS.MEDIUM;
      const reorderOffset = 4 * Math.sin(time * reorderSpeed * 2 * Math.PI);
      attrs.transform = `translate(0, ${reorderOffset})`;
      break;

    case "blink":
      const blinkInterval = params.interval || 0.5;
      const cycle = Math.floor(time / blinkInterval) % 2;
      if (attrs.fill && (params.colorsLeft || params.colorsRight)) {
        // This single shape might be the left or right circle; you'd handle logic by ID or index
        // For simplicity, assume each shape is either "left" or "right".
        // Alternatively, you can convert shapes to a 'g' and handle children differently.
      }
      break;

    case "rotateTrio":
      const rotateSpeed = params.speed || ANIMATION_SPEEDS.MEDIUM;
      attrs.transform = `rotate(${(time * rotateSpeed * 360) % 360})`;
      break;

    case "beat":
      const beatSpeed = params.speed || ANIMATION_SPEEDS.MEDIUM;
      const beatScaleRange = params.scaleRange || 0.4;
      const beatIntensity = (Math.sin(time * beatSpeed * 2 * Math.PI) + 1) / 2;
      const beatScale = 1 + beatScaleRange * beatIntensity;
      attrs.transform = `scale(${beatScale})`;
      break;

    default:
      if (type) {
        console.warn(`Unknown animation type: ${type}`);
      }
  }

  return attrs;
}

function interpolateColor(color1, color2, progress) {
  const c1 = parseColor(color1);
  const c2 = parseColor(color2);

  return `rgb(${Math.round(c1.r + (c2.r - c1.r) * progress)},${Math.round(
    c1.g + (c2.g - c1.g) * progress
  )},${Math.round(c1.b + (c2.b - c1.b) * progress)})`;
}

function parseColor(color) {
  if (color.startsWith("#")) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return { r, g, b };
  }
  return { r: 255, g: 255, b: 255 }; // fallback to white
}

export { ANIMATION_SPEEDS };
