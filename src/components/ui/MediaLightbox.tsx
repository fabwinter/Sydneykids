import { useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Download, Share2, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface MediaLightboxProps {
  urls: string[];
  initialIndex?: number;
  onClose: () => void;
  onDelete?: (url: string) => void;
}

export function MediaLightbox({ urls, initialIndex = 0, onClose, onDelete }: MediaLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const current = urls[index];
  const isVideo = current?.match(/\.(mp4|webm|mov)(\?|$)/i);

  const prev = useCallback(() => setIndex((i) => (i - 1 + urls.length) % urls.length), [urls.length]);
  const next = useCallback(() => setIndex((i) => (i + 1) % urls.length), [urls.length]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(current);
      toast.success("Link copied");
    } catch { toast.error("Failed to copy"); }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ url: current }); } catch {}
    } else {
      handleCopy();
    }
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = current;
    a.download = current.split("/").pop() || "download";
    a.target = "_blank";
    a.click();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col" onClick={onClose}>
      {/* Top bar */}
      <div className="flex items-center justify-between p-3 shrink-0" onClick={(e) => e.stopPropagation()}>
        <span className="text-white/70 text-sm font-medium">
          {urls.length > 1 ? `${index + 1} / ${urls.length}` : ""}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={handleCopy} className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white" title="Copy link">
            <Copy className="w-5 h-5" />
          </button>
          <button onClick={handleDownload} className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white" title="Save">
            <Download className="w-5 h-5" />
          </button>
          <button onClick={handleShare} className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white" title="Share">
            <Share2 className="w-5 h-5" />
          </button>
          {onDelete && (
            <button
              onClick={() => { onDelete(current); if (urls.length <= 1) onClose(); else if (index >= urls.length - 1) setIndex(index - 1); }}
              className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-red-400"
              title="Delete"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white" title="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Media */}
      <div className="flex-1 flex items-center justify-center min-h-0 px-4" onClick={(e) => e.stopPropagation()}>
        {isVideo ? (
          <video src={current} controls autoPlay className="max-w-full max-h-full rounded-lg" />
        ) : (
          <img src={current} alt="" className="max-w-full max-h-full object-contain rounded-lg" />
        )}
      </div>

      {/* Nav arrows */}
      {urls.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots */}
      {urls.length > 1 && urls.length <= 10 && (
        <div className="flex justify-center gap-1.5 pb-4 shrink-0" onClick={(e) => e.stopPropagation()}>
          {urls.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`w-2 h-2 rounded-full transition-colors ${i === index ? "bg-white" : "bg-white/30"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
