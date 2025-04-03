import React, { useState, useEffect } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface TierFeature {
  name: string;
  guest: boolean | string;
  standard: boolean | string;
  premium: boolean | string;
}

interface TierComparisonProps {
  className?: string;
}

const TierComparison = ({ className = "" }: TierComparisonProps) => {
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    setIsInView(true);
  }, []);

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

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
    hover: {
      y: -10,
      transition: { duration: 0.3 },
    },
  };

  const titleVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  // Default tier features
  const features: TierFeature[] = [
    { name: "Bill Creation", guest: true, standard: true, premium: true },
    {
      name: "Number of Bills",
      guest: "1 bill only",
      standard: "5 bills/month",
      premium: "Unlimited",
    },
    {
      name: "Participants per Bill",
      guest: "2 max",
      standard: "3 max",
      premium: "Unlimited",
    },
    {
      name: "Expense Tracking",
      guest: "Basic",
      standard: "Advanced",
      premium: "Advanced",
    },
    {
      name: "Custom Split Options",
      guest: false,
      standard: true,
      premium: true,
    },
    {
      name: "Bill History",
      guest: false,
      standard: "30 days",
      premium: "Unlimited",
    },
    { name: "Invite via Code", guest: false, standard: true, premium: true },
    { name: "Export Reports", guest: false, standard: false, premium: true },
    { name: "Priority Support", guest: false, standard: false, premium: true },
  ];

  // Pricing information
  const pricing = {
    guest: "Free",
    standard: "$4.99/month",
    premium: "$9.99/month",
  };

  // Helper function to render feature availability
  const renderFeatureAvailability = (value: boolean | string) => {
    if (typeof value === "string") {
      return <span className="text-sm">{value}</span>;
    }

    return value ? (
      <Check className="h-5 w-5 text-green-500" />
    ) : (
      <X className="h-5 w-5 text-red-500" />
    );
  };

  return (
    <motion.div
      className={cn(
        "w-full max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 bg-background",
        className,
      )}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
    >
      <motion.div className="text-center mb-12" variants={titleVariants}>
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Choose Your Plan
        </h2>
        <p className="mt-3 max-w-2xl mx-auto text-xl text-muted-foreground sm:mt-4">
          Select the tier that best fits your bill splitting needs
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-y-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:gap-x-8">
        {/* Guest Tier */}
        <motion.div variants={cardVariants} whileHover="hover">
          <Card className="flex flex-col h-full border-2 border-muted hover:border-muted-foreground/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                Guest
              </CardTitle>
              <CardDescription className="text-center text-lg mt-2">
                {pricing.guest}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-4">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{feature.name}</span>
                    <span className="flex items-center justify-center w-12">
                      {renderFeatureAvailability(feature.guest)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="flex justify-center pb-6">
              <Button variant="outline" className="w-full">
                Continue as Guest
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Standard Tier */}
        <motion.div variants={cardVariants} whileHover="hover">
          <Card className="flex flex-col h-full border-2 border-primary hover:border-primary/70 transition-colors">
            <CardHeader>
              <div className="py-1 px-3 bg-primary text-primary-foreground text-xs font-semibold rounded-full w-fit mx-auto mb-2">
                MOST POPULAR
              </div>
              <CardTitle className="text-2xl font-bold text-center">
                Standard
              </CardTitle>
              <CardDescription className="text-center text-lg mt-2">
                {pricing.standard}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-4">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{feature.name}</span>
                    <span className="flex items-center justify-center w-12">
                      {renderFeatureAvailability(feature.standard)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="flex justify-center pb-6">
              <Button className="w-full">Sign Up</Button>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Premium Tier */}
        <motion.div variants={cardVariants} whileHover="hover">
          <Card className="flex flex-col h-full border-2 border-purple-500 hover:border-purple-400 transition-colors">
            <CardHeader>
              <div className="py-1 px-3 bg-purple-500 text-white text-xs font-semibold rounded-full w-fit mx-auto mb-2">
                PREMIUM
              </div>
              <CardTitle className="text-2xl font-bold text-center">
                Premium
              </CardTitle>
              <CardDescription className="text-center text-lg mt-2">
                {pricing.premium}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-4">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{feature.name}</span>
                    <span className="flex items-center justify-center w-12">
                      {renderFeatureAvailability(feature.premium)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="flex justify-center pb-6">
              <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white">
                Upgrade to Premium
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>

      <motion.div className="mt-10 text-center" variants={titleVariants}>
        <p className="text-muted-foreground">
          All plans include basic expense tracking and bill management features.
          <br />
          Need help choosing?{" "}
          <Button variant="link" className="p-0 h-auto font-semibold">
            Contact us
          </Button>
        </p>
      </motion.div>
    </motion.div>
  );
};

export default TierComparison;
