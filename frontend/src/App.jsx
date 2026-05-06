import { useState } from "react";
import TrackDisplay from "./components/trackdisplay";
import { useHashState } from "./utils/hashState";

import Navbar from "./components/navbar";

function App() {
  const [selectedId, setSelectedId] = useHashState({ id: null });
  const [selectValue, setSelectValue] = useState(null);

  const data = window.__DATA__;
  const isDemo = window.__DEMO__;

  return (
    <>
      <Navbar gene_name={data.metadata.gene_name} isDemo={isDemo} />

      <section>
        <div className="fixed top-20 right-0 left-0 bottom-0">
          <TrackDisplay data={data} />
        </div>
      </section>
    </>
  );
}

export default App;
