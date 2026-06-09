import { useEffect } from "react";
import { useRef } from "react";
import { useAtomValue } from "jotai";
import Axis from "./axis";
import TrackView from "./track";
import Sidebar from "./sidebar";
import { dataAtom } from "../../../store";
import { useViewerSettings } from "../../../utils/useViewerSettings";

function TrackDisplay({ renderer }) {
  const data = useAtomValue(dataAtom);
  const { viewport } = useViewerSettings();

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
                  <Sidebar sortedTxIds={sortedTxIds} coveredTxIds={coveredTxIds} yScrollRef={yScrollRef} />

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
