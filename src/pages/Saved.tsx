import { useState } from "react";
import { Bookmark, Plus, Heart, MapPin, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate } from "react-router-dom";
import { useSavedItems, useToggleSavedItem } from "@/hooks/useSavedItems";
import { usePlaylists, useCreatePlaylist, useDeletePlaylist } from "@/hooks/usePlaylists";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Saved() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { data: savedItems, isLoading: savedLoading } = useSavedItems();
  const { data: playlists, isLoading: playlistsLoading } = usePlaylists();
  const toggleSaved = useToggleSavedItem();
  const createPlaylist = useCreatePlaylist();
  const deletePlaylist = useDeletePlaylist();
  
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistEmoji, setNewPlaylistEmoji] = useState("📍");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Redirect if not logged in
  if (!authLoading && !user) {
    navigate("/login");
    return null;
  }

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;
    createPlaylist.mutate(
      { name: newPlaylistName, emoji: newPlaylistEmoji },
      {
        onSuccess: () => {
          setNewPlaylistName("");
          setNewPlaylistEmoji("📍");
          setIsDialogOpen(false);
        },
      }
    );
  };

  const handleRemoveSaved = (activityId: string) => {
    toggleSaved.mutate({ activityId, isSaved: true });
  };

  return (
    <AppLayout>
      <div className="px-4 py-4 space-y-6 max-w-lg mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Saved</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                New Playlist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Playlist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="emoji">Emoji</Label>
                  <Input
                    id="emoji"
                    value={newPlaylistEmoji}
                    onChange={(e) => setNewPlaylistEmoji(e.target.value)}
                    maxLength={2}
                    className="w-20 text-2xl text-center"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Weekend Vibes"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleCreatePlaylist} 
                  className="w-full"
                  disabled={!newPlaylistName.trim() || createPlaylist.isPending}
                >
                  {createPlaylist.isPending ? "Creating..." : "Create Playlist"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Playlists */}
        <section>
          <h2 className="section-header">Your Playlists</h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
            {playlistsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="shrink-0 w-36">
                  <Skeleton className="h-24 rounded-xl" />
                </div>
              ))
            ) : playlists && playlists.length > 0 ? (
              playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  className="shrink-0 w-36 bg-card rounded-xl p-4 border border-border hover:border-primary transition-colors cursor-pointer relative group"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePlaylist.mutate(playlist.id);
                    }}
                    className="absolute top-2 right-2 p-1 rounded-full bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <span className="text-3xl">{playlist.emoji || "📍"}</span>
                  <h3 className="font-semibold text-sm mt-2 line-clamp-1">{playlist.name}</h3>
                  <p className="text-xs text-muted-foreground">{playlist.item_count || 0} places</p>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground py-4">
                No playlists yet. Create one to organize your favorite spots!
              </div>
            )}
          </div>
        </section>
        
        {/* All Saved */}
        <section>
          <h2 className="section-header">All Saved Places</h2>
          <div className="space-y-4">
            {savedLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
              ))
            ) : savedItems && savedItems.length > 0 ? (
              savedItems.map((item) => (
                <Link
                  key={item.id}
                  to={`/activity/${item.activity_id}`}
                  className="block relative w-full overflow-hidden rounded-2xl bg-muted aspect-[4/3] group"
                >
                  <img
                    src={item.activities.hero_image_url || "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop"}
                    alt={item.activities.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveSaved(item.activity_id);
                    }}
                    className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors shadow-sm"
                  >
                    <Heart className="w-4 h-4 fill-white text-white" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 z-10 p-3 space-y-0.5">
                    <h3 className="font-bold text-sm text-white leading-tight line-clamp-1">
                      {item.activities.name}
                    </h3>
                    <p className="text-xs text-white/70">
                      {item.activities.category}
                    </p>
                    <p className="text-xs text-white/60 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {item.activities.address || "Sydney, NSW"}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No saved places yet</p>
                <p className="text-sm">Start exploring and save your favorite spots!</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
