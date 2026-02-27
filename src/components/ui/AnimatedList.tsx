import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const listItemVariants = {
  hidden: { 
    opacity: 0, 
    y: 20 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
};

export function AnimatedList({ 
  children, 
  className = "",
  staggerDelay = 0.1 
}: AnimatedListProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedListItem({ 
  children, 
  className = "" 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <motion.div variants={listItemVariants} className={className}>
      {children}
    </motion.div>
  );
}
