import { genomicToPixel } from "../utils/coordinates";
import { useRef } from "react";

function TrackView({ data, view, xScrollRef, yScrollRef }) {
  const render = (data, view) => {
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

    return (
      <svg height={index * 36} width={view.width}>
        {elements}
      </svg>
    );
  };

  const syncScroll = (e) => {
    xScrollRef.current.scrollLeft = e.target.scrollLeft;
    yScrollRef.current.scrollTop = e.target.scrollTop;
  };

  let isPanning = false;
  const panStartCoords = { x: 0, y: 0 };

  const panStart = (e) => {
    e.preventDefault();
    isPanning = true;
    panStartCoords.x = viewportRef.current.scrollLeft + e.clientX;
    panStartCoords.y = viewportRef.current.scrollTop + e.clientY;

    viewportRef.current.style.cursor = "grabbing";
  };

  const panMove = (e) => {
    if (!isPanning) return;
    viewportRef.current.scrollLeft = panStartCoords.x - e.clientX;
    viewportRef.current.scrollTop = panStartCoords.y - e.clientY;
  };

  const panEnd = (e) => {
    isPanning = false;
    viewportRef.current.style.cursor = "pointer";
  };

  const viewportRef = useRef(null);

  return (
    <div
      ref={viewportRef}
      className="overflow-scroll cursor-pointer"
      onScroll={syncScroll}
      onMouseDown={panStart}
      onMouseMove={panMove}
      onMouseUp={panEnd}
      onMouseLeave={panEnd}
    >
      {render(data, view)}
    </div>
  );
}
export default TrackView;
