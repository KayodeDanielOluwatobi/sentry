"use client";

import React, { useMemo } from "react";

interface DataPoint {
  label: string;
  values: number[]; // can have multiple lines (e.g. [3.20, 3.21, 3.19, 3.20])
  isOffline?: boolean;
}

interface SentryLineChartProps {
  data: DataPoint[];
  lineColors: string[];
  labels: string[];
  curved?: boolean;
  theme?: "light" | "dark";
  height?: number;
  yMin?: number;
  yMax?: number;
}

export default function SentryLineChart({
  data,
  lineColors,
  labels,
  curved = true,
  theme = "light",
  height = 220,
  yMin,
  yMax,
}: SentryLineChartProps) {
  const isDark = theme === "dark";
  const gridColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)";
  const textColor = isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)";

  // Compute boundaries
  const allValues = useMemo(() => data.flatMap(d => d.values), [data]);
  
  const minVal = useMemo(() => {
    if (yMin !== undefined) return yMin;
    if (allValues.length === 0) return 0;
    const rawMin = Math.min(...allValues);
    const rawMax = Math.max(...allValues);
    const range = rawMax - rawMin;
    return range > 0 ? rawMin - range * 0.1 : rawMin * 0.95;
  }, [allValues, yMin]);

  const maxVal = useMemo(() => {
    if (yMax !== undefined) return yMax;
    if (allValues.length === 0) return 100;
    const rawMin = Math.min(...allValues);
    const rawMax = Math.max(...allValues);
    const range = rawMax - rawMin;
    return range > 0 ? rawMax + range * 0.1 : rawMax * 1.05;
  }, [allValues, yMax]);

  // Viewport dimensions
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;
  const width = 500; // static coordinate system viewport

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const pointsCount = data.length;

  // Convert (index, value) to SVG coordinate space
  const getCoordinates = (index: number, value: number) => {
    if (pointsCount <= 1) {
      return { x: paddingLeft + chartWidth / 2, y: paddingTop + chartHeight / 2 };
    }
    const x = paddingLeft + (index / (pointsCount - 1)) * chartWidth;
    const denom = maxVal - minVal;
    const y = paddingTop + chartHeight - (denom > 0 ? ((value - minVal) / denom) * chartHeight : chartHeight / 2);
    return { x, y };
  };

  // Generate path lines with gaps for offline periods
  const paths = useMemo(() => {
    if (pointsCount < 2) return [];
    const linesCount = lineColors.length;

    return Array.from({ length: linesCount }).map((_, lineIdx) => {
      // Group contiguous online points into separate segments to create breaks
      const segments: any[][] = [];
      let currentSegment: any[] = [];

      data.forEach((dPoint, i) => {
        const pt = getCoordinates(i, dPoint.values[lineIdx] ?? minVal);
        if (dPoint.isOffline) {
          if (currentSegment.length > 0) {
            segments.push(currentSegment);
            currentSegment = [];
          }
        } else {
          currentSegment.push(pt);
        }
      });

      if (currentSegment.length > 0) {
        segments.push(currentSegment);
      }

      // Format line paths (d)
      const strokePaths = segments.map(seg => {
        if (seg.length < 2) return "";
        let segmentD = `M ${seg[0].x} ${seg[0].y}`;
        if (curved) {
          for (let i = 0; i < seg.length - 1; i++) {
            const p0 = seg[i];
            const p1 = seg[i + 1];
            const cp1x = p0.x + (p1.x - p0.x) / 3;
            const cp1y = p0.y;
            const cp2x = p0.x + (2 * (p1.x - p0.x)) / 3;
            const cp2y = p1.y;
            segmentD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
          }
        } else {
          segmentD = seg.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
        }
        return segmentD;
      }).filter(Boolean);

      const d = strokePaths.join(" ");

      // Format area paths (areaD)
      const areaPaths = segments.map(seg => {
        if (seg.length < 2) return "";
        let segmentD = `M ${seg[0].x} ${seg[0].y}`;
        if (curved) {
          for (let i = 0; i < seg.length - 1; i++) {
            const p0 = seg[i];
            const p1 = seg[i + 1];
            const cp1x = p0.x + (p1.x - p0.x) / 3;
            const cp1y = p0.y;
            const cp2x = p0.x + (2 * (p1.x - p0.x)) / 3;
            const cp2y = p1.y;
            segmentD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
          }
        } else {
          segmentD = seg.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
        }
        const firstX = seg[0].x;
        const lastX = seg[seg.length - 1].x;
        const bottomY = paddingTop + chartHeight;
        return `${segmentD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
      }).filter(Boolean);

      const areaD = areaPaths.join(" ");

      // Use the last point of the last contiguous segment for circles and guide lines
      const lastSegment = segments[segments.length - 1];
      const lastPt = lastSegment && lastSegment.length > 0 ? lastSegment[lastSegment.length - 1] : null;

      return { d, areaD, currentPoint: lastPt };
    });
  }, [data, curved, minVal, maxVal, lineColors, pointsCount, chartHeight, chartWidth]);

  // Grid tick counts
  const yTicks = 4;
  const yTickValues = useMemo(() => {
    const values = [];
    for (let i = 0; i <= yTicks; i++) {
      values.push(minVal + (i / yTicks) * (maxVal - minVal));
    }
    return values;
  }, [minVal, maxVal, yTicks]);

  // Dynamically determine how many decimal places to show on Y-axis labels
  // so that adjacent ticks are always distinct regardless of how tight the data range is
  const yTickDecimals = useMemo(() => {
    const tickInterval = yTicks > 0 ? (maxVal - minVal) / yTicks : 1;
    if (tickInterval === 0) return 2;
    if (tickInterval >= 10) return 0;
    if (tickInterval >= 1) return 1;
    if (tickInterval >= 0.1) return 2;
    if (tickInterval >= 0.01) return 3;
    return 4;
  }, [minVal, maxVal, yTicks]);

  return (
    <div style={{ width: "100%", position: "relative" }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        style={{ overflow: "visible" }}
      >
        <defs>
          {lineColors.map((color, idx) => (
            <linearGradient id={`chartAreaGrad-${idx}`} key={`area-${idx}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          ))}
          {lineColors.map((color, idx) => (
            <linearGradient id={`guideGrad-${idx}`} key={`guide-${idx}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={1} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>

        {/* Grid lines & Y labels */}
        {yTickValues.map((val, idx) => {
          const y = paddingTop + chartHeight - (idx / yTicks) * chartHeight;
          return (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke={gridColor}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <text
                x={paddingLeft - 8}
                y={y + 3}
                textAnchor="end"
                fill={textColor}
                fontSize={10}
                fontWeight={500}
              >
                {val.toFixed(yTickDecimals)}
              </text>
            </g>
          );
        })}

        {/* X labels */}
        {data.map((dPoint, idx) => {
          const showLabel = idx === 0 || idx === Math.floor(pointsCount / 2) || idx === pointsCount - 1;
          if (!showLabel) return null;
          const x = paddingLeft + (idx / (pointsCount - 1)) * chartWidth;
          return (
            <text
              key={idx}
              x={x}
              y={paddingTop + chartHeight + 16}
              textAnchor="middle"
              fill={textColor}
              fontSize={10}
              fontWeight={500}
            >
              {dPoint.label}
            </text>
          );
        })}

        {/* Render area gradations */}
        {paths.map((p, idx) => (
          <path
            key={`area-${idx}`}
            d={p.areaD}
            fill={`url(#chartAreaGrad-${idx})`}
            stroke="none"
          />
        ))}

        {/* Render lines */}
        {paths.map((p, idx) => (
          <path
            key={`line-${idx}`}
            d={p.d}
            fill="none"
            stroke={lineColors[idx]}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        ))}

        {/* Render circles & vertical gradient guides on latest points */}
        {paths.map((p, idx) => {
          if (!p.currentPoint) return null;
          const color = lineColors[idx];
          return (
            <g key={`current-${idx}`}>
              {/* Vertical Guide Gradient Line */}
              <line
                x1={p.currentPoint.x}
                y1={p.currentPoint.y}
                x2={p.currentPoint.x}
                y2={paddingTop + chartHeight}
                stroke={`url(#guideGrad-${idx})`}
                strokeWidth={1.5}
              />
              {/* Simply Filled Circle Indicator (no concentric ring) */}
              <circle
                cx={p.currentPoint.x}
                cy={p.currentPoint.y}
                r={4.5}
                fill={color}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
