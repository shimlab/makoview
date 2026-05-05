import React, { useRef } from "react";
import { genomicToPixel } from "../utils/coordinates";

const LINE_HEIGHT = 54;

const generateTriangleCoords = (x, y, height, direction) => {
  // the triangle is equilateral, so b/h = 2/sqrt(3)
  const base_half_length = 0.5773503 * height;

  if (direction === "up") {
    return `${x - base_half_length},${y} ${x + base_half_length},${y} ${x},${y - height}`;
  } else {
    return `${x - base_half_length},${y - height} ${x + base_half_length},${y - height} ${x},${y}`;
  }
};

const TrackContent = React.memo(function TrackContent({ data, view, sortedTxIds, coveredTxIds }) {
  const metadata = data.metadata;

  // Build transcript→row-index map using sorted order
  const txRowMap = new Map();
  let index = 0;
  for (const txId of sortedTxIds) {
    txRowMap.set(txId, index);
    index += 1;
  }

  const trackLineElements = [];
  const exonElements = [];

  for (const txId of sortedTxIds) {
    const features = data.transcripts[txId];
    const rowIdx = txRowMap.get(txId);
    const covered = coveredTxIds.has(txId);
    const trackLineColor = covered ? "#666" : "#bbb";

    let start = Infinity;
    let end = -Infinity;

    const posStrand = features[0].strand === "+";
    for (const feat of features) {
      const left = genomicToPixel(feat.start, metadata, view.scale);
      const right = genomicToPixel(feat.end + 1, metadata, view.scale);
      const width = right - left;

      const isUtrSegment = feat.type.toLowerCase().includes("utr");
      let exonColor = "#eee";
      if (covered) {
        // 3 different colours depending on whether a read has UTR/CDS annotations or not
        if (isUtrSegment) {
          exonColor = "#8ba2d3";
        } else if (feat.type.toLowerCase().includes("cds")) {
          exonColor = "#0D0D78";
        } else {
          exonColor = "#457aeb";
        }
      }

      const y = isUtrSegment ? rowIdx * LINE_HEIGHT + 35 : rowIdx * LINE_HEIGHT + 30;
      const height = isUtrSegment ? 13 : 24;

      // add small padding to to features to prevent gaps between adjacent features
      exonElements.push(
        <rect
          key={`${txId}-${feat.start}-${feat.end}`}
          x={left}
          y={y}
          width={width}
          height={height}
          fill={exonColor}
        ></rect>,
      );

      start = Math.min(start, left);
      end = Math.max(end, right);
    }

    let trackLineFill;
    if (covered) {
      trackLineFill = posStrand ? "url(#track-fwd-strand)" : "url(#track-rev-strand)";
    } else {
      trackLineFill = posStrand ? "url(#track-fwd-strand-nocover)" : "url(#track-rev-strand-nocover)";
    }
    trackLineElements.push(
      <rect
        key={`${txId}-line-${start}-${end}`}
        x={start}
        y={rowIdx * LINE_HEIGHT}
        width={end - start}
        height={LINE_HEIGHT}
        fill={trackLineFill}
      ></rect>,
    );
  }

  // Gray bars for selected sites
  const selectedSiteElements = [];
  for (const site of data.all_sites) {
    if (!site.selected) continue;
    const rowIdx = txRowMap.get(site.transcript_id);
    if (rowIdx === undefined) continue;
    const x = genomicToPixel(site.chr_position, metadata, view.scale);
    selectedSiteElements.push(
      <rect
        key={`sel-${site.transcript_id}-${site.chr_position}`}
        x={x - 1}
        y={rowIdx * LINE_HEIGHT + 22}
        width={2}
        height={32}
        fill="#999"
      />,
    );
  }

  // Triangles for tested sites
  const testedSiteElements = [];
  for (const site of data.tested_sites) {
    const isUpRegulated = site.estimate > 0;
    const isSignificant = site.bh_corrected_p_value < 0.05;

    const rowIdx = txRowMap.get(site.transcript_id);
    if (rowIdx === undefined) continue;
    const x = genomicToPixel(site.chr_position, metadata, view.scale);
    const color = isUpRegulated ? "#189649" : "#ef4444";
    const y = rowIdx * LINE_HEIGHT + 24;

    const points = isUpRegulated ? generateTriangleCoords(x, y, 12, "up") : generateTriangleCoords(x, y, 12, "down");

    const fill = isSignificant ? color : `rgba(255, 255, 255, 1)`; // add transparency if not significant

    testedSiteElements.push(
      <polygon
        key={`test-${site.transcript_id}-${site.chr_position}`}
        points={points}
        stroke={color}
        fill={fill}
        strokeWidth={2}
        shapeRendering="optimiseSpeed"
      />,
    );
  }

  return (
    <g>
      {trackLineElements}
      {exonElements}
      {selectedSiteElements}
      {testedSiteElements}
    </g>
  );
});

