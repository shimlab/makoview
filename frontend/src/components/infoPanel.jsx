import { useEffect } from "react";

const Label = ({ children }) => <td className="pr-1 font-semibold opacity-85 text-sm uppercase">{children}</td>;
const Value = ({ children }) => <td className="text-md">{children}</td>;

function InfoPanel({ data, viewerSettings, zoom, selectedSite, setSelectedSite }) {
  return (
    <div className="w-full">
      <div className="w-full min-h-40"></div>
      <div className="">
        <svg
          id="wave-1"
          width="100%"
          height="320"
          viewBox="0 0 680 320"
          preserveAspectRatio="none"
          className="absolute bottom-0 left-0 pointer-events-none transition-[transform] duration-150 ease-in-out"
          style={{ transform: selectedSite ? "translateY(0px)" : "translateY(140px)" }}
        >
          <path
            d="M 0 86 C 80 66 160 101 240 82 C 330 55 391 101 530 82 C 554 77 601 72 680 86 L 680 350 L 0 350 Z"
            fill="#0e4f7a"
          />
          <path
            d="M 0 102 C 90 82 170 115 260 96 C 340 78 403 121 569 86 C 611 77 660 102 680 98 L 680 350 L 0 350 Z"
            fill="#079aaa"
          />
        </svg>

        <div className="absolute left-0 w-full px-6" style={{ bottom: "75px", minHeight: "125px", maxHeight: "125px" }}>
          {selectedSite && (
            <div className="flex flex-row gap-4 text-white">
              <svg
                width="40"
                height="125"
                viewBox="0 0 40 125"
                onClick={() => setSelectedSite(null)}
                className="cursor-pointer mr-8"
              >
                <defs>
                  <marker id="arrowhead" viewBox="0 0 10 10" refX="5" refY="10" markerWidth="8" markerHeight="8">
                    <path
                      d="M0 0L5 10L10 0"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </marker>
                </defs>
                <path
                  d="M15 0 C23 15, 7 30, 15 45 C23 60, 7 75, 15 90 C19 98, 15 110, 15 120"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  marker-end="url(#arrowhead)"
                />
                <text x="25" y="60" text-anchor="middle" transform="rotate(90, 25, 60)" fill="currentColor">
                  CLOSE
                </text>
              </svg>

              <table className="border-collapse">
                <tbody>
                  <tr>
                    <Label>Transcript</Label>
                    <td>{selectedSite.transcript_id}</td>
                  </tr>
                  <tr>
                    <Label>Tx position</Label>
                    <td>{selectedSite.transcript_position?.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <Label>Chr</Label>
                    <td>{selectedSite.chr}</td>
                  </tr>
                  <tr>
                    <Label>Chr position</Label>
                    <td>{selectedSite.chr_position?.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <Label>Model</Label>
                    <td>{selectedSite.model_type}</td>
                  </tr>
                </tbody>
              </table>
              <table className="border-collapse">
                <tbody>
                  <tr>
                    <Label>p-value</Label>
                    <td>{selectedSite.p_value?.toFixed(6)}</td>
                  </tr>
                  <tr>
                    <Label>BH corrected p-value</Label>
                    <td>{selectedSite.bh_corrected_p_value?.toFixed(6)}</td>
                  </tr>
                  <tr>
                    <Label>Test statistic</Label>
                    <td>{selectedSite.test_statistic?.toFixed(6)}</td>
                  </tr>
                  <tr>
                    <Label>Estimate</Label>
                    <td>{selectedSite.estimate?.toFixed(6)}</td>
                  </tr>
                  <tr>
                    <Label>Std err</Label>
                    <td>{selectedSite.std_err?.toFixed(6)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        <svg
          id="wave-2"
          width="100%"
          height="170"
          viewBox="0 0 680 170"
          preserveAspectRatio="none"
          className="absolute bottom-0 left-0 pointer-events-none"
        >
          <path
            d="M 0 117 C 100 97 160 138 280 110 C 370 92 450 120 530 102 C 590 88 640 105 680 110 L 680 170 L 0 170 Z"
            fill="#00e0e0"
            opacity="0.85"
          />
        </svg>

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
