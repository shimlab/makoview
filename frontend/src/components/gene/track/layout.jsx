import { useEffect } from "react";
import { useRef } from "react";
import { useAtomValue } from "jotai";
import Axis from "./axis";
import TrackView from "./trackview";
import Sidebar from "./sidebar";
import TrackRenderer from "./render";
import { dataAtom, isDemoAtom } from "../../../store";
import { useViewerSettings } from "../../../utils/useViewerSettings";

import tutorialLegend from "../../../assets/tutorial_legend.svg";
import tutorialAxis from "../../../assets/tutorial_axis.svg";

function TrackDisplay() {
  const data = useAtomValue(dataAtom);
  const isDemo = useAtomValue(isDemoAtom);
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
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-1100 bg-white px-5 pt-4 pb-3 rounded-md w-[500px] pointer-events-auto border-2 border-black">
                        <h1 className="text-xl font-semibold">Welcome to Makoview!</h1>
                        <p className="mt-2">
                          Makoview is an interactive tool for visualising the RNA modifications called by the{" "}
                          <code>mako</code> pipeline.{" "}
                          <a href="https://shimlab.github.io/mako" target="_blank" className="text-blue-600 underline">
                            Docs ↗
                          </a>
                        </p>
                        {isDemo && (
                          <p className="mt-2">
                            You're currently running in <span className="text-red-600">demo mode</span>, using sample
                            data, so search is not available.
                          </p>
                        )}
                        <button className="mt-2 px-4 py-1 border-2 border-blue-900 bg-white text-blue-900 rounded-full cursor-pointer hover:bg-blue-900 hover:text-white duration-100">
                          Dismiss tutorial
                        </button>
                      </div>
                      <img src={tutorialLegend} width="529" className="absolute bottom-[-65px] right-[25px] z-1100" />
                      <img src={tutorialAxis} width="611" className="absolute top-[-45px] left-[15px] z-1100" />
                      <div className="bg-[rgba(0,0,0,0.5)] z-999 absolute top-0 left-0 bottom-[-40px] right-[-20px] ml-2 mt-2 rounded-lg" />
                    </div>
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
