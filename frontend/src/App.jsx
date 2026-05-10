import { useEffect } from "react";
import { useAtomValue } from "jotai";
import TrackDisplay from "./components/gene/trackdisplay";
import Navbar from "./components/gene/navbar";
import { dataAtom, isDemoAtom } from "./store";

function App() {
  const data = useAtomValue(dataAtom);
  const isDemo = useAtomValue(isDemoAtom);

  useEffect(() => {
    if (isDemo) {
      document.title = `makoview: demo`;
    } else if (data?.metadata?.gene_name) {
      document.title = `makoview: ${data.metadata.gene_name}`;
    }
  }, [data, isDemo]);

  return (
    <>
      <Navbar />

      <section>
        <div className="fixed top-20 right-0 left-0 bottom-0">
          <TrackDisplay />
        </div>
      </section>
    </>
  );
}

export default App;
