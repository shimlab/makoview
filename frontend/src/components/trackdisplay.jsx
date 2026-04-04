import { useState, useEffect } from "react";
import { useRef } from "react";
import Axis from "./axis";
import TrackView from "./track";
import { getTrackBounds, genomicToPixel, pixelToGenomic } from "../utils/coordinates";

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

  const xScrollRef = useRef(null);
  const yScrollRef = useRef(null);
  const viewportRef = useRef(null);
  const savedCenterGenomicPos = useRef(null);

  useEffect(() => {
    if (savedCenterGenomicPos.current === null) return;
    if (!viewportRef.current || !data) return;

    const vp = viewportRef.current;
    const newCenterPixel = genomicToPixel(
      savedCenterGenomicPos.current,
      data.metadata,
      viewerSettings.scale,
    );
    vp.scrollLeft = newCenterPixel - vp.clientWidth / 2;
    savedCenterGenomicPos.current = null;
  }, [viewerSettings]);

  const zoom = (factor) => {
    if (viewportRef.current && data) {
      const vp = viewportRef.current;
      const centerPixel = vp.scrollLeft + vp.clientWidth / 2;
      savedCenterGenomicPos.current = pixelToGenomic(
        centerPixel,
        data.metadata,
        viewerScale,
      );
    }
    setViewerScale((prev) => prev * factor);
  };

  return (
    <>
      <div className="h-full w-full">
        {data !== null && (
          <div className="flex flex-col h-full justify-between">
            <div className="flex flex-row gap-2 min-h-0">
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
                  ref={viewportRef}
                  data={data}
                  view={viewerSettings}
                  yScrollRef={yScrollRef}
                  xScrollRef={xScrollRef}
                />
              </div>
            </div>

            <div className="min-h-10 w-full p-2 bg-amber-100 flex flex-row text-sm items-center gap-3">
              <div className="font-bold">Gene: {data.metadata.gene_name}</div>
              <div className="text-xs">
                {data.metadata.gene_id}
                <br />
                {data.metadata.chr} {data.metadata.start.toLocaleString()}
                &nbsp;—&nbsp;
                {data.metadata.end.toLocaleString()}
              </div>
              <div className="flex-1"></div>
              <div className="text-lg">{Math.round(viewerSettings.scale)}%</div>
              <button
                className="text-xl min-w-8 min-h-8 bg-white rounded-md border-2 border-gray-500"
                onClick={() => zoom(1.25)}
              >
                +
              </button>
              <button
                className="text-xl min-w-8 min-h-8 bg-white rounded-md border-2 border-gray-500"
                onClick={() => zoom(1 / 1.25)}
              >
                –
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default TrackDisplay;
