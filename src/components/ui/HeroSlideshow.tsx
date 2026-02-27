import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MapPin, ChevronDown } from "lucide-react";
import { Button } from "./button";
import { triggerHaptic } from "@/lib/haptics";

interface HeroSlideshowProps {
  images: string[];
  title?: string;
  subtitle?: string;
  interval?: number;
  ctaText?: string;
  onCtaClick?: () => void;
}

export function HeroSlideshow({
  images,
  title = "Discover Sydney",
  subtitle = "Join thousands exploring the best spots in Australia's most vibrant city.",
  interval = 6000,
  ctaText = "Start Exploring",
  onCtaClick
}: HeroSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval]);

  return (
    <section className="relative w-full h-screen overflow-hidden bg-slate-900 text-white">
      {/* Image layer - absolute positioned to fill container */}
      <div className="absolute inset-0">
        <AnimatePresence mode="popLayout">
          <motion.img
            key={currentIndex}
            src={images[currentIndex]}
            alt="Sydney"
            className="w-full h-full object-cover"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{
              opacity: 1,
              scale: 1.15
            }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 1.2, ease: "easeInOut" },
              scale: { duration: 12, ease: "easeOut" }
            }} />

        </AnimatePresence>
      </div>

      {/* Multi-layer gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />


      {/* Main content - centered */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="space-y-6 max-w-3xl">
          {/* Headline with italic styling like Polarsteps */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
            className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold italic leading-tight drop-shadow-2xl"
            style={{
              textShadow: '0 4px 30px rgba(0,0,0,0.5)',
              fontFamily: 'Georgia, serif'
            }}>

            {title}
          </motion.h1>
          
          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="text-lg md:text-xl lg:text-2xl text-white/90 max-w-2xl mx-auto font-light drop-shadow-lg">

            {subtitle}
          </motion.p>

          {/* CTA Button + Rating */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">

            <Button
              size="lg"
              onClick={() => {triggerHaptic("medium");onCtaClick?.();}}
              className="bg-white text-foreground hover:bg-white/90 font-semibold px-8 py-6 text-base rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">

              <MapPin className="w-5 h-5 mr-2 text-primary" />
              {ctaText}
            </Button>
            
            {/* Rating badge */}
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) =>
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                )}
              </div>
              <span className="text-white/90 text-sm font-medium">4.8 (140K RATINGS)</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Slide indicators - bottom */}
      {images.length > 1 &&
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {images.map((_, index) =>
        <button
          key={index}
          onClick={() => setCurrentIndex(index)}
          className={`h-2 rounded-full transition-all duration-300 ${
          index === currentIndex ?
          "bg-white w-8" :
          "bg-white/40 w-2 hover:bg-white/60"}`
          }
          aria-label={`Go to slide ${index + 1}`} />

        )}
        </div>
      }

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">

        
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>

          <ChevronDown className="w-6 h-6 text-white/70" />
        </motion.div>
      </motion.div>
    </section>);

}