function TrackView({ data, view, xScrollRef, yScrollRef, ref, onCursorMove, cursorX, sortedTxIds, coveredTxIds }) {
  const isPanning = useRef(false);
  const panStartCoords = useRef({ x: 0, y: 0 });
  const panMoveRef = useRef(null);
  const panEndRef = useRef(null);

  const viewportRef = ref;

  const panStart = (e) => {
    e.preventDefault();
    isPanning.current = true;
    panStartCoords.current.x = viewportRef.current.scrollLeft + e.clientX;
    panStartCoords.current.y = viewportRef.current.scrollTop + e.clientY;

    viewportRef.current.style.cursor = "grabbing";

    panMoveRef.current = panMove;
    panEndRef.current = panEnd;
    document.addEventListener("mousemove", panMoveRef.current);
    document.addEventListener("mouseup", panEndRef.current);
  };

  const panMove = (e) => {
    if (viewportRef.current) {
      const pixelX = e.clientX - viewportRef.current.getBoundingClientRect().left + viewportRef.current.scrollLeft;
      onCursorMove(pixelX);
    }

    if (!isPanning.current) return;
    viewportRef.current.scrollLeft = panStartCoords.current.x - e.clientX;
    viewportRef.current.scrollTop = panStartCoords.current.y - e.clientY;
  };

  const panEnd = () => {
    isPanning.current = false;
    viewportRef.current.style.cursor = "pointer";
    onCursorMove(null);
    document.removeEventListener("mousemove", panMoveRef.current);
    document.removeEventListener("mouseup", panEndRef.current);
  };

  const syncScroll = (e) => {
    xScrollRef.current.scrollLeft = e.target.scrollLeft;
    yScrollRef.current.scrollTop = e.target.scrollTop;
  };

  const cursorMove = (e) => {
    if (!isPanning.current && viewportRef.current) {
      const pixelX = e.clientX - viewportRef.current.getBoundingClientRect().left + viewportRef.current.scrollLeft;
      onCursorMove(pixelX);
    }
  };

  const transcriptCount = Object.keys(data.transcripts).length;
  const svgHeight = transcriptCount * LINE_HEIGHT;

  return (
    <div
      ref={viewportRef}
      className="overflow-scroll cursor-pointer flex-1"
      onScroll={syncScroll}
      onMouseDown={panStart}
      onMouseMove={cursorMove}
      onMouseLeave={() => onCursorMove(null)}
    >
      <svg height={svgHeight} width={view.width}>
        {/* define patterns for arrow track elements */}
        <defs>
          <pattern id="track-fwd-strand" x="0" y="0" width="20" height="54" patternUnits="userSpaceOnUse">
            <line x1="0" x2="20" y1="41" y2="41" stroke="#999" strokeWidth="2" />
            <polyline points="3,36 9,41 3,46" fill="none" stroke="#999" strokeWidth="2" />
          </pattern>

          <pattern id="track-fwd-strand-nocover" x="0" y="0" width="20" height="54" patternUnits="userSpaceOnUse">
            <line x1="0" x2="20" y1="41" y2="41" stroke="#ddd" strokeWidth="2" />
            <polyline points="3,36 9,41 3,46" fill="none" stroke="#ddd" strokeWidth="2" />
          </pattern>

          <pattern id="track-rev-strand" x="0" y="0" width="20" height="54" patternUnits="userSpaceOnUse">
            <line x1="0" x2="20" y1="41" y2="41" stroke="#999" strokeWidth="2" />
            <polyline points="9,36 3,41 9,46" fill="none" stroke="#999" strokeWidth="2" />
          </pattern>

          <pattern id="track-rev-strand-nocover" x="0" y="0" width="20" height="54" patternUnits="userSpaceOnUse">
            <line x1="0" x2="20" y1="41" y2="41" stroke="#ddd" strokeWidth="2" />
            <polyline points="9,36 3,41 9,46" fill="none" stroke="#ddd" strokeWidth="2" />
          </pattern>
        </defs>

        <TrackContent data={data} view={view} sortedTxIds={sortedTxIds} coveredTxIds={coveredTxIds} />
        {false && cursorX !== null && (
          <rect x={Math.round(cursorX)} y={0} width={2} height={svgHeight} fill="#333" pointerEvents="none" />
        )}
      </svg>
    </div>
  );
}
export default TrackView;
