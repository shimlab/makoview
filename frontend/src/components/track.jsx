import React, { useRef } from "react";
import { genomicToPixel } from "../utils/coordinates";

const TrackContent = React.memo(function TrackContent({ data, view }) {
  const elements = [];
  const metadata = data.metadata;

  let index = 0;
  for (const [txId, exons] of Object.entries(data.transcripts)) {
    const exon_elements = [];

    let start = Infinity;
    let end = -Infinity;
    for (const exon of exons) {
      const left = genomicToPixel(exon.start, metadata, view.scale);
      const right = genomicToPixel(exon.end, metadata, view.scale);
      const width = right - left;

      exon_elements.push(
        <rect
          key={`${txId}-${exon.start}-${exon.end}`}
          x={left}
          y={index * 36 + 6}
          width={width}
          height={24}
          fill="#2B7FFF"
        ></rect>,
      );

      start = Math.min(start, left);
      end = Math.max(end, right);
    }

    elements.push(
      <rect
        key={`${txId}-line-${start}-${end}`}
        x={start}
        y={index * 36 + 17}
        width={end - start}
        height={2}
        fill="#666"
      ></rect>,
    );
    elements.push(...exon_elements);

    index += 1;
  }

  return <g>{elements}</g>;
});

function TrackView({
  data,
  view,
  xScrollRef,
  yScrollRef,
  ref,
  onCursorMove,
  cursorX,
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
        <TrackContent data={data} view={view} />
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
