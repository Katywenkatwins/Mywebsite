import { Hero } from "@/components/sections/hero/Hero";
import { Molecula } from "@/components/sections/molecula/Molecula";
import { About } from "@/components/sections/about/About";
import { SectionStub } from "@/components/sections/SectionStub";
import { navigation } from "@/content/site";

export default function Home() {
  return (
    <main>
      <Hero />
      <Molecula />
      <About />
      {navigation
        .filter((item) => !["molecula", "about"].includes(item.id))
        .map((item) => (
          <SectionStub key={item.id} id={item.id} title={item.label} />
        ))}
      <SectionStub id="contact" title="Contact" />
    </main>
  );
}
