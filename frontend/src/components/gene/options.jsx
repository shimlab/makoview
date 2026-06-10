import { useAtom } from "jotai";
import { displayOptionsAtom } from "../../store";

function OptionsBar() {
  const [options, setOptions] = useAtom(displayOptionsAtom);

  const toggle = (key) => setOptions((prev) => ({ ...prev, [key]: !prev[key] }));

  const items = [
    { key: "untestedSites", label: "Untested sites" },
    {
      key: "nonSignificantSites",
      label: "Non-significant sites",
      icon: (
        <svg width="16" height="14" viewBox="0 0 16 14" className="inline-block mr-1 -mt-0.5">
          <polygon points="2,12 14,12 8,1" fill="white" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      key: "significantSites",
      label: "Significant sites",
      icon: (
        <svg width="16" height="14" viewBox="0 0 16 14" className="inline-block mr-1 -mt-0.5">
          <polygon points="2,12 14,12 8,1" fill="currentColor" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-row gap-2 items-center px-4 h-10 bg-white">
      <span className="text-xs font-semibold uppercase text-gray-500 mr-1">Show</span>
      {items.map(({ key, label, icon }) => (
        <button
          key={key}
          onClick={() => toggle(key)}
          className={`text-sm px-3 py-0.5 rounded-full border-2 cursor-pointer whitespace-nowrap hover-lift ${
            options[key]
              ? "border-blue-800 bg-blue-100 text-blue-900 font-semibold"
              : "border-gray-300 bg-white text-gray-500"
          }`}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  );
}

export default OptionsBar;
