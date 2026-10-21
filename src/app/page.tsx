import { Hero } from "@/components/sections/hero/Hero";
import { Molecula } from "@/components/sections/molecula/Molecula";
import { SectionStub } from "@/components/sections/SectionStub";
import { navigation } from "@/content/site";

export default function Home() {
  return (
    <main>
      <Hero />
      <Molecula />
      {navigation
        .filter((item) => item.id !== "molecula")
        .map((item) => (
          <SectionStub key={item.id} id={item.id} title={item.label} />
        ))}
      <SectionStub id="contact" title="Contact" />
    </main>
  );
}
