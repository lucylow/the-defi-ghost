import GhostNav from "@/components/GhostNav";
import HeroSection from "@/components/HeroSection";
import ProblemSolution from "@/components/ProblemSolution";
import AgentTeam from "@/components/AgentTeam";
import InteractiveDemo from "@/components/InteractiveDemo";
import HowItWorks from "@/components/HowItWorks";
import PoweredBy from "@/components/PoweredBy";
import GhostFooter from "@/components/GhostFooter";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <GhostNav />
      <HeroSection />
      <ProblemSolution />
      <AgentTeam />
      <InteractiveDemo />
      <HowItWorks />
      <PoweredBy />
      <GhostFooter />
    </div>
  );
};

export default Index;
