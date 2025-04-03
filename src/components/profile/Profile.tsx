import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertCircle, CreditCard, Save } from "lucide-react";

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || "",
    nickname: user?.nickname || "",
    email: user?.email || "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      // Validate form
      if (!formData.name.trim()) {
        setError("Name is required");
        return;
      }

      if (!formData.email.trim()) {
        setError("Email is required");
        return;
      }

      // Update user profile
      updateUser({
        name: formData.name.trim(),
        nickname: formData.nickname.trim() || formData.name.split(" ")[0],
        email: formData.email.trim(),
      });

      setSuccess("Profile updated successfully");
      setIsEditing(false);
    } catch (err) {
      setError("Failed to update profile. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 p-4 rounded-md flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          {success}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Manage your personal information and account settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.nickname || "user"}`}
                      alt={user?.name || "User"}
                    />
                    <AvatarFallback>
                      {user?.nickname?.substring(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-medium">
                      {user?.name || "User"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {user?.email || ""}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nickname">Nickname (Optional)</Label>
                  <Input
                    id="nickname"
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-2">
                {isEditing ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          name: user?.name || "",
                          nickname: user?.nickname || "",
                          email: user?.email || "",
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      <Save className="mr-2 h-4 w-4" /> Save Changes
                    </Button>
                  </>
                ) : (
                  <Button type="button" onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              View your account status and subscription details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Account Type</h3>
              <div className="flex items-center space-x-2">
                <Badge
                  className={cn(
                    user?.tier === "premium"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
                      : user?.tier === "standard"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
                  )}
                >
                  {user?.tier.charAt(0).toUpperCase() + user?.tier.slice(1)}
                </Badge>
                {user?.tier === "standard" && (
                  <Link to="/dashboard/upgrade">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs bg-amber-500 hover:bg-amber-600 text-white border-amber-500 hover:border-amber-600"
                    >
                      <CreditCard className="mr-1 h-3 w-3" /> Upgrade
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            <Separator />

            {/* Account limits based on tier */}
            <div>
              <h3 className="text-lg font-medium mb-2">Account Limits</h3>
              <div className="space-y-2">
                {user?.tier === "guest" && (
                  <>
                    <p className="text-sm">
                      As a Guest user, you can only view bills you've been
                      invited to and create a single bill with up to 2
                      participants.
                    </p>
                    <div className="mt-4">
                      <Link to="/dashboard/upgrade">
                        <Button className="w-full">Upgrade Your Account</Button>
                      </Link>
                    </div>
                  </>
                )}

                {user?.tier === "standard" && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Bills Created</span>
                      <span className="text-sm font-medium">
                        {user.billsCreated}/{user.maxBills}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div
                        className="bg-primary h-2.5 rounded-full"
                        style={{
                          width: `${(user.billsCreated / user.maxBills) * 100}%`,
                        }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center mt-4">
                      <span className="text-sm">Max Participants Per Bill</span>
                      <span className="text-sm font-medium">
                        {user.maxParticipants}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground mt-4">
                      Upgrade to Premium for unlimited bills and participants.
                    </p>
                  </>
                )}

                {user?.tier === "premium" && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Bills</span>
                      <span className="text-sm font-medium">Unlimited</span>
                    </div>

                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm">Participants Per Bill</span>
                      <span className="text-sm font-medium">Unlimited</span>
                    </div>

                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm">Archived Storage</span>
                      <span className="text-sm font-medium">Unlimited</span>
                    </div>

                    <p className="text-sm text-muted-foreground mt-4">
                      You're enjoying all premium features of BillSplit.
                    </p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;

// Helper function for class names
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
