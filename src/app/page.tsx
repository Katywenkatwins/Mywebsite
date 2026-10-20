import { SectionStub } from "@/components/sections/SectionStub";
import { navigation } from "@/content/site";

export default function Home() {
  return (
    <main>
      <SectionStub id="top" title="Hero" />
      {navigation.map((item) => (
        <SectionStub key={item.id} id={item.id} title={item.label} />
      ))}
    </main>
  );
}
