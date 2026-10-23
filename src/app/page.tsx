import { Hero } from "@/components/sections/hero/Hero";
import { Molecula } from "@/components/sections/molecula/Molecula";
import { About } from "@/components/sections/about/About";
import { Portfolio } from "@/components/sections/portfolio/Portfolio";
import { Services } from "@/components/sections/services/Services";
import { Contact } from "@/components/sections/contact/Contact";

// Відгуки (testimonials) поки сховані — content/site.ts → sections, hidden: true
export default function Home() {
  return (
    <main>
      <Hero />
      <Molecula />
      <About />
      <Portfolio />
      <Services />
      <Contact />
    </main>
  );
}
