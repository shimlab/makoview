import { useRef } from "react";
import { useAtomValue } from "jotai";
import AsyncSelect from "react-select/async";
import logo_img from "../../assets/makoview_logo.svg";
import { dataAtom, isDemoAtom } from "../../store";

const baseUrl = "/";

window.addEventListener("pageshow", pageshowHandler);
function pageshowHandler(event) {
  const btn = document.querySelector("button");
  btn.focus();
  btn.blur();
}

export function Selector() {
  const gene_name = useAtomValue(dataAtom)?.metadata?.gene_name;
  const isDemo = useAtomValue(isDemoAtom);

  const selectRef = useRef(null);

  const loadOptions = async (inputValue) => {
    if (inputValue.length < 3) return [];
    const res = await fetch(baseUrl + `api/search?q=${inputValue}`);
    const data = await res.json();
    return data.map((item) => ({ value: item, label: item[0] }));
  };

  const onChange = (selectedOption) => {
    // setSelectedId({ id: selectedOption.value[2] });
    window.location.href = baseUrl + `gene/${selectedOption.value[2]}`;
    selectRef.current?.select.clearValue();
    document.querySelector("button").focus();
    // setTimeout(() => selectRef.current?.blur(), 50);
    // selectRef.current?.select.blur();
    // selectRef.current?.blur();
  };

  return (
    <div className={isDemo ? "cursor-not-allowed" : ""}>
      <AsyncSelect
        ref={selectRef}
        className="w-80"
        loadOptions={loadOptions}
        onChange={onChange}
        placeholder={gene_name}
        isDisabled={isDemo}
        blurInputOnSelect={true}
        menuPortalTarget={document.body}
        styles={{
          menuPortal: (base) => ({
            ...base,
            zIndex: 9999,
          }),
          input: (base, state) => ({
            ...base,
            // width: "auto !important",
          }),
          control: (base, state) => ({
            ...base,
            borderColor: "black",
            backgroundColor: state.isFocused ? "white" : "transparent",
            "&:hover": {
              borderColor: "black",
              backgroundColor: "white",
            },
          }),
          indicatorSeparator: (base) => ({
            ...base,
            backgroundColor: "black",
            "&:hover": {
              backgroundColor: "black",
            },
          }),
          dropdownIndicator: (base) => ({
            ...base,
            color: "#444",
            "&:hover": {
              color: "#444",
            },
          }),
          placeholder: (base, state) => ({
            ...base,
            color: state.isFocused ? "transparent" : "black",
          }),
        }}
      />
    </div>
  );
}

export default function Navbar() {
  const isDemo = useAtomValue(isDemoAtom);

  return (
    <section className="fixed top-0 right-0 left-0 z-10">
      <div className="flex flex-row gap-4 items-center h-20 px-4 bg-linear-to-b from-sky-200 via-sky-100 to-white">
        <img src={logo_img} className="h-14" />
        <Selector />
        {isDemo && (
          <div className="relative group">
            <div className="rounded-full bg-red-300 text-red-900 border-red-900 border-2 text-sm px-3 py-1 font-semibold cursor-default">
              Demo Mode
            </div>
            <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 rounded bg-gray-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              This is a demo version with only track rendering functionality.
              <br />
              Search and detailed views are disabled. makoview is run after the <br />
              output of the mako pipeline. Data for this demo run comes <br />
              from the LongBench project: doi:10.1101/2025.09.11.675724
            </span>
          </div>
        )}
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
