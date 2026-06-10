import { useEffect, useRef } from "react";
import { useAtomValue, useAtom } from "jotai";
import { AnimatedWave, StaticWave, CloseArrow } from "./infoPanelSvgs";
import { pixelToGenomic, genomicToPixel } from "../../utils/coordinates";
import { dataAtom, selectedSiteAtom, isDemoAtom, showTutorialAtom } from "../../store";
import { useViewerSettings } from "../../utils/useViewerSettings";

const formatNumericalValue = (n) => {
  // preferred over .toExponential so that e+0 is not shown,
  // and positive exponent does not have a + sign
  const exp = Math.floor(Math.log10(Math.abs(n)));
  const mantissa = (n / 10 ** exp).toFixed(2);
  return exp === 0 ? mantissa : `${mantissa}e${exp}`;
};

const formatPValue = (v) => {
  if (v === null || v === undefined) return null;

  let stars = "";
  if (v < 0.1) stars = ".";
  if (v < 0.05) stars = "*";
  if (v < 0.01) stars = "**";
  if (v < 0.001) stars = "***";

  return formatNumericalValue(v) + stars;
};

const SITE_FIELDS = {
  transcript_id: { label: "Transcript" },
  transcript_position: { label: "Tx position", format: (v) => v?.toLocaleString() },
  chr: { label: "Chr" },
  chr_position: { label: "Chr position", format: (v) => v?.toLocaleString() },
  model_type: { label: "Model" },
  p_value: { label: "p-value", format: formatPValue },
  bh_corrected_p_value: { label: "BH corrected p-value", format: formatPValue },
  test_statistic: { label: "Test statistic", format: formatNumericalValue },
  estimate: { label: "Estimate", format: formatNumericalValue },
  std_err: { label: "Standard error", format: formatNumericalValue },
  sample_count: { label: "Samples covered" },
  total_read_count: { label: "Reads covered" },
  max_prob: { label: "Max site p'bty", format: formatNumericalValue },
  min_prob: { label: "Min site p'bty", format: formatNumericalValue },
  avg_probability_modified: { label: "Avg site p'bty", format: formatNumericalValue },
};

function InfoPanel() {
  const data = useAtomValue(dataAtom);
  const { scale, viewport, setScale, setViewportScroll } = useViewerSettings();
  const [selectedSite, setSelectedSite] = useAtom(selectedSiteAtom);
  const isDemo = useAtomValue(isDemoAtom);
  const [showTutorial, setShowTutorial] = useAtom(showTutorialAtom);

  const scrollLeft = viewport.px.start;
  const clientWidth = viewport.px.end - viewport.px.start;

  const zoom = (factor) => {
    const center_bp = pixelToGenomic(scrollLeft + clientWidth / 2);
    setScale((prev) => prev * factor);
    setViewportScroll({ scrollLeft: genomicToPixel(center_bp) - clientWidth / 2, clientWidth });
  };

  const zoomRef = useRef(null);
  zoomRef.current = zoom;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "+" || e.key === "=") zoomRef.current(1.25);
      else if (e.key === "-" || e.key === "_") zoomRef.current(1 / 1.25);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="w-full">
      <div className="w-full" style={{ minHeight: selectedSite ? "250px" : "110px" }}></div>
      <div className="">
        <AnimatedWave selectedSite={selectedSite} />

        <div
          className={`absolute left-0 w-full px-6 ${selectedSite ? "" : "hidden"} z-1002`}
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

              <div className="grow" />
              {!isDemo && (
                <a
                  className="self-center rounded-xl border-white border-2 w-35 h-25 flex items-center justify-center text-lg font-medium hover:bg-white hover:text-blue-900 transition-colors"
                  href={`/site/${selectedSite.transcript_id}/${selectedSite.transcript_position}`}
                  target="_blank"
                >
                  Inspect site →
                </a>
              )}
            </div>
          )}
        </div>

        <StaticWave />

        <div className="absolute bottom-0 left-0 text-slate-900 p-2 w-full flex flex-row text-md items-center gap-3 z-1002">
          <div className="font-bold">Gene: {data.metadata.gene_name}</div>
          <div className="text-sm">
            {data.metadata.gene_id}
            <br />
            {data.metadata.chr} {data.metadata.start.toLocaleString()}
            &nbsp;—&nbsp;
            {data.metadata.end.toLocaleString()}
          </div>
          <div className="flex-1"></div>
          <button
            className="text-sm px-3 min-h-8 mr-4 bg-white rounded-full border-2 border-teal-50 cursor-pointer hover-lift"
            onClick={() => setShowTutorial((v) => !v)}
          >
            {showTutorial ? "Dismiss tutorial" : "Show tutorial"}
          </button>
          <div className="text-lg tabular-nums">{Math.round(scale)}%</div>
          <button
            className="text-xl min-w-8 min-h-8 bg-white rounded-full border-2 border-teal-700 cursor-pointer hover-lift"
            onClick={() => zoom(1.25)}
          >
            +
          </button>
          <button
            className="text-xl min-w-8 min-h-8 bg-white rounded-full border-2 border-teal-700 cursor-pointer hover-lift"
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
