import React from "react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, Check } from "lucide-react";
import { motion } from "framer-motion";

interface HeroProps {
  onGetStarted?: () => void;
  onLogin?: () => void;
}

const Hero = ({ onGetStarted = () => {}, onLogin = () => {} }: HeroProps) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  return (
    <motion.div 
      className="w-full bg-background py-16 px-10 md:py-24 lg:py-32"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
          <motion.div
            className="flex flex-col justify-center space-y-4"
            variants={itemVariants}
          >
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                Split Bills Effortlessly with Friends
              </h1>
              <p className="text-muted-foreground md:text-xl">
                Our modern bill splitting system makes it easy to track
                expenses, manage payments, and settle debts with friends,
                family, or roommates.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={onGetStarted} size="lg" className="gap-2">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-primary" />
              <span>No credit card required</span>
            </div>
          </motion.div>
          <motion.div
            className="flex items-center justify-center"
            variants={itemVariants}
          >
            <div className="relative w-full max-w-[500px] aspect-[4/3] rounded-lg overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 z-10 rounded-lg" />
              <img
                src="https://images.unsplash.com/photo-1580048915913-4f8f5cb481c4?w=800&q=80"
                alt="3D Bill Split Icon"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="relative w-40 h-40 md:w-60 md:h-60">
                  <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-32 h-32 md:w-48 md:h-48 bg-background/80 backdrop-blur-md rounded-full shadow-xl flex items-center justify-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-12 h-16 md:w-16 md:h-20 bg-primary/80 rounded-lg transform -rotate-6 shadow-lg"></div>
                        <div className="w-12 h-16 md:w-16 md:h-20 bg-secondary/80 rounded-lg transform rotate-6 shadow-lg"></div>
                      </div>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 md:w-12 md:h-12 bg-background rounded-full border-4 border-primary flex items-center justify-center shadow-inner">
                        <span className="text-primary font-bold text-lg md:text-2xl">
                          $
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/80 to-transparent p-6 z-20">
                <div className="bg-background/90 backdrop-blur-sm rounded-lg p-4 shadow-lg max-w-xs mx-auto">
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">
                      Dinner with Friends
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Total: $120.00
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-primary/10 p-2 rounded">
                        <p className="font-medium">Alex</p>
                        <p>$40.00</p>
                      </div>
                      <div className="bg-primary/10 p-2 rounded">
                        <p className="font-medium">Jamie</p>
                        <p>$40.00</p>
                      </div>
                      <div className="bg-primary/10 p-2 rounded">
                        <p className="font-medium">Taylor</p>
                        <p>$40.00</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Hero;
