import React, { useState } from "react";
import { Sun, Moon, Plus, Archive, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import BillList from "./BillList";
import CreateBillForm from "./CreateBillForm";

interface UserProfile {
  firstName: string;
  lastName: string;
  nickname: string;
  email: string;
  userType: "Guest" | "Standard" | "Premium";
  avatar?: string;
}

const HomePage = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [activeTab, setActiveTab] = useState("active");
  const [createBillDialogOpen, setCreateBillDialogOpen] = useState(false);

  // Mock user profile data
  const [userProfile, setUserProfile] = useState<UserProfile>({
    firstName: "John",
    lastName: "Doe",
    nickname: "JD",
    email: "john.doe@example.com",
    userType: "Standard",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
  });

  // Mock bills data
  const [activeBills, setActiveBills] = useState([
    {
      id: "1",
      title: "Dinner at Italian Restaurant",
      totalAmount: 120.5,
      participants: 3,
      dateCreated: "2023-05-15",
      status: "pending",
    },
    {
      id: "2",
      title: "Movie Night",
      totalAmount: 45.75,
      participants: 2,
      dateCreated: "2023-05-10",
      status: "pending",
    },
    {
      id: "3",
      title: "Grocery Shopping",
      totalAmount: 87.3,
      participants: 2,
      dateCreated: "2023-05-05",
      status: "pending",
    },
  ]);

  const [archivedBills, setArchivedBills] = useState([
    {
      id: "4",
      title: "Weekend Trip",
      totalAmount: 350.0,
      participants: 4,
      dateCreated: "2023-04-20",
      status: "completed",
    },
    {
      id: "5",
      title: "Utility Bills",
      totalAmount: 120.45,
      participants: 3,
      dateCreated: "2023-04-15",
      status: "completed",
    },
  ]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark");
  };

  const handleCreateBill = (billData: any) => {
    // In a real app, this would send data to a backend
    console.log("Creating new bill:", billData);
    setCreateBillDialogOpen(false);
    // Add the new bill to active bills
    const newBill = {
      id: (activeBills.length + archivedBills.length + 1).toString(),
      title: billData.title,
      totalAmount: parseFloat(billData.totalAmount) || 0,
      participants: billData.participants?.length || 1,
      dateCreated: new Date().toISOString().split("T")[0],
      status: "pending",
    };
    setActiveBills([...activeBills, newBill]);
  };

  return (
    <div
      className={`min-h-screen bg-background ${theme === "dark" ? "dark" : ""}`}
    >
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-card border-r border-border p-4 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-xl font-bold">SplitBill</h1>
            <div className="flex items-center space-x-2">
              <Sun className="h-4 w-4" />
              <Switch
                checked={theme === "dark"}
                onCheckedChange={toggleTheme}
              />
              <Moon className="h-4 w-4" />
            </div>
          </div>

          <div className="flex flex-col space-y-1">
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => setActiveTab("active")}
            >
              <span className="mr-2">📋</span> Active Bills
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => setActiveTab("archived")}
            >
              <Archive className="mr-2 h-4 w-4" /> Archived Bills
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => setCreateBillDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> Create New Bill
            </Button>
          </div>

          <div className="mt-auto">
            <Separator className="my-4" />
            <div className="flex items-center space-x-2 mb-4">
              <Avatar>
                <AvatarImage
                  src={userProfile.avatar}
                  alt={userProfile.nickname}
                />
                <AvatarFallback>
                  {userProfile.firstName[0]}
                  {userProfile.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">
                  {userProfile.firstName} {userProfile.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {userProfile.userType} User
                </p>
              </div>
            </div>
            <div className="flex flex-col space-y-1">
              <Button variant="ghost" className="justify-start">
                <User className="mr-2 h-4 w-4" /> Profile
              </Button>
              <Button variant="ghost" className="justify-start">
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">
                {activeTab === "active" ? "Active Bills" : "Archived Bills"}
              </h1>
              {activeTab === "active" && (
                <Button onClick={() => setCreateBillDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Create New Bill
                </Button>
              )}
            </div>

            {/* User tier information card */}
            {userProfile.userType === "Standard" && (
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Standard Plan</h3>
                      <p className="text-sm text-muted-foreground">
                        You can create up to 5 bills per month with max 3
                        participants per bill.
                      </p>
                    </div>
                    <Button variant="outline">Upgrade to Premium</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bills list */}
            {activeTab === "active" ? (
              <BillList
                bills={activeBills}
                userType={userProfile.userType}
                isArchived={false}
              />
            ) : (
              <BillList
                bills={archivedBills}
                userType={userProfile.userType}
                isArchived={true}
              />
            )}
          </div>
        </div>
      </div>

      {/* Create Bill Dialog */}
      <Dialog
        open={createBillDialogOpen}
        onOpenChange={setCreateBillDialogOpen}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New Bill</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new bill and invite participants.
            </DialogDescription>
          </DialogHeader>
          <CreateBillForm
            onSubmit={handleCreateBill}
            userType={userProfile.userType}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HomePage;
