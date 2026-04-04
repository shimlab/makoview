export const genomicToPixel = (genomicPos, metadata, scale) => {
  return Math.round(
    ((genomicPos - getTrackBounds(metadata, scale).start) / 1000) * scale,
  );
};

export const getTrackBounds = (metadata, scale) => {
  const tickInterval = Math.round((2000 * 100) / scale);
  return {
    start: metadata.start - 100,
    end: metadata.end + 100,
  };
};
