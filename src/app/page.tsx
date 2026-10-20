import { Banner, Nav, Footer } from "@/components/chrome";
import Hero from "@/components/Hero";
import StormExplorer from "@/components/StormExplorer";
import StormChart from "@/components/StormChart";
import Developers from "@/components/Developers";
import { Methodology, Downloads } from "@/components/Sections";
import { getData } from "@/lib/storms";

export default function Home() {
  const data = getData();
  return (
    <>
      <Banner />
      <Nav />
      <main className="flex-1">
        <Hero summary={data.summary} />
        <StormExplorer storms={data.storms} />
        <StormChart storms={data.storms} />
        <Developers />
        <Methodology />
        <Downloads />
      </main>
      <Footer />
    </>
  );
}
