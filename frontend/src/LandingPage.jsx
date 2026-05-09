import logo_img from "./assets/makoview_logo.svg";
import { Selector } from "./components/gene/navbar";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-sky-100 to-white">
      <div className="min-h-screen flex flex-col items-start justify-center w-96 gap-4 mx-auto">
        <img src={logo_img} className="h-24" />
        <div className="w-96">
          <Selector gene_name="Search for a gene..." isDemo={false} />
        </div>
      </div>
    </div>
  );
}
