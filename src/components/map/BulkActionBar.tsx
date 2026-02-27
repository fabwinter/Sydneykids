import { Trash2, X, Loader2, CheckSquare, Database, CloudOff, ChevronDown, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState } from "react";

const CATEGORIES = [
  "Cafe", "Beach", "Park", "Restaurant", "Bar", "Shopping", "Gym", "Museum",
  "Bakery", "Playground", "Swimming Pool", "tourist attraction", "Library",
  "Sports and Recreation", "Daycare", "Education", "Hotel", "Walks",
];

const REGIONS = [
  "South Sydney", "Sydney Inner West", "Sydney Inner East",
  "Upper North Shore", "City centre", "Western Sydney",
  "Online", "Lower North Shore", "Sydney West", "Sydney East",
];

const AMENITIES = [
  { key: "wifi", label: "WiFi" },
  { key: "parking", label: "Parking" },
  { key: "outdoor_seating", label: "Outdoor" },
  { key: "pet_friendly", label: "Pet Friendly" },
  { key: "wheelchair_accessible", label: "Accessible" },
];

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  onDelete: () => void;
  onClear: () => void;
  onSelectAll?: () => void;
  onAddToDb?: () => void;
  onRemoveFromDb?: () => void;
  onBulkUpdate?: (updates: Record<string, any>) => void;
  isDeleting: boolean;
  isImporting?: boolean;
  isUpdating?: boolean;
  hasDbSelected?: boolean;
  hasFsSelected?: boolean;
}

export function BulkActionBar({
  selectedCount, totalCount, onDelete, onClear, onSelectAll,
  onAddToDb, onRemoveFromDb, onBulkUpdate, isDeleting, isImporting, isUpdating,
  hasDbSelected, hasFsSelected,
}: BulkActionBarProps) {
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [amenityToggles, setAmenityToggles] = useState<Record<string, boolean | null>>({});

  const [selectedRegion, setSelectedRegion] = useState("");

  if (selectedCount === 0) return null;

  const hasEdits = selectedCategory !== "" || selectedRegion !== "" || Object.values(amenityToggles).some(v => v !== null && v !== undefined);

  const handleApply = () => {
    if (!onBulkUpdate || !hasEdits) return;
    const updates: Record<string, any> = {};
    if (selectedCategory) updates.category = selectedCategory;
    if (selectedRegion) updates.region = selectedRegion;
    for (const [key, val] of Object.entries(amenityToggles)) {
      if (val !== null && val !== undefined) updates[key] = val;
    }
    onBulkUpdate(updates);
    setSelectedCategory("");
    setSelectedRegion("");
    setAmenityToggles({});
    setShowEditPanel(false);
  };

  const toggleAmenity = (key: string) => {
    setAmenityToggles(prev => {
      const current = prev[key];
      // cycle: undefined -> true -> false -> undefined
      if (current === undefined || current === null) return { ...prev, [key]: true };
      if (current === true) return { ...prev, [key]: false };
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2"
    >
      {/* Edit panel - expandable */}
      {showEditPanel && hasDbSelected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="bg-card border border-border rounded-xl shadow-elevated p-3 w-[340px] max-w-[90vw] space-y-3"
        >
          {/* Category dropdown */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full mt-1 text-xs rounded-lg border border-border bg-background px-2 py-1.5 text-foreground"
            >
              <option value="">— No change —</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Region dropdown */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Region</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full mt-1 text-xs rounded-lg border border-border bg-background px-2 py-1.5 text-foreground"
            >
              <option value="">— No change —</option>
              {REGIONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Amenity chips */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Amenities</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {AMENITIES.map(({ key, label }) => {
                const val = amenityToggles[key];
                const isOn = val === true;
                const isOff = val === false;
                return (
                  <button
                    key={key}
                    onClick={() => toggleAmenity(key)}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
                      isOn
                        ? "bg-primary text-primary-foreground border-primary"
                        : isOff
                        ? "bg-destructive/10 text-destructive border-destructive/30 line-through"
                        : "bg-muted text-muted-foreground border-border hover:bg-accent/10"
                    }`}
                  >
                    {isOn ? "✓ " : isOff ? "✗ " : ""}{label}
                  </button>
                );
              })}
            </div>
            <p className="text-[9px] text-muted-foreground mt-1">Tap: set ON → set OFF → no change</p>
          </div>

          {/* Apply button */}
          <Button
            size="sm"
            className="w-full gap-1.5"
            disabled={!hasEdits || isUpdating}
            onClick={handleApply}
          >
            {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Apply to {selectedCount} selected
          </Button>
        </motion.div>
      )}

      {/* Main action bar */}
      <div className="bg-destructive text-destructive-foreground rounded-full px-5 py-3 shadow-elevated flex items-center gap-2 flex-wrap justify-center">
        <span className="text-sm font-bold">{selectedCount} selected</span>
        {onSelectAll && (
          <Button size="sm" variant="secondary" className="rounded-full gap-1 text-xs" onClick={onSelectAll}>
            <CheckSquare className="w-3 h-3" />
            {selectedCount === totalCount ? "Deselect All" : "Select All"}
          </Button>
        )}
        {hasDbSelected && onBulkUpdate && (
          <Button
            size="sm"
            variant="secondary"
            className={`rounded-full gap-1 text-xs ${showEditPanel ? "ring-2 ring-primary" : ""}`}
            onClick={() => setShowEditPanel(!showEditPanel)}
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${showEditPanel ? "rotate-180" : ""}`} />
            Edit
          </Button>
        )}
        {hasFsSelected && onAddToDb && (
          <Button size="sm" variant="secondary" className="rounded-full gap-1 text-xs" onClick={onAddToDb} disabled={isImporting}>
            {isImporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
            Add to DB
          </Button>
        )}
        {hasDbSelected && onRemoveFromDb && (
          <Button size="sm" variant="secondary" className="rounded-full gap-1 text-xs" onClick={onRemoveFromDb} disabled={isDeleting}>
            {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            Remove from DB
          </Button>
        )}
        <button onClick={onClear} className="p-1 rounded-full hover:bg-white/20">
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
