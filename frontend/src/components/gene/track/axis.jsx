import React from "react";
import { useAtomValue } from "jotai";
import { genomicToPixel, pixelToGenomic, getTrackBounds } from "../../../utils/coordinates";
import { dataAtom, selectedTrackPosAtom } from "../../../store";
import { useViewerSettings } from "../../../utils/useViewerSettings";

const AxisContent = React.memo(function AxisContent({ view, data }) {
  const metadata = data?.metadata;

  const width = view.px.end;
  const trackBounds = getTrackBounds();

  // math behind this: the goal is 200px between ticks
  const tickInterval = Math.round((2000 * 100) / view.scale);
  const firstTick = Math.ceil(trackBounds.start / tickInterval) * tickInterval;
  const ticks = [];
  for (let pos = firstTick; pos <= trackBounds.end; pos += tickInterval) {
    ticks.push(pos);
  }

  const rows = [];

  // draw ranges
  for (const range of metadata.ranges) {
    const left = genomicToPixel(range[0]);
    const right = genomicToPixel(range[1]);

    rows.push(
      <polyline
        key={`axis-range-${range[0]}-${range[1]}`}
        points={`${left},68 ${left},78 ${right},78 ${right},68`}
        stroke="#062f61"
        strokeWidth={2}
        fill="none"
      />,
    );
  }

  const candidateSites = data.candidate_sites;

  // draw candidate DRACH sites
  for (const [candidate, sequence] of candidateSites) {
    const x = genomicToPixel(candidate);
    rows.push(
      <g key={candidate}>
        <circle cx={x} cy="45" r="3" fill="#062f61" stroke="none" />
      </g>,
    );
  }

  return <g>{rows}</g>;
});

function Axis({ ref }) {
  const view = useViewerSettings();
  const data = useAtomValue(dataAtom);
  const cursorX = view.viewport.cursorX;
  const selectedTrackPos = useAtomValue(selectedTrackPosAtom);

  let cursorElements = [];

  if (cursorX !== null) {
    const snappedX = Math.round(cursorX);
    const genomicPos = Math.round(pixelToGenomic(cursorX));

    cursorElements.push(
      <rect key="cursor-rect" x={snappedX} y={56} width={2} height={24} fill="#333" pointerEvents="none" />,
    );
    cursorElements.push(
      <text key="cursor-text" x={snappedX + 4} y={73} fontSize="16" fill="#333" pointerEvents="none">
        {genomicPos.toLocaleString()}
      </text>,
    );
  }

  const motifPosition = selectedTrackPos || cursorX;
  if (motifPosition !== null) {
    let closestCandidate = null,
      closestSequence = null,
      closestX = null,
      minDist = Infinity;

    const cursorLoc = pixelToGenomic(selectedTrackPos || cursorX);

    for (const [candidate, sequence] of data.candidate_sites) {
      const dist = Math.abs(candidate - cursorLoc);
      if (dist < minDist) {
        minDist = dist;
        closestCandidate = candidate;
        closestSequence = sequence;
        closestX = genomicToPixel(candidate);
      }
    }

    if (closestCandidate !== null) {
      cursorElements.push(
        <line
          key="closest-line"
          x1={closestX}
          y1={33}
          x2={closestX}
          y2={48}
          stroke="#062f61"
          strokeWidth={2}
          pointerEvents="none"
        />,
      );
      cursorElements.push(
        <text key="closest-text" x={closestX + 4} y="30" fontSize="12" fill="#062f61" textAnchor="middle">
          {`${closestSequence}\n${closestCandidate.toLocaleString()}`}
        </text>,
      );
    }
  }

  return (
    <>
      <div ref={ref} id="track" className="max-w-full min-h-[80px] overflow-hidden pr-25">
        <svg height="80" width={view.px.end}>
          {selectedTrackPos && (
            <rect x={selectedTrackPos - 4} y={0} width={9} height={80} fill="#acdce3" pointerEvents="none" />
          )}

          <AxisContent view={view} data={data} />
          {cursorElements}
        </svg>
      </div>
    </>
  );
}

export default Axis;
