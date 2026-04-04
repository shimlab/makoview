export const genomicToPixel = (genomicPos, metadata, scale) => {
  return Math.round(
    ((genomicPos - getTrackBounds(metadata, scale).start) / 1000) * scale,
  );
};

export const pixelToGenomic = (pixelPos, metadata, scale) => {
  return (pixelPos / scale) * 1000 + getTrackBounds(metadata, scale).start;
};

export const getTrackBounds = (metadata, scale) => {
  const tickInterval = Math.round((2000 * 100) / scale);
  return {
    start: metadata.start - 100,
    end: metadata.end + 100,
  };
};
