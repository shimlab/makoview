import { useState } from "react";
import TrackDisplay from "./components/trackdisplay";
import { useHashState } from "./utils/hashState";

import Selector from "./components/selector";
import logo_img from "./assets/makoview_logo.svg";

function App() {
  const [selectedId, setSelectedId] = useHashState({ id: null });
  const [selectValue, setSelectValue] = useState(null);

  return (
    <>
      <section className="fixed top-0 right-0 left-0 ">
        <div className="flex flex-row gap-4 items-center h-20 px-4 bg-gradient-to-b from-sky-200 via-sky-100 to-white">
          <img src={logo_img} className="h-14" />
          {/* <div className="rounded-full bg-violet-900 text-white text-lg px-4 py-2">makoview</div> */}
          <Selector
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            selectValue={selectValue}
            setSelectValue={setSelectValue}
          />
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

      <section>
        <div className="fixed top-20 right-0 left-0 bottom-0">
          <TrackDisplay selected={selectedId} />
        </div>
      </section>
    </>
  );
}

export default App;
