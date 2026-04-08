import React, { useRef } from "react";
import { genomicToPixel } from "../utils/coordinates";

const TrackContent = React.memo(function TrackContent({
  data,
  view,
  sortedTxIds,
  coveredTxIds,
}) {
  const metadata = data.metadata;

  // Build transcript→row-index map using sorted order
  const txRowMap = new Map();
  let index = 0;
  for (const txId of sortedTxIds) {
    txRowMap.set(txId, index);
    index += 1;
  }

  const intronElements = [];
  const exonElements = [];

  for (const txId of sortedTxIds) {
    const exons = data.transcripts[txId];
    const rowIdx = txRowMap.get(txId);
    const covered = coveredTxIds.has(txId);
    const exonColor = covered ? "#93c5fd" : "#eee";
    // const exonColor = covered ? "#2B7FFF" : "#93c5fd";
    const intronColor = covered ? "#666" : "#bbb";

    let start = Infinity;
    let end = -Infinity;
    for (const exon of exons) {
      const left = genomicToPixel(exon.start, metadata, view.scale);
      const right = genomicToPixel(exon.end, metadata, view.scale);
      const width = right - left;

      exonElements.push(
        <rect
          key={`${txId}-${exon.start}-${exon.end}`}
          x={left}
          y={rowIdx * 36 + 6}
          width={width}
          height={24}
          fill={exonColor}
        ></rect>,
      );

      start = Math.min(start, left);
      end = Math.max(end, right);
    }

    intronElements.push(
      <rect
        key={`${txId}-line-${start}-${end}`}
        x={start}
        y={rowIdx * 36 + 17}
        width={end - start}
        height={2}
        fill={intronColor}
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
        y={rowIdx * 36 + 6}
        width={2}
        height={24}
        fill="#666"
      />,
    );
  }

  // Triangles for tested sites
  const testedSiteElements = [];
  for (const site of data.tested_sites) {
    const isUpRegulated = site.estimate > 0;
    const isSignificant = site.p_value < 0.05;

    const rowIdx = txRowMap.get(site.transcript_id);
    if (rowIdx === undefined) continue;
    const x = genomicToPixel(site.chr_position, metadata, view.scale);
    const color = isUpRegulated ? "#189649" : "#ef4444";
    const y = rowIdx * 36;

    const points = isUpRegulated
      ? `${x - 4},${y + 6} ${x + 4},${y + 6} ${x},${y - 2}`
      : `${x - 4},${y} ${x + 4},${y} ${x},${y + 8}`;
    testedSiteElements.push(
      <polygon
        key={`test-${site.transcript_id}-${site.chr_position}`}
        points={points}
        fill={color}
      />,
    );

    if (isSignificant) {
      // create an asterisk shape below the triangle
      testedSiteElements.push(
        <text
          key={`sig-${site.transcript_id}-${site.chr_position}`}
          x={x}
          y={y + 45}
          textAnchor="middle"
          fontSize="48"
          fill="black"
        >
          *
        </text>,
      );
    }
  }

  return (
    <g>
      {intronElements}
      {exonElements}
      {selectedSiteElements}
      {testedSiteElements}
    </g>
  );
});

function TrackView({
  data,
  view,
  xScrollRef,
  yScrollRef,
  ref,
  onCursorMove,
  cursorX,
  sortedTxIds,
  coveredTxIds,
}) {
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
      const pixelX =
        e.clientX -
        viewportRef.current.getBoundingClientRect().left +
        viewportRef.current.scrollLeft;
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
      const pixelX =
        e.clientX -
        viewportRef.current.getBoundingClientRect().left +
        viewportRef.current.scrollLeft;
      onCursorMove(pixelX);
    }
  };

  const transcriptCount = Object.keys(data.transcripts).length;
  const svgHeight = transcriptCount * 36;

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
        <TrackContent
          data={data}
          view={view}
          sortedTxIds={sortedTxIds}
          coveredTxIds={coveredTxIds}
        />
        {cursorX !== null && (
          <rect
            x={Math.round(cursorX)}
            y={0}
            width={2}
            height={svgHeight}
            fill="#333"
            pointerEvents="none"
          />
        )}
      </svg>
    </div>
  );
}
export default TrackView;
