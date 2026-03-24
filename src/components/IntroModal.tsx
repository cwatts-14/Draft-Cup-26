import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trophy, 
  Target, 
  Navigation, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2,
  Shield,
  Zap,
  BarChart3,
  LineChart,
  GitBranch,
  Users
} from "lucide-react";

interface IntroModalProps {
  onClose: () => void;
}

const STEPS = [
  {
    title: "Welcome to WC2026 Fantasy",
    description: "The ultimate World Cup drafting experience. Compete with friends by drafting national teams and scoring points based on their real-world performance.",
    icon: <Trophy className="w-12 h-12 text-primary" />,
    color: "bg-primary/10"
  },
  {
    title: "The Scoring System",
    description: "Points are awarded for every match result: 3 pts for a Win, 1 pt for a Draw. Bonus points for advancing from groups (+1) and winning the Championship (+3)!",
    icon: <Target className="w-12 h-12 text-green-500" />,
    color: "bg-green-500/10",
    details: [
      { label: "Match Win", value: "+3 pts" },
      { label: "Match Draw", value: "+1 pt" },
      { label: "Group Advance", value: "+1 pt" },
      { label: "World Champion", value: "+3 pts" }
    ]
  },
  {
    title: "How to Navigate",
    description: "Use the bottom bar to switch between views. 'Standings' shows your league rank, 'Bracket' tracks the tournament, and 'Draft' is where the action happens.",
    icon: <Navigation className="w-12 h-12 text-blue-500" />,
    color: "bg-blue-500/10",
    navItems: [
      { icon: <BarChart3 className="w-4 h-4" />, label: "Standings", desc: "League rankings" },
      { icon: <LineChart className="w-4 h-4" />, label: "Draft", desc: "Live team selection" },
      { icon: <GitBranch className="w-4 h-4" />, label: "Bracket", desc: "Tournament progress" },
      { icon: <Users className="w-4 h-4" />, label: "My Teams", desc: "Your drafted squads" }
    ]
  }
];

export function IntroModal({ onClose }: IntroModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const next = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        key="intro-modal-content"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-surface-high border border-outline/20 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
      >
        <div className="p-8 flex flex-col items-center text-center">
          <motion.div 
            key={currentStep}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-24 h-24 rounded-full ${step.color} flex items-center justify-center mb-6`}
          >
            {step.icon}
          </motion.div>

          <h2 className="text-2xl font-headline font-bold mb-4 tracking-tight">
            {step.title}
          </h2>
          
          <p className="text-muted leading-relaxed mb-8">
            {step.description}
          </p>

          {step.details && (
            <div className="grid grid-cols-2 gap-3 w-full mb-8">
              {step.details.map((d, i) => (
                <div key={i} className="bg-surface-highest p-3 rounded-xl border border-outline/10 flex justify-between items-center">
                  <span className="text-xs font-medium">{d.label}</span>
                  <span className="text-xs font-bold text-primary">{d.value}</span>
                </div>
              ))}
            </div>
          )}

          {step.navItems && (
            <div className="space-y-2 w-full mb-8">
              {step.navItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-surface-highest rounded-xl border border-outline/10">
                  <div className="w-8 h-8 rounded-lg bg-surface-high flex items-center justify-center text-primary">
                    {item.icon}
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className="text-[10px] text-muted">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between w-full mt-auto pt-4 border-t border-outline/10">
            <div className="flex gap-1">
              {STEPS.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-6 bg-primary' : 'w-1.5 bg-outline/20'}`}
                />
              ))}
            </div>

            <div className="flex gap-3">
              {currentStep > 0 && (
                <button 
                  onClick={prev}
                  className="p-3 rounded-xl hover:bg-surface-highest transition-colors text-muted"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <button 
                onClick={next}
                className="bg-primary text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                {currentStep === STEPS.length - 1 ? "Get Started" : "Next"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
