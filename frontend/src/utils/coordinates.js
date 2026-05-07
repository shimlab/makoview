import memoize from "memoize";

const INTRON_PIXEL_WIDTH = 20;

const buildSegments = (metadata, scale) => {
  const ranges = metadata.ranges;
  const trackStart = metadata.start - 100;
  const trackEnd = metadata.end + 100;

  const segments = [];
  let pixelOffset = 0;
  let genomicCursor = trackStart;

  for (const [exonStart, exonEnd] of ranges) {
    if (genomicCursor < exonStart) {
      segments.push({
        type: "gap",
        genomicStart: genomicCursor,
        genomicEnd: exonStart,
        pixelStart: pixelOffset,
        pixelWidth: INTRON_PIXEL_WIDTH,
      });
      pixelOffset += INTRON_PIXEL_WIDTH;
    }
    const pw = ((exonEnd - exonStart) / 1000) * scale;
    segments.push({
      type: "exon",
      genomicStart: exonStart,
      genomicEnd: exonEnd,
      pixelStart: pixelOffset,
      pixelWidth: pw,
    });
    pixelOffset += pw;
    genomicCursor = exonEnd;
  }

  if (genomicCursor < trackEnd) {
    segments.push({
      type: "gap",
      genomicStart: genomicCursor,
      genomicEnd: trackEnd,
      pixelStart: pixelOffset,
      pixelWidth: INTRON_PIXEL_WIDTH,
    });
    pixelOffset += INTRON_PIXEL_WIDTH;
  }

  return { segments, totalPixelWidth: pixelOffset };
};

export const genomicToPixel = (genomicPos, metadata, scale) => {
  const { segments } = buildSegments(metadata, scale);

  for (const seg of segments) {
    if (genomicPos >= seg.genomicStart && genomicPos <= seg.genomicEnd) {
      const fraction = (genomicPos - seg.genomicStart) / (seg.genomicEnd - seg.genomicStart);
      return Math.round(seg.pixelStart + fraction * seg.pixelWidth);
    }
  }

  const lastSeg = segments[segments.length - 1];
  return Math.round(lastSeg.pixelStart + lastSeg.pixelWidth);
};

export const pixelToGenomic = (pixelPos, metadata, scale) => {
  const { segments } = buildSegments(metadata, scale);

  for (const seg of segments) {
    if (pixelPos >= seg.pixelStart && pixelPos <= seg.pixelStart + seg.pixelWidth) {
      const fraction = (pixelPos - seg.pixelStart) / seg.pixelWidth;
      return seg.genomicStart + fraction * (seg.genomicEnd - seg.genomicStart);
    }
  }

  const lastSeg = segments[segments.length - 1];
  return lastSeg.genomicEnd;
};

export const getTrackBounds = (metadata, scale) => {
  const tickInterval = Math.round((2000 * 100) / scale);
  return {
    start: metadata.start - 100,
    end: metadata.end + 100,
  };
};

export const getTotalPixelWidth = (metadata, scale) => {
  return buildSegments(metadata, scale).totalPixelWidth;
};
