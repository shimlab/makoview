import { useAtomValue } from "jotai";
import { useRef, useState, useEffect, useLayoutEffect } from "react";
import { dataAtom, selectedSiteAtom } from "../../../store";

function Sidebar({ sortedTxIds, coveredTxIds, yScrollRef }) {
  const data = useAtomValue(dataAtom);
  const selectedSite = useAtomValue(selectedSiteAtom);
  const sidebarRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [sidebarRect, setSidebarRect] = useState({ top: 0, right: 0 });

  useLayoutEffect(() => {
    const updateRect = () => {
      if (sidebarRef.current) {
        const r = sidebarRef.current.getBoundingClientRect();
        setSidebarRect({ top: r.top, right: r.right });
      }
    };
    updateRect();
    window.addEventListener("resize", updateRect);
    return () => window.removeEventListener("resize", updateRect);
  }, []);

  useEffect(() => {
    const el = yScrollRef.current;
    if (!el) return;
    const handleScroll = () => setScrollTop(el.scrollTop);
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [yScrollRef]);

  return (
    <div className="relative" ref={sidebarRef}>
      <div className="absolute top-[32px] right-0 italic text-sm text-right">DRACH motifs</div>
      <div className="absolute top-[60px] right-0 font-bold text-right">{data.metadata.chr}</div>
      <div ref={yScrollRef} className="pb-25 mt-[80px] overflow-y-hidden h-full">
        {sortedTxIds.map((txId, index) => {
          const tx_counts = data.transcripts[txId].reads.reduce((sum, o) => sum + o.read_count, 0);
          const totalReads = data.metadata.total_reads;
          const pct = totalReads > 0 ? ((tx_counts / totalReads) * 100).toFixed(1) : "0.0";
          const sortedReads = [...data.transcripts[txId].reads].sort((a, b) => b.read_count - a.read_count);
          const isEnsembl = txId.startsWith("ENST");

          const popupTop = sidebarRect.top + 80 + index * 80 - scrollTop;
          const popupLeft = sidebarRect.right + 4;

          return (
            <div
              className={`group h-[80px] ${coveredTxIds.has(txId) ? "" : "text-gray-400"} flex flex-col justify-center `}
              key={txId}
            >
              <div className={"rounded-sm p-2 ml-2 " + (selectedSite?.transcript_id === txId ? "bg-[#acdce3]" : "")}>
                <div className="text-xs">
                  {tx_counts} reads ({pct}%)
                </div>
                <div>{txId}</div>
              </div>

              <div
                className="opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150 fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-48 text-sm text-gray-800"
                style={{ top: popupTop, left: popupLeft }}
              >
                {isEnsembl && (
                  <a
                    href={`https://www.ensembl.org/Multi/Search/Results?q=${txId};site=ensembl;page=1;facet_feature_type=Transcript`}
                    target="_blank"
                    rel="noreferrer"
                    className="block mb-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 text-center"
                  >
                    Open in Ensembl ↗
                  </a>
                )}
                <ul className="space-y-1">
                  {sortedReads.map((r) => (
                    <li key={r.sample} className="flex justify-between gap-3">
                      <span className="text-gray-500">
                        {r.sample} ({r.group})
                      </span>
                      <span className="font-medium tabular-nums">{r.read_count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Sidebar;
