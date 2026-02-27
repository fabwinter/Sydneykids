import { useState, useRef, useEffect, useCallback } from "react";
import { Shield, Trash2, ImagePlus, Pencil, Save, X, Loader2, Link as LinkIcon, ClipboardPaste, Images, Maximize, Minimize, Move } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { MAPBOX_TOKEN } from "@/config/mapbox";
import type { Tables } from "@/integrations/supabase/types";

const CATEGORIES = [
  "Cafe", "Beach", "Park", "Restaurant", "Bar", "Shopping", "Gym", "Museum",
  "Bakery", "Playground", "Swimming Pool", "tourist attraction", "Library",
  "Sports and Recreation", "Daycare", "Education", "Hotel", "Walks",
  "Kids Event", "Parent Event", "Family Event",
];

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=1&country=au`
    );
    const data = await res.json();
    if (data.features?.length > 0) {
      const [lng, lat] = data.features[0].center;
      return { lat, lng };
    }
  } catch {}
  return null;
}

type Activity = Tables<"activities">;

interface AdminPanelProps {
  activity: Activity;
}

export function AdminPanel({ activity }: AdminPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [edits, setEdits] = useState({
    name: activity.name,
    description: activity.description || "",
    category: activity.category,
    address: activity.address || "",
    phone: activity.phone || "",
    website: activity.website || "",
    hours_open: activity.hours_open || "",
    hours_close: activity.hours_close || "",
    wifi: activity.wifi,
    parking: activity.parking,
    wheelchair_accessible: activity.wheelchair_accessible,
    outdoor_seating: activity.outdoor_seating,
    pet_friendly: activity.pet_friendly,
    family_friendly: (activity as any).family_friendly ?? false,
    high_chairs: (activity as any).high_chairs ?? false,
    change_rooms: (activity as any).change_rooms ?? false,
    coffee: (activity as any).coffee ?? false,
    power_outlets: (activity as any).power_outlets ?? false,
    showers: (activity as any).showers ?? false,
    bike_parking: (activity as any).bike_parking ?? false,
    shade: (activity as any).shade ?? false,
    is_event: activity.is_event,
    show_in_whats_on: activity.show_in_whats_on,
    event_dates: activity.event_dates || "",
    event_cost: activity.event_cost || "",
    ticket_url: activity.ticket_url || "",
    organizer_name: activity.organizer_name || "",
    organizer_phone: (activity as any).organizer_phone || "",
    organizer_website: activity.organizer_website || "",
    organizer_facebook: activity.organizer_facebook || "",
    organizer_instagram: activity.organizer_instagram || "",
    source_url: activity.source_url || "",
  });

  // Gallery images from photos table
  const [galleryPhotos, setGalleryPhotos] = useState<{ id: string; photo_url: string }[]>([]);

  const fetchGallery = useCallback(async () => {
    const { data } = await supabase
      .from("photos")
      .select("id, photo_url")
      .eq("activity_id", activity.id)
      .order("uploaded_at", { ascending: true });
    setGalleryPhotos(data || []);
  }, [activity.id]);

  useEffect(() => {
    if (isOpen) fetchGallery();
  }, [isOpen, fetchGallery]);

  // Handle paste from clipboard
  useEffect(() => {
    if (!isOpen) return;
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) await uploadImageFile(file);
          return;
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen, activity.id]);

  const uploadImageFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10MB)");
      return;
    }
    setIsUploading(true);
    try {
      const ext = file.name?.split(".").pop() || "jpg";
      const path = `admin/${activity.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("activity-photos")
        .upload(path, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("activity-photos")
        .getPublicUrl(path);

      await addPhotoToGallery(urlData.publicUrl);
      toast.success("Image added to gallery");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const addPhotoToGallery = async (url: string) => {
    // If no hero image, set as hero first
    if (!activity.hero_image_url) {
      await supabase.rpc("admin_update_activity", {
        p_activity_id: activity.id,
        p_updates: { hero_image_url: url } as any,
      });
    }
    // Also add to photos table for carousel
    const { data: profile } = await supabase.rpc("get_profile_id_from_auth");
    await supabase.from("photos").insert({
      activity_id: activity.id,
      photo_url: url,
      user_id: profile || undefined,
    });
    queryClient.invalidateQueries({ queryKey: ["activity", activity.id] });
    queryClient.invalidateQueries({ queryKey: ["activity-photos", activity.id] });
    fetchGallery();
  };

  const handleSetAsHero = async (url: string) => {
    try {
      await supabase.rpc("admin_update_activity", {
        p_activity_id: activity.id,
        p_updates: { hero_image_url: url } as any,
      });
      queryClient.invalidateQueries({ queryKey: ["activity", activity.id] });
      toast.success("Hero image updated");
    } catch {
      toast.error("Failed to set hero image");
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    const { error } = await supabase.from("photos").delete().eq("id", photoId);
    if (error) {
      toast.error("Failed to delete photo");
      return;
    }
    fetchGallery();
    queryClient.invalidateQueries({ queryKey: ["activity-photos", activity.id] });
    toast.success("Photo removed");
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates: any = { ...edits };
      // Geocode if address changed
      if (edits.address && edits.address !== activity.address) {
        const coords = await geocodeAddress(edits.address);
        if (coords) {
          updates.latitude = coords.lat;
          updates.longitude = coords.lng;
          toast.info("📍 Map pin updated from address");
        } else {
          toast.warning("Could not geocode address — map pin unchanged");
        }
      }
      const { error } = await supabase.rpc("admin_update_activity", {
        p_activity_id: activity.id,
        p_updates: updates,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["activity", activity.id] });
      toast.success("Activity updated");
      setIsEditing(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Permanently delete "${activity.name}"? This cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.rpc("admin_delete_activity", {
        p_activity_id: activity.id,
      });
      if (error) throw error;
      toast.success("Activity deleted");
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      navigate(-1);
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImageUrl = async () => {
    if (!imageUrl.trim()) return;
    await addPhotoToGallery(imageUrl.trim());
    setImageUrl("");
    setShowImageInput(false);
    toast.success("Image added");
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-50 p-2.5 rounded-full bg-destructive text-destructive-foreground shadow-lg hover:bg-destructive/90 transition-colors"
        title="God Mode"
      >
        <Shield className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed top-0 right-0 z-50 w-full max-w-sm h-full bg-card border-l border-border shadow-2xl overflow-y-auto">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadImageFile(file);
        }}
      />

      {/* Header */}
      <div className="sticky top-0 bg-destructive text-destructive-foreground p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          <span className="font-bold text-sm">GOD MODE</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="p-1 rounded hover:bg-white/20">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Image Gallery */}
        <section className="space-y-2">
          <h3 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
            <Images className="w-3 h-3" /> Image Gallery
          </h3>

          {/* Current hero */}
          {activity.hero_image_url && (
            <div className="relative group">
              <img src={activity.hero_image_url} alt="Hero" className="w-full h-32 rounded-lg object-cover" />
              <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded">HERO</span>
              <div className="absolute bottom-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    // Toggle object-position to help reframe
                    const img = document.querySelector('[data-hero-admin]') as HTMLImageElement;
                    if (img) {
                      const positions = ['center', 'top', 'bottom', 'left', 'right'];
                      const current = img.style.objectPosition || 'center';
                      const idx = positions.indexOf(current);
                      const next = positions[(idx + 1) % positions.length];
                      img.style.objectPosition = next;
                      toast.info(`Position: ${next}`);
                    }
                  }}
                  className="p-1 bg-black/60 rounded text-white text-[9px] font-bold"
                  title="Adjust fit position"
                >
                  <Maximize className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Gallery thumbnails */}
          {galleryPhotos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {galleryPhotos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.photo_url}
                    alt=""
                    className="w-full h-20 rounded-lg object-cover cursor-pointer"
                    onClick={() => {
                      // Toggle between cover and contain on click
                      const img = document.querySelector(`[data-photo-id="${photo.id}"]`) as HTMLImageElement;
                      if (img) {
                        const isCover = img.style.objectFit !== 'contain';
                        img.style.objectFit = isCover ? 'contain' : 'cover';
                        img.style.backgroundColor = isCover ? 'hsl(var(--muted))' : '';
                      }
                    }}
                    data-photo-id={photo.id}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSetAsHero(photo.photo_url); }}
                      className="p-1 bg-white/90 rounded text-[9px] font-bold text-foreground"
                      title="Set as hero"
                    >
                      Hero
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id); }}
                      className="p-1 bg-destructive/90 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3 text-white" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add image buttons */}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              {isUploading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <ImagePlus className="w-3 h-3 mr-1" />} Upload
            </Button>
            <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => setShowImageInput(!showImageInput)}>
              <LinkIcon className="w-3 h-3 mr-1" /> URL
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <ClipboardPaste className="w-3 h-3" /> Paste an image from clipboard (Ctrl/Cmd+V)
          </p>
          {showImageInput && (
            <div className="flex gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 bg-muted rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button size="sm" onClick={handleImageUrl} disabled={!imageUrl.trim()}>
                <Save className="w-3 h-3" />
              </Button>
            </div>
          )}
        </section>

        {/* Edit Fields */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase text-muted-foreground">Details</h3>
            {!isEditing ? (
              <Button size="sm" variant="ghost" className="text-xs gap-1" onClick={() => setIsEditing(true)}>
                <Pencil className="w-3 h-3" /> Edit
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" className="text-xs" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button size="sm" className="text-xs gap-1" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                </Button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <Field label="Name" value={edits.name} onChange={(v) => setEdits({ ...edits, name: v })} />
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                <Select value={edits.category} onValueChange={(v) => setEdits({ ...edits, category: v })}>
                  <SelectTrigger className="w-full bg-muted text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-[9999]">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Field label="Description" value={edits.description} onChange={(v) => setEdits({ ...edits, description: v })} multiline />
              <Field label="Address" value={edits.address} onChange={(v) => setEdits({ ...edits, address: v })} />
              <Field label="Phone" value={edits.phone} onChange={(v) => setEdits({ ...edits, phone: v })} />
              <Field label="Website" value={edits.website} onChange={(v) => setEdits({ ...edits, website: v })} />
              <Field label="Opens" value={edits.hours_open} onChange={(v) => setEdits({ ...edits, hours_open: v })} />
              <Field label="Closes" value={edits.hours_close} onChange={(v) => setEdits({ ...edits, hours_close: v })} />

              <h4 className="text-xs font-bold uppercase text-muted-foreground pt-2">Event Details</h4>
              <Toggle label="Is Event" checked={edits.is_event} onChange={(v) => setEdits({ ...edits, is_event: v })} />
              <Toggle label="Show in What's On" checked={edits.show_in_whats_on} onChange={(v) => setEdits({ ...edits, show_in_whats_on: v })} />
              <Field label="Event Dates" value={edits.event_dates} onChange={(v) => setEdits({ ...edits, event_dates: v })} placeholder="e.g. 15 Mar 2026, or 15-20 Mar 2026" />
              <Field label="Event Cost" value={edits.event_cost} onChange={(v) => setEdits({ ...edits, event_cost: v })} placeholder="e.g. Free, $25, $10-$50" />
              <Field label="Ticket URL" value={edits.ticket_url} onChange={(v) => setEdits({ ...edits, ticket_url: v })} />
              <Field label="Source URL" value={edits.source_url} onChange={(v) => setEdits({ ...edits, source_url: v })} />

              <h4 className="text-xs font-bold uppercase text-muted-foreground pt-2">Organizer</h4>
              <Field label="Organizer Name" value={edits.organizer_name} onChange={(v) => setEdits({ ...edits, organizer_name: v })} />
              <Field label="Organizer Phone" value={edits.organizer_phone} onChange={(v) => setEdits({ ...edits, organizer_phone: v })} />
              <Field label="Organizer Website" value={edits.organizer_website} onChange={(v) => setEdits({ ...edits, organizer_website: v })} />
              <Field label="Facebook" value={edits.organizer_facebook} onChange={(v) => setEdits({ ...edits, organizer_facebook: v })} placeholder="URL or handle" />
              <Field label="Instagram" value={edits.organizer_instagram} onChange={(v) => setEdits({ ...edits, organizer_instagram: v })} placeholder="URL or handle" />

              <h4 className="text-xs font-bold uppercase text-muted-foreground pt-2">Amenities</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <Toggle label="WiFi" checked={edits.wifi} onChange={(v) => setEdits({ ...edits, wifi: v })} />
                <Toggle label="Parking" checked={edits.parking} onChange={(v) => setEdits({ ...edits, parking: v })} />
                <Toggle label="Accessible" checked={edits.wheelchair_accessible} onChange={(v) => setEdits({ ...edits, wheelchair_accessible: v })} />
                <Toggle label="Outdoor Seating" checked={edits.outdoor_seating} onChange={(v) => setEdits({ ...edits, outdoor_seating: v })} />
                <Toggle label="Pet Friendly" checked={edits.pet_friendly} onChange={(v) => setEdits({ ...edits, pet_friendly: v })} />
                <Toggle label="Family Friendly" checked={edits.family_friendly} onChange={(v) => setEdits({ ...edits, family_friendly: v })} />
                <Toggle label="High Chairs" checked={edits.high_chairs} onChange={(v) => setEdits({ ...edits, high_chairs: v })} />
                <Toggle label="Change Rooms" checked={edits.change_rooms} onChange={(v) => setEdits({ ...edits, change_rooms: v })} />
                <Toggle label="Coffee" checked={edits.coffee} onChange={(v) => setEdits({ ...edits, coffee: v })} />
                <Toggle label="Power Outlets" checked={edits.power_outlets} onChange={(v) => setEdits({ ...edits, power_outlets: v })} />
                <Toggle label="Showers" checked={edits.showers} onChange={(v) => setEdits({ ...edits, showers: v })} />
                <Toggle label="Bike Parking" checked={edits.bike_parking} onChange={(v) => setEdits({ ...edits, bike_parking: v })} />
                <Toggle label="Shade" checked={edits.shade} onChange={(v) => setEdits({ ...edits, shade: v })} />
              </div>
            </div>
          ) : (
            <div className="space-y-1 text-sm">
              <InfoRow label="Name" value={activity.name} />
              <InfoRow label="Category" value={activity.category} />
              <InfoRow label="Address" value={activity.address || "—"} />
              <InfoRow label="Phone" value={activity.phone || "—"} />
              <InfoRow label="Hours" value={activity.hours_open && activity.hours_close ? `${activity.hours_open} – ${activity.hours_close}` : "—"} />
            </div>
          )}
        </section>

        {/* Danger Zone */}
        <section className="border-t border-border pt-4 space-y-2">
          <h3 className="text-xs font-bold uppercase text-destructive">Danger Zone</h3>
          <Button
            variant="destructive"
            size="sm"
            className="w-full gap-2"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete Activity
          </Button>
        </section>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, multiline, placeholder }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder={placeholder}
          className="w-full bg-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      )}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-xs font-medium text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}