import { useRef, useState, useEffect } from "react";
import AsyncSelect from "react-select/async";
import Select from "react-select";
import logo_img from "../../assets/makoview_logo.svg";

const baseUrl = "/";

const selectStyles = {
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  control: (base, state) => ({
    ...base,
    borderColor: "black",
    backgroundColor: state.isFocused ? "white" : "transparent",
    "&:hover": { borderColor: "black", backgroundColor: "white" },
  }),
  indicatorSeparator: (base) => ({
    ...base,
    backgroundColor: "black",
    "&:hover": { backgroundColor: "black" },
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: "#444",
    "&:hover": { color: "#444" },
  }),
  placeholder: (base, state) => ({
    ...base,
    color: state.isFocused ? "transparent" : "black",
  }),
};

export function IsoformSelector({ defaultSite = null }) {
  const transcriptRef = useRef(null);
  const positionRef = useRef(null);

  const [selectedTranscript, setSelectedTranscript] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [positionOptions, setPositionOptions] = useState([]);
  const [positionsLoading, setPositionsLoading] = useState(false);

  const loadTranscriptOptions = async (inputValue) => {
    if (inputValue.length < 3) return [];
    const res = await fetch(baseUrl + `api/searchTranscripts?q=${inputValue}`);
    const data = await res.json();
    return data.map((item) => ({ value: item, label: item }));
  };

  const onTranscriptChange = async (selectedOption) => {
    setSelectedTranscript(selectedOption);
    setSelectedPosition(null);
    setPositionOptions([]);

    if (!selectedOption) return;

    const transcriptId = selectedOption.value;
    setPositionsLoading(true);
    try {
      const res = await fetch(baseUrl + `api/searchTranscriptPositions?transcript_id=${transcriptId}`);
      const data = await res.json();
      setPositionOptions(data.map((item) => ({ value: item, label: item })));
    } finally {
      setPositionsLoading(false);
    }
  };

  useEffect(() => {
    if (defaultSite) {
      onTranscriptChange({ value: defaultSite.id, label: defaultSite.id });
      setSelectedPosition({ value: defaultSite.position, label: defaultSite.position });
    }
  }, []);

  const onPositionChange = (selectedOption) => {
    setSelectedPosition(selectedOption);
  };

  const navigate = () => {
    if (!selectedTranscript || !selectedPosition) return;
    const transcriptId = selectedTranscript.value;
    const position = selectedPosition.value;
    window.location.href = baseUrl + `site/${transcriptId}/${position}`;
  };

  const handlePositionKeyDown = (e) => {
    if (e.key === "Enter" && selectedTranscript && selectedPosition) {
      navigate();
    }
  };

  const canGo = selectedTranscript !== null && selectedPosition !== null;

  return (
    <div className="flex flex-row gap-2 items-center min-w-140">
      <AsyncSelect
        ref={transcriptRef}
        className="w-72"
        loadOptions={loadTranscriptOptions}
        onChange={onTranscriptChange}
        value={selectedTranscript}
        placeholder="Search for a transcript..."
        blurInputOnSelect={true}
        menuPortalTarget={document.body}
        isClearable
        styles={selectStyles}
      />
      <div
        className={
          "transition-[width,opacity] duration-300 " +
          (selectedTranscript ? "w-50 opacity-100" : "w-25 opacity-20 cursor-not-allowed")
        }
      >
        <Select
          ref={positionRef}
          className="text-nowrap"
          options={positionOptions}
          onChange={onPositionChange}
          onKeyDown={handlePositionKeyDown}
          value={selectedPosition}
          isDisabled={!selectedTranscript}
          isLoading={positionsLoading}
          placeholder={selectedTranscript ? "Select position..." : ""}
          blurInputOnSelect={true}
          menuPortalTarget={document.body}
          isClearable
          styles={selectStyles}
        />
      </div>
      <button
        onClick={navigate}
        disabled={!canGo}
        className={`px-4 py-2 rounded border font-medium text-sm transition-colors ${
          canGo
            ? "border-black bg-blue-500 hover:bg-blue-900 text-white cursor-pointer"
            : "border-gray-300 text-gray-400 cursor-not-allowed"
        }`}
      >
        →
      </button>
    </div>
  );
}

export default function SiteNavbar({ defaultSite }) {
  return (
    <section className="fixed top-0 right-0 left-0 z-10">
      <div className="flex flex-row gap-4 items-center h-20 px-4 bg-linear-to-b from-sky-200 via-sky-100 to-white">
        <a href="/">
          <img src={logo_img} className="h-14" />
        </a>
        <IsoformSelector defaultSite={defaultSite} />
        <div className="grow" />
        <div className="hover:underline">
          <a href="https://shimlab.github.io/mako" target="_blank">
            Docs ↗
          </a>
        </div>
        <div className="hover:underline">
          <a href="https://github.com/shimlab/mako" target="_blank">
            GitHub ↗
          </a>
        </div>
      </div>
    </section>
  );
}
