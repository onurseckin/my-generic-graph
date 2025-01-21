import React from "react";

const ANIMATION_SPEEDS = {
  SLOW: 0.2,
  MEDIUM: 0.3,
  FAST: 0.4,
};

export default function NodeIcon({ node, time = 0, config }) {
  const { shapes = [], animate } = node;
  const {
    boxWidth,
    boxHeight,
    boxMargin,
    svgWidth = boxWidth + 2 * boxMargin,
    svgHeight = boxHeight + 2 * boxMargin,
    viewBoxWidth = svgWidth,
    viewBoxHeight = svgHeight,
    viewBoxMinX = -svgWidth / 2,
    viewBoxMinY = -svgHeight / 2,
  } = config || {};

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      viewBox={`${viewBoxMinX} ${viewBoxMinY} ${viewBoxWidth} ${viewBoxHeight}`}
      style={{ overflow: "visible" }}
    >
      {/* Invisible bounding box */}
      <rect
        x={-boxWidth / 2 - boxMargin}
        y={-boxHeight / 2 - boxMargin}
        width={boxWidth + 2 * boxMargin}
        height={boxHeight + 2 * boxMargin}
        fill="none"
        stroke="rgba(255, 255, 255, 0)"
        strokeWidth="1"
      />
      <g>
        {shapes.map((shape, i) => (
          <AnimatedShape
            key={i}
            shape={shape}
            animation={animate}
            time={time}
          />
        ))}
      </g>
    </svg>
  );
}

function AnimatedShape({ shape, animation, time }) {
  const { type, ...attrs } = shape;
  const animatedAttrs = useAnimationAttributes(attrs, animation, time);

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
            />
          ))}
        </g>
      );
    default:
      return null;
  }
}

function useAnimationAttributes(baseAttrs, animation = {}, time) {
  const attrs = { ...baseAttrs };
  const { type, params = {} } = animation;

  switch (type) {
    case "spin":
      const spinSpeed = params.speed || ANIMATION_SPEEDS.MEDIUM;
      attrs.transform = `rotate(${(time * spinSpeed * 360) % 360})`;
      break;

    case "wave":
      const waveAmp = params.amplitude || 3;
      const waveSpeed = params.speed || ANIMATION_SPEEDS.MEDIUM;
      const waveOffset = waveAmp * Math.sin(time * waveSpeed * 2 * Math.PI);
      attrs.transform = `translate(${params.horizontal ? waveOffset : 0},${params.horizontal ? 0 : waveOffset})`;
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
        const scale = 1 + (params.scaleRange || 0.2) * pulseIntensity;
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
  return { r: 0, g: 0, b: 0 };
}

export { ANIMATION_SPEEDS };
