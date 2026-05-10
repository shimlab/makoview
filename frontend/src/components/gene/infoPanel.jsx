import { useAtomValue, useAtom } from "jotai";
import { AnimatedWave, StaticWave, CloseArrow } from "./infoPanelSvgs";
import { dataAtom, viewerSettingsAtom, selectedSiteAtom } from "../../store";

const formatPValue = (v) => {
  if (v === null || v === undefined) return null;

  let stars = "";
  if (v < 0.1) stars = ".";
  if (v < 0.05) stars = "*";
  if (v < 0.01) stars = "**";
  if (v < 0.001) stars = "***";

  return v.toPrecision(3) + stars;
};

const SITE_FIELDS = {
  transcript_id: { label: "Transcript" },
  transcript_position: { label: "Tx position", format: (v) => v?.toLocaleString() },
  chr: { label: "Chr" },
  chr_position: { label: "Chr position", format: (v) => v?.toLocaleString() },
  model_type: { label: "Model" },
  p_value: { label: "p-value", format: formatPValue },
  bh_corrected_p_value: { label: "BH corrected p-value", format: formatPValue },
  test_statistic: { label: "Test statistic", format: (v) => v?.toFixed(6) },
  estimate: { label: "Estimate", format: (v) => v?.toFixed(6) },
  std_err: { label: "Standard error", format: (v) => v?.toFixed(6) },
  sample_count: { label: "Samples covered" },
  total_read_count: { label: "Reads covered" },
  max_prob: { label: "Max site p'bty", format: (v) => v?.toFixed(6) },
  min_prob: { label: "Min site p'bty", format: (v) => v?.toFixed(6) },
  avg_probability_modified: { label: "Avg site p'bty", format: (v) => v?.toFixed(6) },
};

function InfoPanel({ zoom }) {
  const data = useAtomValue(dataAtom);
  const viewerSettings = useAtomValue(viewerSettingsAtom);
  const [selectedSite, setSelectedSite] = useAtom(selectedSiteAtom);

  return (
    <div className="w-full">
      <div className="w-full" style={{ minHeight: selectedSite ? "250px" : "110px" }}></div>
      <div className="">
        <AnimatedWave selectedSite={selectedSite} />

        <div
          className={`absolute left-0 w-full px-6 ${selectedSite ? "" : "hidden"}`}
          style={{ bottom: "75px", minHeight: "125px", maxHeight: "125px" }}
        >
          {selectedSite && (
            <div className="flex flex-row gap-4 text-white items-start">
              <CloseArrow onClose={() => setSelectedSite(null)} />

              {Object.keys(selectedSite)
                .filter((key) => SITE_FIELDS[key])
                .reduce((cols, key, i) => {
                  (cols[Math.floor(i / 5)] ??= []).push(key);
                  return cols;
                }, [])
                .map((keys, col) => (
                  <table key={col} className="border-collapse">
                    <tbody>
                      {keys.map((key) => {
                        const { label, format } = SITE_FIELDS[key];
                        return (
                          <tr key={key}>
                            <td className="pr-4 font-semibold opacity-85 text-sm uppercase">{label}</td>
                            <td>{format ? format(selectedSite[key]) : selectedSite[key]}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ))}
            </div>
          )}
        </div>

        <StaticWave />

        <div className="absolute bottom-0 left-0 text-slate-900 p-2 w-full flex flex-row text-md items-center gap-3">
          <div className="font-bold">Gene: {data.metadata.gene_name}</div>
          <div className="text-sm">
            {data.metadata.gene_id}
            <br />
            {data.metadata.chr} {data.metadata.start.toLocaleString()}
            &nbsp;—&nbsp;
            {data.metadata.end.toLocaleString()}
          </div>
          <div className="flex-1"></div>
          <div className="text-lg">{Math.round(viewerSettings.scale)}%</div>
          <button
            className="text-xl min-w-8 min-h-8 bg-white rounded-md border-2 border-gray-500 cursor-pointer"
            onClick={() => zoom(1.25)}
          >
            +
          </button>
          <button
            className="text-xl min-w-8 min-h-8 bg-white rounded-md border-2 border-gray-500 cursor-pointer"
            onClick={() => zoom(1 / 1.25)}
          >
            –
          </button>
        </div>
      </div>
    </div>
  );
}

export default InfoPanel;
