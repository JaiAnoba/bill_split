import React, { useState } from "react";
import { Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Receipt,
  Archive,
  UserCircle,
  Settings,
  PlusCircle,
  Moon,
  Sun,
  LogOut,
  CreditCard,
  Bell,
  Users,
  DollarSign,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Import actual components
import DashboardOverview from "./dashboard/DashboardOverview";
import BillList from "./bills/BillList";

// Placeholder components - these will be implemented in future steps
const CreateBill = () => <div>Create Bill</div>;
const ManageBill = () => <div>Manage Bill</div>;
const ArchiveBill = () => <div>Archive Bill</div>;
const Profile = () => <div>Profile</div>;
const UserSettings = () => <div>User Settings</div>;

const Dashboard = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark");
  };

  // Navigation items with access control based on user tier
  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      allowedTiers: ["guest", "standard", "premium"],
    },
    {
      title: "Bills",
      href: "/dashboard/bills",
      icon: <Receipt className="h-5 w-5" />,
      allowedTiers: ["guest", "standard", "premium"],
    },
    {
      title: "Create Bill",
      href: "/dashboard/create-bill",
      icon: <PlusCircle className="h-5 w-5" />,
      allowedTiers: ["standard", "premium"],
      disabled:
        user?.tier === "standard" && user?.billsCreated >= user?.maxBills,
    },
    {
      title: "Archived Bills",
      href: "/dashboard/archived",
      icon: <Archive className="h-5 w-5" />,
      allowedTiers: ["standard", "premium"],
    },
    {
      title: "Profile",
      href: "/dashboard/profile",
      icon: <UserCircle className="h-5 w-5" />,
      allowedTiers: ["guest", "standard", "premium"],
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: <Settings className="h-5 w-5" />,
      allowedTiers: ["standard", "premium"],
    },
  ];

  // Filter navigation items based on user tier
  const filteredNavItems = navItems.filter(
    (item) => user && item.allowedTiers.includes(user.tier),
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-card border-r border-border">
        <div className="p-4">
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">BS</span>
            </div>
            <span className="font-bold text-xl">BillSplit</span>
          </Link>
        </div>

        <Separator />

        {/* User info */}
        <div className="p-4">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.nickname || "user"}`}
                alt={user?.name || "User"}
              />
              <AvatarFallback>
                {user?.nickname?.substring(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user?.nickname || "User"}</p>
              <div className="flex items-center">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    user?.tier === "premium"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
                      : user?.tier === "standard"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
                  )}
                >
                  {user?.tier.charAt(0).toUpperCase() + user?.tier.slice(1)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Bill limits for Standard users */}
          {user?.tier === "standard" && (
            <div className="mt-3 text-xs text-muted-foreground">
              <p>
                Bills: {user.billsCreated}/{user.maxBills}
              </p>
              <p>Participants per bill: {user.maxParticipants}</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {filteredNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors",
                location.pathname === item.href
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                item.disabled &&
                  "opacity-50 cursor-not-allowed pointer-events-none",
              )}
            >
              {item.icon}
              <span>{item.title}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 mt-auto space-y-2">
          {/* Theme toggle */}
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={toggleTheme}
          >
            {theme === "light" ? (
              <>
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="mr-2 h-4 w-4" />
                <span>Light Mode</span>
              </>
            )}
          </Button>

          {/* Upgrade button for Standard users */}
          {user?.tier === "standard" && (
            <Button
              variant="default"
              size="sm"
              className="w-full justify-start bg-amber-500 hover:bg-amber-600 text-white"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Upgrade to Premium</span>
            </Button>
          )}

          {/* Logout button */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </Button>

          {/* Home button */}
          <Link to="/">
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <Home className="mr-2 h-4 w-4" />
              <span>Back to Home</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-background border-b border-border z-50 p-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">BS</span>
            </div>
            <span className="font-bold text-xl">BillSplit</span>
          </Link>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="rounded-full"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-6 md:p-8 md:pt-6 overflow-auto">
          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">
              {location.pathname === "/dashboard" && "Dashboard"}
              {location.pathname === "/dashboard/bills" && "Bills"}
              {location.pathname === "/dashboard/create-bill" && "Create Bill"}
              {location.pathname === "/dashboard/archived" && "Archived Bills"}
              {location.pathname === "/dashboard/profile" && "Profile"}
              {location.pathname === "/dashboard/settings" && "Settings"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {location.pathname === "/dashboard" &&
                "Welcome back, " + user?.nickname}
              {location.pathname === "/dashboard/bills" &&
                "Manage your active bills"}
              {location.pathname === "/dashboard/create-bill" &&
                "Create a new bill to split expenses"}
              {location.pathname === "/dashboard/archived" &&
                "View your archived bills"}
              {location.pathname === "/dashboard/profile" &&
                "Manage your profile information"}
              {location.pathname === "/dashboard/settings" &&
                "Adjust your account settings"}
            </p>
          </div>

          {/* Routes */}
          <Routes>
            <Route path="/" element={<DashboardOverview />} />
            <Route path="/bills" element={<BillList />} />
            <Route path="/create-bill" element={<CreateBill />} />
            <Route path="/manage-bill/:id" element={<ManageBill />} />
            <Route path="/archived" element={<ArchiveBill />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<UserSettings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>

        {/* Mobile navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
          <div className="grid grid-cols-5 gap-1 p-2">
            {filteredNavItems.slice(0, 5).map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-1 rounded-md text-xs",
                  location.pathname === item.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground",
                  item.disabled &&
                    "opacity-50 cursor-not-allowed pointer-events-none",
                )}
              >
                {item.icon}
                <span className="mt-1">{item.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
