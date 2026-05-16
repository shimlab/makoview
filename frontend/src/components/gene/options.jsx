import { useAtom } from "jotai";
import { displayOptionsAtom } from "../../store";

function OptionsBar() {
  const [options, setOptions] = useAtom(displayOptionsAtom);

  const toggle = (key) => setOptions((prev) => ({ ...prev, [key]: !prev[key] }));

  const items = [
    { key: "untestedSites", label: "Untested sites" },
    { key: "nonSignificantSites", label: "Non-significant sites" },
    { key: "significantSites", label: "Significant sites" },
  ];

  return (
    <div className="flex flex-row gap-2 items-center px-4 h-10 bg-white">
      <span className="text-xs font-semibold uppercase text-gray-500 mr-1">Show</span>
      {items.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => toggle(key)}
          className={`text-sm px-3 py-0.5 rounded-full border-2 cursor-pointer whitespace-nowrap transition-colors duration-100 ${
            options[key]
              ? "border-blue-800 bg-blue-100 text-blue-900 font-semibold"
              : "border-gray-300 bg-white text-gray-500"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default OptionsBar;
