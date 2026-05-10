import { useEffect } from "react";
import { useRef } from "react";
import { useAtom, useAtomValue } from "jotai";
import Axis from "./axis";
import TrackView from "./track";
import InfoPanel from "./infoPanel";
import { pixelToGenomic, genomicToPixel } from "../../utils/coordinates";
import {
  dataAtom,
  viewerScaleAtom,
  viewerSettingsAtom,
  cursorXAtom,
  selectedSiteAtom,
  selectedTrackPosAtom,
} from "../../store";

function TrackDisplay() {
  const data = useAtomValue(dataAtom);
  const [viewerScale, setViewerScale] = useAtom(viewerScaleAtom);
  const viewerSettings = useAtomValue(viewerSettingsAtom);
  const [cursorX, setCursorX] = useAtom(cursorXAtom);
  const [selectedSite, setSelectedSite] = useAtom(selectedSiteAtom);
  const selectedTrackPos = useAtomValue(selectedTrackPosAtom);

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
                  <div className="relative pl-2">
                    <div className="absolute top-[32px] right-0 italic text-sm text-right">DRACH motifs</div>
                    <div className="absolute top-[60px] right-0 font-bold text-right">{data.metadata.chr}</div>
                    <div ref={yScrollRef} className="pb-25 mt-[80px] overflow-y-hidden h-full">
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
                    <Axis ref={xScrollRef} />
                    <TrackView
                      ref={viewportRef}
                      yScrollRef={yScrollRef}
                      xScrollRef={xScrollRef}
                      sortedTxIds={sortedTxIds}
                      coveredTxIds={coveredTxIds}
                    />
                  </div>
                </div>

                <InfoPanel zoom={zoom} />
              </div>
            );
          })()}
      </div>
    </>
  );
}

export default TrackDisplay;
