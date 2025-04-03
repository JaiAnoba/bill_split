import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sun,
  Moon,
  Menu,
  X,
  User,
  LogOut,
  Settings,
  CreditCard,
} from "lucide-react";

interface NavbarProps {
  isAuthenticated?: boolean;
  userTier?: "guest" | "standard" | "premium";
  userName?: string;
  onLogin?: () => void;
  onRegister?: () => void;
  onLogout?: () => void;
  onToggleTheme?: () => void;
  isDarkMode?: boolean;
}

const Navbar = ({
  isAuthenticated = false,
  userTier = "guest",
  userName = "User",
  onLogin = () => {},
  onRegister = () => {},
  onLogout = () => {},
  onToggleTheme = () => {},
  isDarkMode = false,
}: NavbarProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-background border-b border-border shadow-sm">
      <div className="container mx-auto px-10 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">BS</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-20">
            <a
              href="#"
              className="text-foreground hover:text-primary transition-colors"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Home
            </a>

            <a
              href="#features"
              className="text-foreground hover:text-primary transition-colors"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Features
            </a>
            <a
              href="#testimonials"
              className="text-foreground hover:text-primary transition-colors"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("testimonials")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Testimonials
            </a>
            <a
              href="#pricing"
              className="text-foreground hover:text-primary transition-colors"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("pricing")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Pricing
            </a>
            <a
              href="#faq"
              className="text-foreground hover:text-primary transition-colors"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("faq")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              FAQ
            </a>
          </div>

          {/* Right Side - Auth & Theme Toggle */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleTheme}
                    className="rounded-full"
                    aria-label="Toggle theme"
                  >
                    {isDarkMode ? (
                      <Sun className="h-5 w-5" />
                    ) : (
                      <Moon className="h-5 w-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {isDarkMode
                      ? "Switch to light mode"
                      : "Switch to dark mode"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Authentication */}
            {!isAuthenticated ? ( 
              <div className="hidden sm:flex items-center space-x-2">
                {/* <Button variant="ghost" onClick={onLogin}>
                  Login
                </Button> */}
                <Button onClick={onRegister}>Register</Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                {/* User Tier Badge */}
                <div className="hidden sm:block">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${userTier === "premium" ? "bg-amber-100 text-amber-800" : userTier === "standard" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}
                  >
                    {userTier.charAt(0).toUpperCase() + userTier.slice(1)}
                  </span>
                </div>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="rounded-full p-0 h-10 w-10"
                    >
                      <Avatar>
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`}
                          alt={userName}
                        />
                        <AvatarFallback>
                          {userName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{userName}</p>
                        <p className="text-xs text-muted-foreground">
                          {userTier.charAt(0).toUpperCase() + userTier.slice(1)}{" "}
                          User
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        to="/profile"
                        className="cursor-pointer w-full flex items-center"
                      >
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        to="/settings"
                        className="cursor-pointer w-full flex items-center"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    {userTier === "standard" && (
                      <DropdownMenuItem asChild>
                        <Link
                          to="/upgrade"
                          className="cursor-pointer w-full flex items-center"
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          <span>Upgrade to Premium</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={onLogout}
                      className="cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMobileMenu}
                className="rounded-full"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pt-4 pb-3 border-t mt-3">
            <div className="flex flex-col space-y-3">
              <a
                href="#"
                className="text-foreground hover:text-primary transition-colors px-3 py-2 rounded-md"
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  toggleMobileMenu();
                }}
              >
                Home
              </a>

              <a
                href="#features"
                className="text-foreground hover:text-primary transition-colors px-3 py-2 rounded-md"
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .getElementById("features")
                    ?.scrollIntoView({ behavior: "smooth" });
                  toggleMobileMenu();
                }}
              >
                Features
              </a>
              <a
                href="#testimonials"
                className="text-foreground hover:text-primary transition-colors px-3 py-2 rounded-md"
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .getElementById("testimonials")
                    ?.scrollIntoView({ behavior: "smooth" });
                  toggleMobileMenu();
                }}
              >
                Testimonials
              </a>
              <a
                href="#pricing"
                className="text-foreground hover:text-primary transition-colors px-3 py-2 rounded-md"
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .getElementById("pricing")
                    ?.scrollIntoView({ behavior: "smooth" });
                  toggleMobileMenu();
                }}
              >
                Pricing
              </a>
              <a
                href="#faq"
                className="text-foreground hover:text-primary transition-colors px-3 py-2 rounded-md"
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .getElementById("faq")
                    ?.scrollIntoView({ behavior: "smooth" });
                  toggleMobileMenu();
                }}
              >
                FAQ
              </a>
              {!isAuthenticated && (
                <div className="flex flex-col space-y-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      onLogin();
                      toggleMobileMenu();
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    onClick={() => {
                      onRegister();
                      toggleMobileMenu();
                    }}
                  >
                    Register
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
