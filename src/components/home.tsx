import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import Hero from "./landing/Hero";
import TierComparison from "./landing/TierComparison";
import FeatureShowcase from "./landing/FeatureShowcase";
import Testimonials from "./landing/Testimonials";
import AuthModal from "./auth/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "./layout/Navbar";
import { motion } from "framer-motion";

const Home = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<
    "login" | "register" | "recovery"
  >("login");

  const { isAuthenticated, user, login, register, logout } = useAuth();
  const navigate = useNavigate();

  // No redirection needed as we've removed the dashboard
  useEffect(() => {
    // Initialize theme from localStorage or system preference
    const savedTheme =
      localStorage.getItem("theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    setTheme(savedTheme as "light" | "dark");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark");
  };

  const handleGetStarted = () => {
    setAuthModalTab("register");
    setAuthModalOpen(true);
  };

  const handleLogin = () => {
    setAuthModalTab("login");
    setAuthModalOpen(true);
  };

  const handleLoginSubmit = async (values: any) => {
    try {
      await login(values.username, values.password);
      setAuthModalOpen(false);
    } catch (error) {
      console.error("Login failed:", error);
      // In a real app, you would show an error message
    }
  };

  const handleRegisterSubmit = async (values: any) => {
    try {
      await register(values);
      setAuthModalOpen(false);
    } catch (error) {
      console.error("Registration failed:", error);
      // In a real app, you would show an error message
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <Navbar
        isAuthenticated={isAuthenticated}
        userTier={user?.tier}
        userName={user?.nickname}
        onLogin={handleLogin}
        onRegister={handleGetStarted}
        onLogout={logout}
        onToggleTheme={toggleTheme}
        isDarkMode={theme === "dark"}
      />

      <main>
        {/* Hero Section */}
        <Hero onGetStarted={handleGetStarted} onLogin={handleLogin} />

        {/* Feature Showcase */}
        <div id="features">
          <FeatureShowcase />
        </div>

        {/* Testimonials Section */}
        <div id="testimonials">
          <Testimonials />
        </div>

        {/* Pricing/Tier Comparison */}
        <div id="pricing">
          <TierComparison />
        </div>

        {/* FAQ Section */}
        <motion.section
          id="faq"
          className="py-16 bg-background"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight mb-2">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Find answers to common questions about our bill splitting
                system.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:gap-12 max-w-5xl mx-auto">
              {[
                {
                  question: "How does the bill splitting work?",
                  answer:
                    "Our system allows you to create a bill, add expenses, and split them equally or customize amounts for each participant. You can track who paid what and see current balances at a glance.",
                },
                {
                  question: "Can I use the app without creating an account?",
                  answer:
                    "Yes! You can use our app as a guest with limited features. You'll be able to view bills you've been invited to and create one bill without registration.",
                },
                {
                  question:
                    "What's the difference between Standard and Premium tiers?",
                  answer:
                    "Standard users can create up to 5 bills per month with 3 participants per bill. Premium users enjoy unlimited bill creation and participants, plus additional features like export reports and priority support.",
                },
                {
                  question: "How do I invite others to my bill?",
                  answer:
                    "When you create a bill, you'll receive a unique invitation code that you can share with others. They can use this code to join your bill, even if they're not registered users.",
                },
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  className="space-y-2"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true, amount: 0.3 }}
                >
                  <h3 className="text-xl font-semibold">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <motion.footer
        className="border-t bg-background"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container px-4 py-10 md:px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">SplitBill</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#features"
                    className="hover:text-primary transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-primary transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Testimonials
                  </a>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Guides
                  </a>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t pt-6 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} SplitBill. All rights reserved.</p>
          </div>
        </div>
      </motion.footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onOpenChange={setAuthModalOpen}
        defaultTab={authModalTab}
        onLoginSuccess={handleLoginSubmit}
        onRegisterSuccess={handleRegisterSubmit}
        onPasswordRecoverySuccess={() => {
          setAuthModalOpen(false);
          // In a real app, this would show a success message
          console.log("Password recovery email sent");
        }}
      />
    </div>
  );
};

export default Home;
