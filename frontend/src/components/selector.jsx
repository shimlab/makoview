import { useEffect, useRef } from "react";
import AsyncSelect from "react-select/async";

const baseUrl = import.meta.env.PROD ? "/" : "http://localhost:8001/";

export default function Selector({ selectedId, setSelectedId, selectValue, setSelectValue }) {
  const selectRef = useRef(null);

  const loadOptions = async (inputValue) => {
    if (inputValue.length < 3) return [];
    const res = await fetch(baseUrl + `api/search?q=${inputValue}`);
    const data = await res.json();
    return data.map((item) => ({ value: item, label: item[0] }));
  };

  const onChange = (selectedOption) => {
    setSelectedId({ id: selectedOption.value[2] });
    selectRef.current?.blur();
  };

  useEffect(() => {
    if (selectedId.id) {
      setSelectValue({
        value: [selectedId.id, selectedId.id, selectedId.id],
        label: selectedId.id,
      });
    }
  }, [selectedId.id]);

  return (
    <div className="grow">
      <AsyncSelect
        ref={selectRef}
        className="w-80"
        placeholder="Search..."
        loadOptions={loadOptions}
        onChange={onChange}
        value={selectValue}
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
        }}
      />
    </div>
  );
}
