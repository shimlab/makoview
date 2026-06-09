import React from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { genomicToPixel } from "../../../utils/coordinates";
import { dataAtom, displayOptionsAtom, selectedSiteAtom } from "../../../store";

const LINE_HEIGHT = 80;

const generateTriangleCoords = (x, y, height, direction) => {
  const base_half_length = 0.5773503 * height;
  if (direction === "up") {
    return `${x - base_half_length},${y} ${x + base_half_length},${y} ${x},${y - height}`;
  } else {
    return `${x - base_half_length},${y - height} ${x + base_half_length},${y - height} ${x},${y}`;
  }
};

export const TrackRenderer = function TrackRenderer({
  sortedTxIds,
  coveredTxIds,
  visibleGenomicStart,
  visibleGenomicEnd,
}) {
  const data = useAtomValue(dataAtom);
  const displayOptions = useAtomValue(displayOptionsAtom);
  const setSelectedSite = useSetAtom(selectedSiteAtom);

  const txRowMap = new Map();
  let index = 0;
  for (const txId of sortedTxIds) {
    txRowMap.set(txId, index);
    index += 1;
  }

  const trackLineElements = [];
  const exonElements = [];

  for (const txId of sortedTxIds) {
    const features = data.transcripts[txId].ranges;
    const rowIdx = txRowMap.get(txId);
    const covered = coveredTxIds.has(txId);

    let start = Infinity;
    let end = -Infinity;

    const posStrand = features[0].strand === "+";
    for (const feat of features) {
      const left = genomicToPixel(feat.start);
      const right = genomicToPixel(feat.end + 1);
      const width = right - left;

      const isUtrSegment = feat.type.toLowerCase().includes("utr");
      let exonColor = "#eee";
      if (covered) {
        if (isUtrSegment) {
          exonColor = "#8ba2d3";
        } else if (feat.type.toLowerCase().includes("cds")) {
          exonColor = "#0D0D78";
        } else {
          exonColor = "#457aeb";
        }
      }

      const y = isUtrSegment ? rowIdx * LINE_HEIGHT + 48 : rowIdx * LINE_HEIGHT + 43;
      const height = isUtrSegment ? 13 : 24;

      exonElements.push(
        <rect
          key={`${txId}-${feat.start}-${feat.end}`}
          x={left}
          y={y}
          width={width}
          height={height}
          fill={exonColor}
        />,
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
      />,
    );
  }

  const siteMarkers = [];
  const siteBars = [];
  for (const site of data.sites) {
    const rowIdx = txRowMap.get(site.transcript_id);
    if (rowIdx === undefined) continue;
    const x = genomicToPixel(site.chr_position);
    const isTested = !(site.test === null);
    const isSignificant = isTested && site.test.bh_corrected_p_value < 0.05;

    if (!isTested && !displayOptions.untestedSites) continue;
    if (isTested && !isSignificant && !displayOptions.nonSignificantSites) continue;
    if (isTested && isSignificant && !displayOptions.significantSites) continue;

    siteBars.push(
      <rect
        key={`sel-${site.transcript_id}-${site.chr_position}`}
        x={x - 1}
        y={rowIdx * LINE_HEIGHT + 28}
        width={2}
        height={39}
        fill="#999"
      />,
    );

    if (isTested) {
      const isUpRegulated = site.test.estimate > 0;
      const color = isUpRegulated ? "#189649" : "#ef4444";
      const marker_y = rowIdx * LINE_HEIGHT + 37;
      const points = isUpRegulated
        ? generateTriangleCoords(x, marker_y, 12, "up")
        : generateTriangleCoords(x, marker_y, 12, "down");
      const fill = isSignificant ? color : `rgba(255, 255, 255, 1)`;

      const siteInfo = {
        transcript_id: site.transcript_id,
        transcript_position: site.transcript_position,
        chr: site.chr,
        chr_position: site.chr_position,
        ...site.test,
      };

      siteMarkers.push(
        <polygon
          key={`test-${site.transcript_id}-${site.chr_position}`}
          points={points}
          stroke={color}
          fill={fill}
          strokeWidth={2}
          shapeRendering="optimiseSpeed"
          onMouseDown={() => setSelectedSite(siteInfo)}
          className="cursor-pointer"
        />,
      );
    } else {
      siteBars.push(
        <rect
          key={`sel-click-${site.transcript_id}-${site.chr_position}`}
          x={x - 4}
          y={rowIdx * LINE_HEIGHT + 39}
          width={8}
          height={14}
          fill="transparent"
          onMouseDown={() => setSelectedSite(site)}
          className="cursor-pointer"
        />,
      );
    }
  }

  return (
    <g>
      {trackLineElements}
      {exonElements}
      {siteBars}
      {siteMarkers}
    </g>
  );
};

export default TrackRenderer;
