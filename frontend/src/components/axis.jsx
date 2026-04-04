import React from "react";
import {
  genomicToPixel,
  getTrackBounds,
  pixelToGenomic,
} from "../utils/coordinates";

const AxisContent = React.memo(function AxisContent({ view, metadata }) {
  const width = view.width;
  const trackBounds = getTrackBounds(metadata, view.scale);

  // math behind this: the goal is 200px between ticks
  const tickInterval = Math.round((2000 * 100) / view.scale);
  const firstTick =
    Math.ceil(trackBounds.start / tickInterval) * tickInterval;
  const ticks = [];
  for (let pos = firstTick; pos <= trackBounds.end; pos += tickInterval) {
    ticks.push(pos);
  }

  const rows = [];

  // draw ranges
  for (const range of metadata.ranges) {
    const left = genomicToPixel(range[0], metadata, view.scale) - 2;
    const right = genomicToPixel(range[1], metadata, view.scale) + 2;

    rows.push(
      <polygon
        key={`exon-${range[0]}-${range[1]}`}
        points={`${left},56 ${left},80 ${right},68`}
        fill="#FFD7A8"
      ></polygon>,
    );
  }

  return <g>{rows}</g>;
});

function Axis({ ref, view, metadata, cursorX }) {
  let cursorElements = null;
  if (cursorX !== null) {
    const snappedX = Math.round(cursorX);
    const genomicPos = Math.round(
      pixelToGenomic(cursorX, metadata, view.scale),
    );
    cursorElements = (
      <>
        <rect
          x={snappedX}
          y={56}
          width={2}
          height={24}
          fill="#333"
          pointerEvents="none"
        />
        <text
          x={snappedX + 4}
          y={76}
          fontSize="14"
          fill="#333"
          pointerEvents="none"
        >
          {genomicPos.toLocaleString()}
        </text>
      </>
    );
  }

  return (
    <>
      <div
        ref={ref}
        id="track"
        className="max-w-full min-h-[80px] overflow-hidden pr-25"
      >
        <svg height="80" width={view.width}>
          <AxisContent view={view} metadata={metadata} />
          {cursorElements}
        </svg>
      </div>
    </>
  );
}

export default Axis;
