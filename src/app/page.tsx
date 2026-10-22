import { Hero } from "@/components/sections/hero/Hero";
import { Molecula } from "@/components/sections/molecula/Molecula";
import { About } from "@/components/sections/about/About";
import { Portfolio } from "@/components/sections/portfolio/Portfolio";
import { SectionStub } from "@/components/sections/SectionStub";
import { navigation } from "@/content/site";

export default function Home() {
  return (
    <main>
      <Hero />
      <Molecula />
      <About />
      <Portfolio />
      {navigation
        .filter((item) => !["molecula", "about", "portfolio"].includes(item.id))
        .map((item) => (
          <SectionStub key={item.id} id={item.id} title={item.label} />
        ))}
      <SectionStub id="contact" title="Contact" />
    </main>
  );
}
