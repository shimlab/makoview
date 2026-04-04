import { useState, useEffect } from "react";
import TrackDisplay from "./components/trackdisplay";
import { useHashState } from "./utils/hashState";

import AsyncSelect from "react-select/async";

const baseUrl = import.meta.env.PROD ? "/" : "http://localhost:8001/";

function App() {
  const [selectedId, setSelectedId] = useHashState({ id: null });
  const [selectValue, setSelectValue] = useState(null);

  const loadOptions = async (inputValue) => {
    if (inputValue.length < 3) return [];
    const res = await fetch(baseUrl + `api/search?q=${inputValue}`);
    const data = await res.json();
    return data.map((item) => ({ value: item, label: item[0] }));
  };

  const onChange = (selectedOption) => {
    console.log("Selected:", selectedOption);
    setSelectedId({ id: selectedOption.value[2] });
  };

  // Initialize from hash on page load
  useEffect(() => {
    const initializeFromHash = async () => {
      if (selectedId.id) {
        // Prefill the select with the option
        setSelectValue({
          value: [selectedId.id, selectedId.id, selectedId.id],
          label: selectedId.id,
        });
      }
    };

    initializeFromHash();
  }, [selectedId.id]);

  return (
    <>
      <section className="fixed top-0 right-0 left-0 ">
        <div className="flex flex-row gap-4 items-center bg-gray-200 h-20 px-4">
          <div className="rounded-full bg-violet-900 text-white text-lg px-4 py-2">
            makoview
          </div>
          <div className="grow">
            <AsyncSelect
              className="w-full"
              placeholder="Search..."
              loadOptions={loadOptions}
              onChange={onChange}
              value={selectValue}
              menuPortalTarget={document.body}
              styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
            ></AsyncSelect>
          </div>
        </div>
      </section>

      <section>
        <div className="fixed top-20 right-0 left-0 bottom-0">
          <TrackDisplay selected={selectedId} />
        </div>
      </section>
    </>
  );
}

export default App;
