import { useState, useEffect } from "react";
import { useRef } from "react";
import Axis from "./axis";
import TrackView from "./track";
import InfoPanel from "./infoPanel";
import { getTrackBounds, getTotalPixelWidth, genomicToPixel, pixelToGenomic } from "../utils/coordinates";

function TrackDisplay({ data }) {
  const [cursorX, setCursorX] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);

  // how many px should be used to render 1000 bases?
  let [viewerScale, setViewerScale] = useState(200);
  let [viewerSettings, setViewerSettings] = useState({
    start_bp: 0,
    end_bp: 0,
    width: 0,
    scale: 200,
  });

  // compute viewerSettings
  useEffect(() => {
    if (data === null) return;
    if (viewerScale === null) return;

    const metadata = data.metadata;
    const coords = getTrackBounds(metadata, viewerScale);

    const start_bp = coords.start;
    const end_bp = coords.end;

    const width = getTotalPixelWidth(metadata, viewerScale);

    setViewerSettings({
      start_bp,
      end_bp,
      width,
      scale: viewerScale,
    });
  }, [data, viewerScale]);

  const xScrollRef = useRef(null);
  const yScrollRef = useRef(null);
  const viewportRef = useRef(null);
  const savedCenterGenomicPos = useRef(null);

  useEffect(() => {
    if (savedCenterGenomicPos.current === null) return;
    if (!viewportRef.current || !data) return;

    const vp = viewportRef.current;
    const newCenterPixel = genomicToPixel(savedCenterGenomicPos.current, data.metadata, viewerSettings.scale);
    vp.scrollLeft = newCenterPixel - vp.clientWidth / 2;
    savedCenterGenomicPos.current = null;
  }, [viewerSettings]);

  const zoom = (factor) => {
    if (viewportRef.current && data) {
      const vp = viewportRef.current;
      const centerPixel = vp.scrollLeft + vp.clientWidth / 2;
      savedCenterGenomicPos.current = pixelToGenomic(centerPixel, data.metadata, viewerScale);
    }
    setViewerScale((prev) => prev * factor);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "+" || e.key === "=") zoom(1.25);
      else if (e.key === "-" || e.key === "_") zoom(1 / 1.25);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [data, viewerScale]);

  return (
    <>
      <div className="h-full w-full">
        {data !== null &&
          (() => {
            const coveredTxIds = new Set([...data.sites.map((s) => s.transcript_id)]);
            const allTxIds = Object.keys(data.transcripts);
            const sortedTxIds = [
              ...allTxIds.filter((id) => coveredTxIds.has(id)),
              ...allTxIds.filter((id) => !coveredTxIds.has(id)),
            ];

            return (
              <div className="flex flex-col h-full justify-between">
                <div className="flex flex-row gap-2 min-h-0 flex-1">
                  <div className="flex flex-col pl-2">
                    <div className="h-[80px] font-bold text-right text-base/[136px]">{data.metadata.chr}</div>
                    <div ref={yScrollRef} className="overflow-y-hidden pb-25">
                      {sortedTxIds.map((txId) => (
                        <div
                          className={
                            `h-[54px] text-base/[82px] ${coveredTxIds.has(txId) ? "" : "text-gray-400"} ` +
                            (selectedSite?.transcript_id === txId ? "text-blue-700 underline" : "")
                          }
                          key={txId}
                        >
                          {txId}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col flex-1 min-w-0">
                    <Axis ref={xScrollRef} view={viewerSettings} metadata={data?.metadata} cursorX={cursorX} />
                    <TrackView
                      ref={viewportRef}
                      data={data}
                      view={viewerSettings}
                      yScrollRef={yScrollRef}
                      xScrollRef={xScrollRef}
                      onCursorMove={setCursorX}
                      cursorX={cursorX}
                      sortedTxIds={sortedTxIds}
                      coveredTxIds={coveredTxIds}
                      selectedSite={selectedSite}
                      setSelectedSite={setSelectedSite}
                    />
                  </div>
                </div>

                <InfoPanel
                  data={data}
                  viewerSettings={viewerSettings}
                  zoom={zoom}
                  selectedSite={selectedSite}
                  setSelectedSite={setSelectedSite}
                />
              </div>
            );
          })()}
      </div>
    </>
  );
}

export default TrackDisplay;
