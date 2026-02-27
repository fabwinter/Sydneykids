import { useState } from "react";
import { X, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePlaylists, useCreatePlaylist, useAddToPlaylist } from "@/hooks/usePlaylists";
import { toast } from "sonner";

interface AddToPlaylistModalProps {
  activityId: string;
  activityName: string;
  onClose: () => void;
}

export function AddToPlaylistModal({ activityId, activityName, onClose }: AddToPlaylistModalProps) {
  const { data: playlists, isLoading } = usePlaylists();
  const createPlaylist = useCreatePlaylist();
  const addToPlaylist = useAddToPlaylist();
  const [newName, setNewName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set());

  const handleAdd = async (playlistId: string) => {
    addToPlaylist.mutate(
      { playlistId, activityId },
      {
        onSuccess: () => {
          setAddedTo((prev) => new Set(prev).add(playlistId));
        },
      }
    );
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    createPlaylist.mutate(
      { name: newName },
      {
        onSuccess: (data) => {
          setNewName("");
          setShowCreate(false);
          if (data?.id) {
            handleAdd(data.id);
          }
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="bg-background rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="font-bold text-lg">Save to Playlist</h2>
            <p className="text-xs text-muted-foreground truncate">{activityName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Playlists */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
          ) : playlists && playlists.length > 0 ? (
            playlists.map((playlist) => {
              const isAdded = addedTo.has(playlist.id);
              return (
                <button
                  key={playlist.id}
                  onClick={() => !isAdded && handleAdd(playlist.id)}
                  disabled={isAdded || addToPlaylist.isPending}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary transition-colors text-left"
                >
                  <span className="text-2xl">{playlist.emoji || "📍"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{playlist.name}</p>
                    <p className="text-xs text-muted-foreground">{playlist.item_count || 0} places</p>
                  </div>
                  {isAdded && <Check className="w-5 h-5 text-primary shrink-0" />}
                </button>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No playlists yet. Create one below!
            </p>
          )}
        </div>

        {/* Create new */}
        <div className="p-4 border-t border-border">
          {showCreate ? (
            <div className="flex gap-2">
              <Input
                placeholder="Playlist name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
              />
              <Button onClick={handleCreate} disabled={!newName.trim() || createPlaylist.isPending} size="sm">
                Add
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="w-4 h-4" />
              Create New Playlist
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
