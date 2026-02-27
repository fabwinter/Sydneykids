import { useState } from "react";
import { Dices, Sparkles } from "lucide-react";
import { SurpriseWheel } from "./SurpriseWheel";

export function SurpriseButton() {
  const [showWheel, setShowWheel] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowWheel(true)}
        className="surprise-button w-full flex items-center justify-center gap-3"
      >
        <Dices className="w-6 h-6 animate-bounce-subtle" />
        <span className="text-lg">Surprise Me!</span>
        <Sparkles className="w-5 h-5" />
      </button>
      
      {showWheel && <SurpriseWheel onClose={() => setShowWheel(false)} />}
    </>
  );
}
