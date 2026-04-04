import { genomicToPixel, getTrackBounds } from "../utils/coordinates";

function Axis({ ref, view, metadata }) {
  const renderAxis = (view, metadata) => {
    const width = view.width;
    const trackBounds = getTrackBounds(metadata, view.scale);

    // math behind this: the goal is 200px between ticks
    const tickInterval = (2000 * 100) / view.scale;
    const ticks = [];
    for (let pos = trackBounds.start; pos <= trackBounds.end; pos += 1) {
      if (pos % tickInterval === 0) {
        ticks.push(pos);
      }
    }

    const rows = [];
    for (let i = 0; i < ticks.length - 1; i++) {
      const pos = genomicToPixel(ticks[i], metadata, view.scale);
      rows.push(
        <rect
          key={ticks[i]}
          x={pos}
          y="0"
          width="2"
          height="24"
          fill="#000"
        ></rect>,
      );
      rows.push(
        <text key={`text-${ticks[i]}`} x={pos + 6} y="20" className="text-xs">
          {ticks[i].toLocaleString()}
        </text>,
      );
    }

    return (
      <svg height="24" width={width}>
        {rows}
      </svg>
    );
  };

  return (
    <>
      <div ref={ref} id="track" className="max-w-full min-h-6 overflow-hidden">
        {renderAxis(view, metadata)}
      </div>
    </>
  );
}

export default Axis;
