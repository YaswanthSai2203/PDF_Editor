"use client";

import type { Annotation, HighlightAnnotationData, ShapeAnnotationData, FreehandAnnotationData, TextAnnotationData } from "@/types/annotation";

interface AnnotationRendererProps {
  annotation: Annotation;
  scale: number;
  isSelected: boolean;
  onSelect: () => void;
}

/**
 * Renders a single annotation as SVG elements.
 * All coordinates in annotation.data are in PDF-unit space (scale=1).
 * We apply scale via an SVG group transform so annotations match the rendered page.
 */
export function AnnotationRenderer({
  annotation,
  scale,
  isSelected,
  onSelect,
}: AnnotationRendererProps) {
  const { type, data } = annotation;

  const selectionStyle = isSelected
    ? { filter: "drop-shadow(0 0 2px rgb(59 130 246 / 0.8))" }
    : {};

  function renderShape(d: ShapeAnnotationData) {
    const { rect, color = "#FF0000", opacity = 0.5, strokeWidth = 2 } = d;
    const sx = rect.x * scale;
    const sy = rect.y * scale;
    const sw = rect.width * scale;
    const sh = rect.height * scale;

    if (type === "RECTANGLE") {
      return (
        <rect
          x={sx} y={sy} width={sw} height={sh}
          stroke={color} strokeWidth={strokeWidth}
          fill="none" opacity={opacity}
          style={selectionStyle}
        />
      );
    }

    if (type === "ELLIPSE") {
      return (
        <ellipse
          cx={sx + sw / 2} cy={sy + sh / 2}
          rx={sw / 2} ry={sh / 2}
          stroke={color} strokeWidth={strokeWidth}
          fill="none" opacity={opacity}
          style={selectionStyle}
        />
      );
    }

    if (type === "LINE" || type === "ARROW") {
      const markerEnd = type === "ARROW" ? `url(#arrow-${annotation.id})` : undefined;
      return (
        <>
          {type === "ARROW" && (
            <defs>
              <marker
                id={`arrow-${annotation.id}`}
                markerWidth="10" markerHeight="7"
                refX="10" refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill={color} />
              </marker>
            </defs>
          )}
          <line
            x1={sx} y1={sy}
            x2={sx + sw} y2={sy + sh}
            stroke={color} strokeWidth={strokeWidth}
            opacity={opacity}
            markerEnd={markerEnd}
            style={selectionStyle}
          />
        </>
      );
    }

    return null;
  }

  function renderHighlight(d: HighlightAnnotationData) {
    const { rects, color = "#FFEB3B", opacity = 0.35 } = d;
    const fillOpacity = type === "HIGHLIGHT" ? opacity : 0;
    const strokeColor = type === "UNDERLINE" ? color : type === "STRIKETHROUGH" ? color : "none";

    return (
      <g style={selectionStyle}>
        {rects.map((rect, i) => {
          const sx = rect.x * scale;
          const sy = rect.y * scale;
          const sw = rect.width * scale;
          const sh = rect.height * scale;

          return (
            <g key={i}>
              <rect
                x={sx} y={sy} width={sw} height={sh}
                fill={color} fillOpacity={fillOpacity}
                stroke="none"
              />
              {type === "UNDERLINE" && (
                <line
                  x1={sx} y1={sy + sh}
                  x2={sx + sw} y2={sy + sh}
                  stroke={strokeColor} strokeWidth={1.5}
                  opacity={opacity}
                />
              )}
              {type === "STRIKETHROUGH" && (
                <line
                  x1={sx} y1={sy + sh / 2}
                  x2={sx + sw} y2={sy + sh / 2}
                  stroke={strokeColor} strokeWidth={1.5}
                  opacity={opacity}
                />
              )}
            </g>
          );
        })}
      </g>
    );
  }

  function renderFreehand(d: FreehandAnnotationData) {
    const { points, color = "#000000", opacity = 1, strokeWidth = 2 } = d;
    if (points.length < 2) return null;

    const pathParts: string[] = [`M ${points[0].x * scale} ${points[0].y * scale}`];
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const mx = ((prev.x + curr.x) / 2) * scale;
      const my = ((prev.y + curr.y) / 2) * scale;
      pathParts.push(`Q ${prev.x * scale} ${prev.y * scale} ${mx} ${my}`);
    }

    return (
      <path
        d={pathParts.join(" ")}
        stroke={color} strokeWidth={strokeWidth}
        fill="none" opacity={opacity}
        strokeLinecap="round" strokeLinejoin="round"
        style={selectionStyle}
      />
    );
  }

  function renderText(d: TextAnnotationData) {
    const { rect, content, color = "#000000", fontSize = 14, fontFamily = "sans-serif" } = d;
    return (
      <foreignObject
        x={rect.x * scale} y={rect.y * scale}
        width={rect.width * scale} height={Math.max(rect.height * scale, 24)}
        style={selectionStyle}
      >
        <div
          style={{
            fontSize: `${fontSize * scale}px`,
            fontFamily,
            color,
            wordBreak: "break-word",
            lineHeight: 1.4,
          }}
        >
          {content}
        </div>
      </foreignObject>
    );
  }

  const hitArea = (() => {
    const d = data as unknown as Record<string, unknown>;
    const rect = d.rect as { x: number; y: number; width: number; height: number } | undefined;
    if (rect) {
      return (
        <rect
          x={rect.x * scale - 4} y={rect.y * scale - 4}
          width={rect.width * scale + 8} height={rect.height * scale + 8}
          fill="transparent"
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          className="cursor-pointer"
        />
      );
    }
    return null;
  })();

  return (
    <g>
      {(type === "RECTANGLE" || type === "ELLIPSE" || type === "LINE" || type === "ARROW") &&
        renderShape(data as ShapeAnnotationData)}
      {(type === "HIGHLIGHT" || type === "UNDERLINE" || type === "STRIKETHROUGH") &&
        renderHighlight(data as HighlightAnnotationData)}
      {type === "FREEHAND" && renderFreehand(data as FreehandAnnotationData)}
      {type === "TEXT" && renderText(data as TextAnnotationData)}
      {hitArea}
    </g>
  );
}
