import { useRef } from "react";
import AsyncSelect from "react-select/async";
import logo_img from "../assets/makoview_logo.svg";

const baseUrl = "/";

function Selector({ gene_name, isDemo }) {
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
    selectRef.current?.blur();
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

export default function Navbar({ gene_name, isDemo }) {
  return (
    <section className="fixed top-0 right-0 left-0 ">
      <div className="flex flex-row gap-4 items-center h-20 px-4 bg-linear-to-b from-sky-200 via-sky-100 to-white">
        <img src={logo_img} className="h-14" />
        <Selector gene_name={gene_name} isDemo={isDemo} />
        {isDemo && (
          <div className="rounded-full bg-red-300 text-red-900 border-red-900 border-2 text-sm px-3 py-1 font-semibold">
            Demo Mode
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
