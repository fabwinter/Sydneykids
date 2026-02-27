import { X, Check, Sparkles, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PremiumModalProps {
  onClose: () => void;
}

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    current: true,
    features: [
      { text: "3 check-ins/day", included: true },
      { text: "5 chat messages/day", included: true },
      { text: "3 saved playlists", included: true },
      { text: "Public profile", included: true },
      { text: "Advanced filters", included: false },
      { text: "Offline maps", included: false },
      { text: "Ads shown", included: true, negative: true },
    ],
  },
  {
    name: "Premium",
    price: "$4.99",
    period: "/month",
    annual: "$39.99/year (save 2 months!)",
    featured: true,
    badge: "MOST POPULAR",
    features: [
      { text: "Unlimited check-ins", included: true },
      { text: "Unlimited chat", included: true },
      { text: "Unlimited playlists", included: true },
      { text: "Offline map downloads", included: true },
      { text: "Advanced filters", included: true },
      { text: "No ads", included: true },
      { text: "Priority support", included: true },
    ],
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "/month",
    badge: "FOR TEAMS",
    features: [
      { text: "Everything in Premium", included: true },
      { text: "Team sharing", included: true },
      { text: "Shared playlists", included: true },
      { text: "API access", included: true },
      { text: "Business analytics", included: true },
      { text: "Dedicated support", included: true },
    ],
  },
];

export function PremiumModal({ onClose }: PremiumModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-card rounded-2xl slide-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-warning" />
              Unlock Unlimited Discovery
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Upgrade to SYDMAP Premium
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Plans */}
        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`premium-card ${plan.featured ? "featured" : "border-border"}`}
              >
                {plan.badge && (
                  <span
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold ${
                      plan.featured
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {plan.badge}
                  </span>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  {plan.annual && (
                    <p className="text-xs text-primary mt-1">{plan.annual}</p>
                  )}
                </div>
                
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li
                      key={i}
                      className={`flex items-center gap-2 text-sm ${
                        !feature.included || feature.negative
                          ? "text-muted-foreground"
                          : ""
                      }`}
                    >
                      {feature.included ? (
                        <Check
                          className={`w-4 h-4 shrink-0 ${
                            feature.negative ? "text-muted-foreground" : "text-success"
                          }`}
                        />
                      ) : (
                        <X className="w-4 h-4 shrink-0 text-muted-foreground/50" />
                      )}
                      <span className={feature.negative ? "line-through" : ""}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  className={`w-full ${
                    plan.featured
                      ? "bg-primary hover:bg-primary/90"
                      : plan.current
                      ? ""
                      : "bg-secondary hover:bg-secondary/90"
                  }`}
                  variant={plan.current ? "outline" : "default"}
                  disabled={plan.current}
                >
                  {plan.current
                    ? "Current Plan"
                    : plan.featured
                    ? "Upgrade to Premium"
                    : "Upgrade to Pro"}
                </Button>
              </div>
            ))}
          </div>
          
          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 pt-6 border-t border-border text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-success" />
              Secure payment with Stripe
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-warning" />
              Cancel anytime
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              14-day free trial
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
