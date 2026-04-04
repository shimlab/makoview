import { useState, useEffect } from "react";
import { useRef } from "react";
import Axis from "./axis";
import TrackView from "./track";
import { getTrackBounds } from "../utils/coordinates";

function TrackDisplay(selected) {
  const [data, setData] = useState(null);

  // how many px should be used to render 1000 bases?
  let [viewerScale, setViewerScale] = useState(100);
  let [viewerSettings, setViewerSettings] = useState({
    start_bp: 0,
    end_bp: 0,
    width: 0,
    scale: 100,
  });

  // compute viewerSettings
  useEffect(() => {
    if (data === null) return;
    if (viewerScale === null) return;

    const metadata = data.metadata;
    const coords = getTrackBounds(metadata, viewerScale);

    const start_bp = coords.start;
    const end_bp = coords.end;

    const width = ((end_bp - start_bp) / 1000) * viewerScale;

    setViewerSettings({
      start_bp,
      end_bp,
      width,
      scale: viewerScale,
    });
  }, [data, viewerScale]);

  useEffect(() => {
    const id = selected.selected.id || null;
    console.log("fetching data for", id);
    if (id === null) {
      setData(null);
      return;
    }

    const fetchData = async () => {
      const res = await fetch(
        `http://localhost:8001/api/genes?` +
          new URLSearchParams({ id }).toString(),
      );
      const data = await res.json();
      setData(data);
    };

    fetchData();
  }, [selected]);

  // useEffect(() => {
  //   if (data !== null) render(data, viewerScale);
  // }, [data, viewerScale]);

  // function render(data, scale) {
  //   console.log("rendering", data, scale);
  //   const metadata = data.metadata;
  //   const tx = data.transcripts;

  //   const genomicToPixel = (genomicPos) =>
  //     ((genomicPos - metadata.start) / 1000) * scale;

  //   const width = ((metadata.end - metadata.start) / 1000) * scale;

  //   scaleRef;
  // }

  const xScrollRef = useRef(null);
  const yScrollRef = useRef(null);

  return (
    <>
      <div className="h-full w-full overflow-y-scroll bg-amber-100">
        {data !== null && (
          <>
            <div className="flex flex-row gap-2 bg-amber-100 h-full">
              <div className="flex flex-col pl-2">
                <div className="h-6 font-bold text-right">
                  {data.metadata.chr}
                </div>
                <div ref={yScrollRef} className="overflow-y-hidden">
                  {(() => {
                    const labelRows = [];
                    for (const txId in data.transcripts) {
                      labelRows.push(
                        <div className="h-[36px] text-base/[36px]" key={txId}>
                          {txId}
                        </div>,
                      );
                    }
                    return labelRows;
                  })()}
                </div>
              </div>

              <div className="flex flex-col flex-1 min-w-0">
                <Axis
                  ref={xScrollRef}
                  view={viewerSettings}
                  metadata={data?.metadata}
                />
                <TrackView
                  data={data}
                  view={viewerSettings}
                  yScrollRef={yScrollRef}
                  xScrollRef={xScrollRef}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default TrackDisplay;
