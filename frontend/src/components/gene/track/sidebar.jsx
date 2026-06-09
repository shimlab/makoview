import { useAtomValue } from "jotai";
import { dataAtom, selectedSiteAtom } from "../../../store";

function Sidebar({ sortedTxIds, coveredTxIds, yScrollRef }) {
  const data = useAtomValue(dataAtom);
  const selectedSite = useAtomValue(selectedSiteAtom);

  const all_tx_counts = Object.values(data.transcripts)
    .flatMap((tx) => tx.reads)
    .reduce((sum, o) => sum + o.read_count, 0);

  return (
    <div className="relative">
      <div className="absolute top-[32px] right-0 italic text-sm text-right">DRACH motifs</div>
      <div className="absolute top-[60px] right-0 font-bold text-right">{data.metadata.chr}</div>
      <div ref={yScrollRef} className="pb-25 mt-[80px] overflow-y-hidden h-full">
        {sortedTxIds.map((txId) => {
          const tx_counts = data.transcripts[txId].reads.reduce((sum, o) => sum + o.read_count, 0);

          const totalReads = data.metadata.total_reads;
          const pct = totalReads > 0 ? ((tx_counts / totalReads) * 100).toFixed(1) : "0.0";
          return (
            <div
              className={
                `h-[80px] ${coveredTxIds.has(txId) ? "" : "text-gray-400"} flex flex-col justify-center pl-2 pr-2 ` +
                (selectedSite?.transcript_id === txId ? "bg-[#acdce3]" : "")
              }
              key={txId}
            >
              <div className="text-xs">
                {tx_counts} reads ({pct}%)
              </div>
              <div className="">{txId}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Sidebar;
