import { useState } from "react";
import { X, MapPin, Bookmark, Check, Shuffle, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useNavigate } from "react-router-dom";
import { useAllActivities } from "@/hooks/useActivities";

const categories = [
  { name: "Cafe", color: "#E68161" },
  { name: "Beach", color: "#5DB8D4" },
  { name: "Park", color: "#22C55E" },
  { name: "Restaurant", color: "#F59E0B" },
  { name: "Museum", color: "#8B5CF6" },
  { name: "Bakery", color: "#D97706" },
  { name: "Shopping", color: "#F472B6" },
  { name: "Library", color: "#7C3AED" },
];

const requirementOptions = [
  { id: "wifi", label: "WiFi" },
  { id: "parking", label: "Parking" },
  { id: "pet_friendly", label: "Pet Friendly" },
  { id: "wheelchair_accessible", label: "Accessible" },
  { id: "outdoor_seating", label: "Outdoor Seating" },
];

interface SurpriseWheelProps {
  onClose: () => void;
}

export function SurpriseWheel({ onClose }: SurpriseWheelProps) {
  const navigate = useNavigate();
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [radius, setRadius] = useState([5]);
  const [rotation, setRotation] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>([]);

  const { data: activities } = useAllActivities(500);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleRequirement = (req: string) => {
    setSelectedRequirements((prev) =>
      prev.includes(req) ? prev.filter((r) => r !== req) : [...prev, req]
    );
  };

  const handleSpin = () => {
    if (isSpinning || !activities?.length) return;

    setIsSpinning(true);
    setResult(null);

    const spins = 5 + Math.random() * 3;
    const randomOffset = Math.random() * 360;
    const finalRotation = spins * 360 + randomOffset;
    setRotation(finalRotation);

    setTimeout(() => {
      setIsSpinning(false);

      // Filter activities based on selections
      let pool = [...(activities || [])];

      if (selectedCategories.length > 0) {
        pool = pool.filter((a) => selectedCategories.includes(a.category));
      }

      for (const req of selectedRequirements) {
        pool = pool.filter((a) => (a as any)[req] === true);
      }

      if (pool.length === 0) {
        pool = [...(activities || [])];
      }

      const randomResult = pool[Math.floor(Math.random() * pool.length)];
      setResult(randomResult);
    }, 3000);
  };

  // Determine which categories to show on wheel
  const wheelCategories = selectedCategories.length > 0
    ? categories.filter((c) => selectedCategories.includes(c.name))
    : categories;

  const hasFilters = selectedCategories.length > 0 || selectedRequirements.length > 0;

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-xl font-bold">Feeling Lucky?</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-full transition-colors ${
              showFilters || hasFilters
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="px-4 py-4 border-b border-border space-y-4 bg-muted/30">
          <div>
            <h3 className="text-sm font-semibold mb-2">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => toggleCategory(cat.name)}
                  className={`filter-chip flex items-center gap-1.5 text-xs ${
                    selectedCategories.includes(cat.name) ? "active" : ""
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-2">Requirements</h3>
            <div className="flex flex-wrap gap-2">
              {requirementOptions.map((req) => (
                <button
                  key={req.id}
                  onClick={() => toggleRequirement(req.id)}
                  className={`filter-chip text-xs ${
                    selectedRequirements.includes(req.id) ? "active" : ""
                  }`}
                >
                  {req.label}
                </button>
              ))}
            </div>
          </div>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedCategories([]);
                setSelectedRequirements([]);
              }}
              className="text-xs text-muted-foreground"
            >
              Clear all filters
            </Button>
          )}
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        {!result ? (
          <>
            {/* Wheel */}
            <div className="relative w-64 h-64">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
                <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-primary" />
              </div>

              <svg
                viewBox="0 0 200 200"
                className="w-full h-full transition-transform duration-[3000ms] ease-out"
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                {wheelCategories.map((cat, i) => {
                  const angle = 360 / wheelCategories.length;
                  const startAngle = i * angle - 90;
                  const endAngle = startAngle + angle;

                  const x1 = 100 + 90 * Math.cos((startAngle * Math.PI) / 180);
                  const y1 = 100 + 90 * Math.sin((startAngle * Math.PI) / 180);
                  const x2 = 100 + 90 * Math.cos((endAngle * Math.PI) / 180);
                  const y2 = 100 + 90 * Math.sin((endAngle * Math.PI) / 180);

                  const largeArc = angle > 180 ? 1 : 0;

                  const midAngle = startAngle + angle / 2;
                  const textX = 100 + 55 * Math.cos((midAngle * Math.PI) / 180);
                  const textY = 100 + 55 * Math.sin((midAngle * Math.PI) / 180);

                  return (
                    <g key={cat.name}>
                      <path
                        d={`M 100 100 L ${x1} ${y1} A 90 90 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={cat.color}
                        stroke="white"
                        strokeWidth="2"
                      />
                      <text
                        x={textX}
                        y={textY}
                        fill="white"
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`}
                      >
                        {cat.name}
                      </text>
                    </g>
                  );
                })}
                <circle cx="100" cy="100" r="20" fill="white" />
                <circle cx="100" cy="100" r="16" fill="hsl(var(--primary))" />
              </svg>
            </div>

            {/* Radius */}
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Radius</span>
                <span className="font-semibold text-primary">{radius[0]} km</span>
              </div>
              <Slider value={radius} onValueChange={setRadius} min={1} max={20} step={1} />
            </div>

            {/* Mode label */}
            <p className="text-xs text-muted-foreground text-center">
              {hasFilters
                ? `Filtered: ${selectedCategories.length > 0 ? selectedCategories.join(", ") : "All categories"}${selectedRequirements.length > 0 ? ` • ${selectedRequirements.length} requirements` : ""}`
                : "No limits – totally random!"}
            </p>

            <Button
              onClick={handleSpin}
              disabled={isSpinning}
              className="surprise-button text-lg px-12"
              size="lg"
            >
              {isSpinning ? "Spinning..." : "SURPRISE ME!"}
            </Button>
          </>
        ) : (
          <div className="w-full max-w-sm animate-fade-in">
            <div className="activity-card overflow-hidden">
              <div className="relative aspect-[16/10]">
                <img
                  src={result.hero_image_url || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=500&fit=crop"}
                  alt={result.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="status-badge open mb-2">{result.category}</span>
                  <h3 className="text-xl font-bold text-white">{result.name}</h3>
                  <div className="flex items-center gap-3 mt-1 text-white/90 text-sm">
                    <span>⭐ {result.rating?.toFixed(1) || "N/A"}</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {result.address?.split(",")[0] || "Sydney"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setResult(null);
                    setRotation(0);
                  }}
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  Again
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90"
                  onClick={() => {
                    onClose();
                    navigate(`/activity/${result.id}`);
                  }}
                >
                  View Details
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
