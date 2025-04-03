import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Quote } from "lucide-react";

interface TestimonialProps {
  quote: string;
  author: string;
  role: string;
  avatarSeed: string;
}

const Testimonial = ({ quote, author, role, avatarSeed }: TestimonialProps) => {
  return (
    <Card className="h-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardContent className="p-6">
        <div className="flex flex-col h-full justify-between">
          <div>
            <Quote className="h-8 w-8 text-primary/40 mb-4" />
            <p className="text-foreground italic mb-6">{quote}</p>
          </div>
          <div className="flex items-center mt-4">
            <Avatar className="h-10 w-10 mr-3">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
              />
              <AvatarFallback>{author.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">{author}</p>
              <p className="text-sm text-muted-foreground">{role}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface TestimonialsProps {
  className?: string;
}

const Testimonials = ({ className = "" }: TestimonialsProps) => {
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    setIsInView(true);
  }, []);

  const testimonials = [
    {
      quote:
        "This bill splitting app has made managing expenses with my roommates so much easier. No more awkward money conversations!",
      author: "Alex Johnson",
      role: "Premium User",
      avatarSeed: "alex123",
    },
    {
      quote:
        "I love how simple it is to create and share bills. The interface is intuitive and the equal split feature saves me so much time.",
      author: "Jamie Smith",
      role: "Standard User",
      avatarSeed: "jamie456",
    },
    {
      quote:
        "As someone who travels with friends often, this app has been a game-changer for managing our group expenses.",
      author: "Taylor Williams",
      role: "Premium User",
      avatarSeed: "taylor789",
    },
  ];

  return (
    <section className={`py-16 px-4 bg-background ${className}`}>
      <div className="container mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold tracking-tight mb-2">
            What Our Users Say
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Don't just take our word for it - hear from some of our satisfied
            users
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <Testimonial
                quote={testimonial.quote}
                author={testimonial.author}
                role={testimonial.role}
                avatarSeed={testimonial.avatarSeed}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
