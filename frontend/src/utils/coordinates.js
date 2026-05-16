import memoize from "memoize";
import { getDefaultStore } from "jotai";
import { _viewerScaleAtom } from "../store";

const memoizeMultiArg = (fn) => memoize(fn, { cacheKey: (args) => args.join(",") });

const INTRON_PIXEL_WIDTH = 20;

const buildSegments = memoize((scale) => {
  const metadata = window.__DATA__.metadata;
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
});

export const _genomicToPixel = memoizeMultiArg((genomicPos, scale) => {
  const { segments } = buildSegments(scale);

  for (const seg of segments) {
    if (genomicPos >= seg.genomicStart && genomicPos <= seg.genomicEnd) {
      const fraction = (genomicPos - seg.genomicStart) / (seg.genomicEnd - seg.genomicStart);
      return Math.round(seg.pixelStart + fraction * seg.pixelWidth);
    }
  }

  const lastSeg = segments[segments.length - 1];
  return Math.round(lastSeg.pixelStart + lastSeg.pixelWidth);
});

export const _pixelToGenomic = memoizeMultiArg((pixelPos, scale) => {
  const { segments } = buildSegments(scale);

  for (const seg of segments) {
    if (pixelPos >= seg.pixelStart && pixelPos <= seg.pixelStart + seg.pixelWidth) {
      const fraction = (pixelPos - seg.pixelStart) / seg.pixelWidth;
      return seg.genomicStart + fraction * (seg.genomicEnd - seg.genomicStart);
    }
  }

  const lastSeg = segments[segments.length - 1];
  return lastSeg.genomicEnd;
});

export const _getTrackBounds = (scale) => {
  const metadata = window.__DATA__.metadata;
  return {
    start: metadata.start - 100,
    end: metadata.end + 100,
  };
};

const getScale = () => getDefaultStore().get(_viewerScaleAtom);

export const getTrackBounds = () => _getTrackBounds(getScale());

export const genomicToPixel = (genomicPos) => _genomicToPixel(genomicPos, getScale());

export const pixelToGenomic = (pixelPos) => _pixelToGenomic(pixelPos, getScale());

export const _getTotalPixelWidth = (scale) => buildSegments(scale).totalPixelWidth;

export const getTotalPixelWidth = () => _getTotalPixelWidth(getScale());
