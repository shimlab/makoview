import { useEffect } from "react";
import { useRef } from "react";
import { useAtomValue } from "jotai";
import Axis from "./axis";
import TrackView from "./trackview";
import Sidebar from "./sidebar";
import TrackRenderer from "./render";
import { dataAtom } from "../../../store";
import { useViewerSettings } from "../../../utils/useViewerSettings";

function TrackDisplay() {
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
                <style>{`
                .trackViewController {
                  position: relative;
                }

                .trackViewController::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 30px;
                    height: 100%;
                   background: linear-gradient(to right,
                      rgba(255,255,255,1) 0%,
                      rgba(255,255,255,0.9) 20%,
                      rgba(255,255,255,0.6) 60%,
                      rgba(255,255,255,0) 100%
                    );
                    pointer-events: none;
                    z-index: 1;
                  }
                `}</style>
                <div className="flex flex-row min-h-0 flex-1">
                  <Sidebar sortedTxIds={sortedTxIds} coveredTxIds={coveredTxIds} yScrollRef={yScrollRef} />

                  <div className="trackViewController flex flex-col flex-1 min-w-0">
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
              </div>
            );
          })()}
      </div>
    </>
  );
}

export default TrackDisplay;
