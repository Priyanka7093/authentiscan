import Navbar from "../components/Navbar";
import Hero from "../components/Hero";

export default function Home() {
  return (
    <div id="home" className="min-h-screen bg-ink">
      <Navbar />
      <Hero />
    </div>
  );
}