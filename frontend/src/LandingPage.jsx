import logo_img from "./assets/makoview_logo.svg";
import { Selector } from "./components/gene/navbar";
import { IsoformSelector } from "./components/site/navbar";

function SectionHeader({ children }) {
  return <h2 className="text-2xl font-medium mt-5">{children}</h2>;
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-sky-100 to-white">
      <div className="min-h-screen flex flex-col items-start justify-center gap-4 mx-auto w-fit px-8">
        <img src={logo_img} className="h-24" />
        <SectionHeader>Whole gene visualisation</SectionHeader>
        <div className="w-96">
          <Selector gene_name="Search for a gene..." isDemo={false} />
        </div>
        <SectionHeader>Isoform site visualisation</SectionHeader>
        <IsoformSelector />
      </div>
    </div>
  );
}
