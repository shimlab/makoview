import { useAtom, useAtomValue } from "jotai";
import { isDemoAtom, showTutorialAtom } from "../../store";

import TutorialLegendOverlay from "../../assets/tutorial_legend.svg?react";
import TutorialAxisOverlay from "../../assets/tutorial_axis.svg?react";

function TutorialOverlay() {
  const [showTutorial, setShowTutorial] = useAtom(showTutorialAtom);
  const isDemo = useAtomValue(isDemoAtom);

  return (
    <div className={`absolute inset-0 pointer-events-none ${showTutorial ? "" : "hidden"}`}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-1100 bg-white px-5 pt-4 pb-3 rounded-md w-[500px] border-2 border-black pointer-events-auto">
        <h1 className="text-lg font-semibold">Welcome to Makoview!</h1>
        <p className="mt-2">
          Makoview is an interactive tool for visualising the RNA modifications called by the <code>mako</code>{" "}
          pipeline.{" "}
          <a href="https://shimlab.github.io/mako" target="_blank" className="text-blue-600 underline">
            Docs ↗
          </a>
        </p>
        {isDemo && (
          <p className="mt-2">
            You're currently running in <span className="text-red-600">demo mode</span>, using sample data, so search is
            not available.
          </p>
        )}
        <button
          className="mt-2 px-4 py-1 mr-2 border-2 border-blue-900 bg-white text-blue-900 rounded-full cursor-pointer hover:bg-blue-900 hover:text-white duration-100 hover-lift text-sm"
          onClick={() => setShowTutorial(false)}
        >
          Dismiss tutorial
        </button>
      </div>

      <TutorialLegendOverlay className="absolute bottom-[-65px] right-[25px] z-1100" />
      <TutorialAxisOverlay className="absolute top-[-45px] left-[15px] z-1100" />

      <div className="bg-[rgba(0,0,0,0.5)] z-999 absolute top-0 left-0 bottom-[-40px] right-[-20px] ml-2 mt-2 rounded-lg" />
    </div>
  );
}

export default TutorialOverlay;
