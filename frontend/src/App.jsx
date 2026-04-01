import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "./assets/vite.svg";
import heroImg from "./assets/hero.png";
import "./App.css";

import Select from "react-select";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <section>
        <div class="flex flex-row gap-4 items-center bg-gray-200 p-4">
          <div class="rounded-full bg-violet-900 text-white text-lg px-4 py-2">
            makoview
          </div>
          <div class="grow">
            <Select className="w-full" placeholder="Search..."></Select>
          </div>
        </div>
      </section>
    </>
  );
}

export default App;
