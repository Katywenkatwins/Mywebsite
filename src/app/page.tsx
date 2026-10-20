import { Hero } from "@/components/sections/hero/Hero";
import { SectionStub } from "@/components/sections/SectionStub";
import { navigation } from "@/content/site";

export default function Home() {
  return (
    <main>
      <Hero />
      {navigation.map((item) => (
        <SectionStub key={item.id} id={item.id} title={item.label} />
      ))}
    </main>
  );
}
