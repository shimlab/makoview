import { useEffect } from "react";
import { useRef } from "react";
import { useAtom, useAtomValue } from "jotai";
import Axis from "./axis";
import TrackView from "./track";
import { dataAtom, selectedSiteAtom } from "../../../store";
import { useViewerSettings } from "../../../utils/useViewerSettings";

function TrackDisplay({ renderer }) {
  const data = useAtomValue(dataAtom);
  const { viewport } = useViewerSettings();
  const [selectedSite, setSelectedSite] = useAtom(selectedSiteAtom);

  const xScrollRef = useRef(null);
  const yScrollRef = useRef(null);
  const viewportRef = useRef(null);

  useEffect(() => {
    const vp = viewportRef.current;
    vp.scrollLeft = viewport.px.start;
  }, [viewport.px.start]);

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
              <div className="flex flex-col h-full">
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
                      renderer={renderer}
                    />
                  </div>
                </div>
              </div>
            );
          })()}
      </div>
    </>
  );
}

export default TrackDisplay;
