import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBill } from "@/contexts/BillContext";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
  PlusCircle,
  Receipt,
  Users,
} from "lucide-react";

const DashboardOverview = () => {
  const { user } = useAuth();
  const { getActiveBills, getPendingInvitations, loading, error } = useBill();

  const activeBills = getActiveBills();
  const pendingInvitations = getPendingInvitations();

  // Get the 3 most recent bills
  const recentBills = activeBills.slice(0, 3);

  // Calculate total amount owed across all bills
  const totalOwed = activeBills.reduce((total, bill) => {
    const participant = bill.participants.find((p) => p.email === user?.email);
    if (participant) {
      return total + (participant.owes - participant.paid);
    }
    return total;
  }, 0);

  // Calculate total amount others owe you
  const totalOwedToYou = activeBills.reduce((total, bill) => {
    const participant = bill.participants.find((p) => p.email === user?.email);
    if (participant && participant.owes < participant.paid) {
      return total + (participant.paid - participant.owes);
    }
    return total;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Quick stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Bills
                </CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeBills.length}</div>
                <p className="text-xs text-muted-foreground">
                  {user?.tier === "standard" &&
                    `${user.billsCreated}/${user.maxBills} created this month`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">You Owe</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    "text-2xl font-bold",
                    totalOwed > 0 ? "text-red-600" : "",
                  )}
                >
                  ${Math.max(0, totalOwed).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across {activeBills.length} active bills
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  You're Owed
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    "text-2xl font-bold",
                    totalOwedToYou > 0 ? "text-green-600" : "",
                  )}
                >
                  ${totalOwedToYou.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  From{" "}
                  {
                    activeBills.filter((bill) => {
                      const participant = bill.participants.find(
                        (p) => p.email === user?.email,
                      );
                      return participant && participant.owes < participant.paid;
                    }).length
                  }{" "}
                  bills
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Invites
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {pendingInvitations.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {pendingInvitations.length > 0
                    ? "Waiting for your response"
                    : "No pending invitations"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick actions */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Quickly access common actions for your bills
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Link to="/dashboard/create-bill">
                  <Button
                    className="w-full justify-start"
                    disabled={
                      user?.tier === "guest" ||
                      (user?.tier === "standard" &&
                        user?.billsCreated >= user?.maxBills)
                    }
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Bill
                  </Button>
                </Link>
                <Link to="/dashboard/bills">
                  <Button variant="outline" className="w-full justify-start">
                    <Receipt className="mr-2 h-4 w-4" />
                    View All Bills
                  </Button>
                </Link>
                {user?.tier === "standard" &&
                  user?.billsCreated >= user?.maxBills && (
                    <Link to="/dashboard/upgrade">
                      <Button
                        variant="secondary"
                        className="w-full justify-start bg-amber-500 hover:bg-amber-600 text-white"
                      >
                        <DollarSign className="mr-2 h-4 w-4" />
                        Upgrade to Premium
                      </Button>
                    </Link>
                  )}
              </CardContent>
            </Card>

            {/* Pending invitations */}
            <Card>
              <CardHeader>
                <CardTitle>Pending Invitations</CardTitle>
                <CardDescription>
                  Bills you've been invited to join
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingInvitations.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2" />
                    <p>No pending invitations</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingInvitations.map((invitation) => (
                      <div
                        key={invitation.id}
                        className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${invitation.createdBy}`}
                              alt={invitation.createdBy}
                            />
                            <AvatarFallback>
                              {invitation.createdBy
                                .substring(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{invitation.billName}</p>
                            <p className="text-sm text-muted-foreground">
                              From: {invitation.createdBy}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            Decline
                          </Button>
                          <Button size="sm">Accept</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your most recent bills and expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentBills.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Receipt className="h-8 w-8 mx-auto mb-2" />
                  <p>No recent activity</p>
                  {user?.tier !== "guest" && (
                    <Link to="/dashboard/create-bill">
                      <Button className="mt-4" variant="outline">
                        Create Your First Bill
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentBills.map((bill) => {
                    const userParticipant = bill.participants.find(
                      (p) => p.email === user?.email,
                    );
                    const userOwes = userParticipant
                      ? userParticipant.owes - userParticipant.paid
                      : 0;

                    return (
                      <div
                        key={bill.id}
                        className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex -space-x-2">
                            {bill.participants
                              .slice(0, 3)
                              .map((participant) => (
                                <Avatar
                                  key={participant.id}
                                  className="border-2 border-background h-8 w-8"
                                >
                                  <AvatarImage
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.name}`}
                                    alt={participant.name}
                                  />
                                  <AvatarFallback>
                                    {participant.name
                                      .substring(0, 2)
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                            {bill.participants.length > 3 && (
                              <Avatar className="border-2 border-background h-8 w-8">
                                <AvatarFallback>
                                  +{bill.participants.length - 3}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{bill.name}</p>
                            <div className="flex items-center space-x-2">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  bill.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : bill.status === "pending"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-blue-100 text-blue-800",
                                )}
                              >
                                {bill.status === "active" && (
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                )}
                                {bill.status === "pending" && (
                                  <Clock className="mr-1 h-3 w-3" />
                                )}
                                {bill.status.charAt(0).toUpperCase() +
                                  bill.status.slice(1)}
                              </Badge>
                              <p className="text-xs text-muted-foreground">
                                {new Date(bill.updatedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={cn(
                              "font-medium",
                              userOwes > 0
                                ? "text-red-600"
                                : userOwes < 0
                                  ? "text-green-600"
                                  : "",
                            )}
                          >
                            {userOwes > 0
                              ? `You owe $${userOwes.toFixed(2)}`
                              : userOwes < 0
                                ? `You're owed $${Math.abs(userOwes).toFixed(2)}`
                                : "Settled"}
                          </p>
                          <Link to={`/dashboard/manage-bill/${bill.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                            >
                              View Details
                              <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Link to="/dashboard/bills" className="w-full">
                <Button variant="outline" className="w-full">
                  View All Bills
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
};

export default DashboardOverview;
