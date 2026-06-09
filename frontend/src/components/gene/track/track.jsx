import React, { useRef, useEffect } from "react";
import { useAtomValue } from "jotai";
import { dataAtom, selectedTrackPosAtom } from "../../../store";
import { useViewerSettings } from "../../../utils/useViewerSettings";

const LINE_HEIGHT = 80;

function TrackView({ xScrollRef, yScrollRef, ref, sortedTxIds, coveredTxIds, renderer: Renderer }) {
  const data = useAtomValue(dataAtom);
  const { px, viewport, setViewportScroll, setCursorX } = useViewerSettings();
  const selectedTrackPos = useAtomValue(selectedTrackPosAtom);

  const isPanning = useRef(false);
  const panStartCoords = useRef({ x: 0, y: 0 });
  const panMoveRef = useRef(null);
  const panEndRef = useRef(null);

  const viewportRef = ref;

  useEffect(() => {
    if (viewportRef.current) {
      setViewportScroll({
        scrollLeft: viewportRef.current.scrollLeft,
        clientWidth: viewportRef.current.clientWidth,
      });
    }
  }, []);

  const panStart = (e) => {
    e.preventDefault();
    isPanning.current = true;
    panStartCoords.current.x = viewportRef.current.scrollLeft + e.clientX;
    panStartCoords.current.y = viewportRef.current.scrollTop + e.clientY;

    viewportRef.current.style.cursor = "grabbing";

    panMoveRef.current = panMove;
    panEndRef.current = panEnd;
    document.addEventListener("mousemove", panMoveRef.current);
    document.addEventListener("mouseup", panEndRef.current);
  };

  const panMove = (e) => {
    if (viewportRef.current) {
      const pixelX = e.clientX - viewportRef.current.getBoundingClientRect().left + viewportRef.current.scrollLeft;
      setCursorX(pixelX);
    }

    if (!isPanning.current) return;
    viewportRef.current.scrollLeft = panStartCoords.current.x - e.clientX;
    viewportRef.current.scrollTop = panStartCoords.current.y - e.clientY;
  };

  const panEnd = () => {
    isPanning.current = false;
    viewportRef.current.style.cursor = "";
    setCursorX(null);
    document.removeEventListener("mousemove", panMoveRef.current);
    document.removeEventListener("mouseup", panEndRef.current);
  };

  const syncScroll = (e) => {
    xScrollRef.current.scrollLeft = e.target.scrollLeft;
    yScrollRef.current.scrollTop = e.target.scrollTop;
    setViewportScroll({ scrollLeft: e.target.scrollLeft, clientWidth: e.target.clientWidth });
  };

  const cursorMove = (e) => {
    if (!isPanning.current && viewportRef.current) {
      const pixelX = e.clientX - viewportRef.current.getBoundingClientRect().left + viewportRef.current.scrollLeft;
      setCursorX(pixelX);
    }
  };

  const transcriptCount = Object.keys(data.transcripts).length;
  const svgHeight = transcriptCount * LINE_HEIGHT;

  return (
    <div
      ref={viewportRef}
      className="overflow-scroll flex-1"
      onScroll={syncScroll}
      onMouseDown={panStart}
      onMouseMove={cursorMove}
      onMouseLeave={() => setCursorX(null)}
    >
      <svg height={svgHeight} width={px.end}>
        <defs>
          <pattern id="track-fwd-strand" x="0" y="0" width="20" height="80" patternUnits="userSpaceOnUse">
            <line x1="0" x2="20" y1="54" y2="54" stroke="#999" strokeWidth="2" />
            <polyline points="3,49 9,53 3,59" fill="none" stroke="#999" strokeWidth="2" />
          </pattern>

          <pattern id="track-fwd-strand-nocover" x="0" y="0" width="20" height="80" patternUnits="userSpaceOnUse">
            <line x1="0" x2="20" y1="54" y2="54" stroke="#ddd" strokeWidth="2" />
            <polyline points="3,49 9,53 3,59" fill="none" stroke="#ddd" strokeWidth="2" />
          </pattern>

          <pattern id="track-rev-strand" x="0" y="0" width="20" height="80" patternUnits="userSpaceOnUse">
            <line x1="0" x2="20" y1="54" y2="54" stroke="#999" strokeWidth="2" />
            <polyline points="9,49 3,53 9,59" fill="none" stroke="#999" strokeWidth="2" />
          </pattern>

          <pattern id="track-rev-strand-nocover" x="0" y="0" width="20" height="80" patternUnits="userSpaceOnUse">
            <line x1="0" x2="20" y1="54" y2="54" stroke="#ddd" strokeWidth="2" />
            <polyline points="9,49 3,53 9,59" fill="none" stroke="#ddd" strokeWidth="2" />
          </pattern>
        </defs>

        {selectedTrackPos && (
          <rect x={selectedTrackPos - 4} y={0} width={9} height={svgHeight} fill="#acdce3" pointerEvents="none" />
        )}

        <Renderer
          sortedTxIds={sortedTxIds}
          coveredTxIds={coveredTxIds}
          visibleGenomicStart={viewport.bp.start}
          visibleGenomicEnd={viewport.bp.end}
        />
      </svg>
    </div>
  );
}

export default TrackView;
