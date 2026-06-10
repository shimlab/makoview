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
          const sortedReads = [...data.transcripts[txId].reads].sort(
            (a, b) => a.group.localeCompare(b.group) || a.sample.localeCompare(b.sample),
          );

          const txIdWithoutVersion = txId.replace(/\.\d+$/, "");

          const popupTop = sidebarRect.top + 80 + index * 80 - scrollTop;
          const popupLeft = sidebarRect.right - 2;

          return (
            <div
              className={`group h-[80px] ${coveredTxIds.has(txId) ? "" : "text-gray-400"} flex flex-col justify-center `}
              key={txId}
            >
              <div className={"rounded-sm p-2 ml-2 " + (selectedSite?.transcript_id === txId ? "bg-[#acdce3]" : "")}>
                <div className="text-xs tabular-nums">
                  {tx_counts} reads ({pct}%)
                </div>
                <div className="tabular-nums">{txId}</div>
              </div>

              <div
                className="opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto fixed z-[9999] bg-white border border-gray-600 rounded-lg shadow-lg p-4 text-sm text-black"
                style={{ top: popupTop, left: popupLeft }}
              >
                <div className="absolute -left-[6px] top-[35px] w-[10px] h-[10px] bg-white border-l border-b border-gray-600 rotate-45" />

                <div className="tabular-nums text-md mb-4">{txId}</div>

                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200 pb-1 text-xs uppercase text-gray-600">
                      <th className="font-medium">sample</th>
                      <th className="font-medium">group</th>
                      <th className="text-right font-medium">count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedReads.map((r) => (
                      <tr key={r.sample} className="pb-1 border-spacing-4">
                        <td className="pr-4">{r.sample}</td>
                        <td className="pr-4">{r.group}</td>
                        <td className="tabular-nums text-right">{r.read_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <a
                  href={`https://www.ensembl.org/Multi/Search/Results?q=${txIdWithoutVersion};site=ensembl;page=1;facet_feature_type=Transcript`}
                  target="_blank"
                  className="block mt-4 px-2 py-1 text-xs bg-[#3366cc] text-white rounded hover:bg-[#254a99] text-center"
                >
                  Search Ensembl ↗
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Sidebar;
