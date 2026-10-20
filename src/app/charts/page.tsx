import type { Metadata } from "next";
import { Banner, Nav, Footer } from "@/components/chrome";
import ChartsPage from "@/components/ChartsPage";
import { getData } from "@/lib/storms";

export const metadata: Metadata = {
  title: "Charts: Toronto parking revenue lost to snowstorms, 2023-2025",
  description:
    "Four charts from the Toronto storm parking loss dataset: revenue lost in each storm with its estimate band, snowfall against revenue lost, revenue lost by winter, and transactions lost in each storm.",
};

export default function Charts() {
  const data = getData();
  return (
    <>
      <Banner />
      <Nav />
      <ChartsPage storms={data.storms} />
      <Footer />
    </>
  );
}
