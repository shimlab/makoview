import { useEffect, useRef } from "react";
import SiteNavbar from "./components/site/navbar";

const data = window.__SITE_DATA__;
const { site, test, reads } = data;

const SITE_FIELDS = [
  ["transcript_id", "Transcript ID"],
  ["transcript_position", "Transcript position"],
  ["chr", "Chromosome"],
  ["chr_position", "Chromosome position"],
  ["rname", "Reference name"],
  ["sample_count", "Sample count"],
  ["total_read_count", "Total read count"],
  ["avg_probability_modified", "Avg. probability modified"],
  ["max_prob", "Max probability"],
  ["min_prob", "Min probability"],
  ["selected", "Selected"],
];

const TEST_FIELDS = [
  ["model_type", "Model type"],
  ["p_value", "p-value"],
  ["bh_corrected_p_value", "BH-corrected p-value"],
  ["test_statistic", "Test statistic"],
  ["estimate", "Estimate"],
  ["std_err", "Std. error"],
];

function formatValue(value) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") {
    if (Number.isInteger(value)) return value.toString();
    return value.toPrecision(6);
  }
  return String(value);
}

function InfoTable({ title, fields, obj }) {
  return (
    <div className="mb-6">
      <h2 className="text-md font-semibold uppercase tracking-wide text-gray-500 mb-2">{title}</h2>
      <table className="w-full text-sm border border-gray-400 rounded">
        <tbody>
          {fields.map(([key, label]) => (
            <tr key={key} className="even:bg-sky-100">
              <td className="px-3 py-1.5 font-medium text-gray-900 border-r w-1/3 border-gray-400">{label}</td>
              <td className="px-3 py-1.5 text-gray-900 break-all">{obj ? formatValue(obj[key]) : "Not tested"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ViolinPlot({ title, src }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold uppercase tracking-wide text-gray-700">{title}</h2>
      <img src={src} alt={title} className="w-full" />
    </div>
  );
}

export default function SitePage() {
  const navbarRef = useRef(null);

  useEffect(() => {
    document.title = `makoview: ${site.transcript_id}:${site.transcript_position}`;
  }, []);

  const plotBase = `/plot/`;
  const plotParams = `?id=${encodeURIComponent(site.transcript_id)}&position=${site.transcript_position}`;

  return (
    <>
      <SiteNavbar ref={navbarRef} defaultSite={{ id: site.transcript_id, position: site.transcript_position }} />

      <div className="pt-24 px-6 pb-8 max-w-screen-xl mx-auto">
        <div className="mb-4">
          <h1 className="text-xl font-semibold">
            {site.transcript_id}
            <span className="text-gray-400 font-normal"> · position {site.transcript_position}</span>
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left column: site stats + test results */}
          <div className="lg:w-112 shrink-0">
            <InfoTable title="Site Statistics" fields={SITE_FIELDS} obj={site} />
            <InfoTable title="Statistical Test" fields={TEST_FIELDS} obj={test} />
          </div>

          {/* Right column: reads table + violin plots */}
          <div className="flex-1 min-w-0">
            <div className="mb-6">
              <h2 className="text-md font-semibold uppercase tracking-wide text-gray-500 mb-2">
                Per-sample Read Counts
              </h2>
              <table className="w-full text-sm text-left border border-gray-400">
                <thead>
                  <tr className="bg-blue-200 font-semibold text-gray-700">
                    <th className="px-3 py-2 border border-gray-400">sample_name</th>
                    <th className="px-3 py-2 border border-gray-400">group_name</th>
                    <th className="px-3 py-2 border border-gray-400">read_count</th>
                    <th className="px-3 py-2 border border-gray-400">successes</th>
                    <th className="px-3 py-2 border border-gray-400">failures</th>
                  </tr>
                </thead>
                <tbody>
                  {reads.map((r, i) => (
                    <tr key={i} className="even:bg-sky-100">
                      <td className="px-3 py-1.5 border-r border-gray-400">{r.sample_name}</td>
                      <td className="px-3 py-1.5 border-r border-gray-400">{r.group_name}</td>
                      <td className="px-3 py-1.5 border-r border-gray-400">{r.probabilities_modified.length}</td>
                      <td className="px-3 py-1.5 border-r border-gray-400">
                        {r.probabilities_modified.filter((p) => p >= 0.5).length}
                      </td>
                      <td className="px-3 py-1.5">{r.probabilities_modified.filter((p) => p < 0.5).length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ViolinPlot title="Probability Modified" src={plotBase + "probabilities" + plotParams} />
            <ViolinPlot title="Binarised Probability Modified" src={plotBase + "binarisedProbabilities" + plotParams} />
          </div>
        </div>
      </div>
    </>
  );
}
