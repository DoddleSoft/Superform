import {
  Navbar,
  Hero,
  Stats,
  Features,
  HowItWorks,
  FormShowcase,
  Testimonials,
  Pricing,
  CTA,
  Footer,
} from "@/components/landing";

export default function Home() {
  return (
    <main className="min-h-screen bg-base-100">
      <Navbar />
      <Hero />
      <FormShowcase />
      {/* <Stats /> */}
      <Features />
      <HowItWorks />
      {/* <Testimonials /> */}
      {/* <Pricing /> */}
      <CTA />
      <Footer />
    </main>
  );
}
