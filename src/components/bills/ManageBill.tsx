import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useBill, Bill, Expense, Participant } from "@/contexts/BillContext";
import { useAuth } from "@/contexts/AuthContext";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  Copy,
  DollarSign,
  Edit,
  Plus,
  Trash2,
  Users,
} from "lucide-react";

const ManageBill = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    getBillById,
    updateBill,
    archiveBill,
    deleteBill,
    addExpense,
    updateExpense,
    deleteExpense,
    addParticipant,
    removeParticipant,
    loading,
    error,
  } = useBill();

  const [bill, setBill] = useState<Bill | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddExpenseDialog, setShowAddExpenseDialog] = useState(false);
  const [showAddParticipantDialog, setShowAddParticipantDialog] =
    useState(false);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // New expense form state
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    paidBy: "",
    splitType: "equal" as "equal" | "custom" | "percentage",
    customSplits: {} as Record<string, string>,
  });

  // New participant form state
  const [newParticipant, setNewParticipant] = useState({
    name: "",
    email: "",
  });

  // Load bill data
  useEffect(() => {
    if (id) {
      const billData = getBillById(id);
      if (billData) {
        setBill(billData);
        // Initialize custom splits with empty values for all participants
        const initialSplits: Record<string, string> = {};
        billData.participants.forEach((p) => {
          initialSplits[p.id] = "";
        });
        setNewExpense((prev) => ({ ...prev, customSplits: initialSplits }));
      } else {
        // Bill not found, redirect to bills list
        navigate("/dashboard/bills");
      }
    }
  }, [id, getBillById, navigate]);

  // Handle copy invitation code
  const handleCopyInviteCode = () => {
    if (bill) {
      navigator.clipboard.writeText(bill.invitationCode);
      // In a real app, you would show a toast notification
      alert(`Invitation code ${bill.invitationCode} copied to clipboard!`);
    }
  };

  // Handle archive bill
  const handleArchiveBill = async () => {
    if (bill) {
      try {
        await archiveBill(bill.id);
        navigate("/dashboard/bills");
      } catch (err) {
        if (err instanceof Error) {
          setFormError(err.message);
        } else {
          setFormError("Failed to archive bill. Please try again.");
        }
      }
    }
  };

  // Handle delete bill
  const handleDeleteBill = async () => {
    if (bill) {
      try {
        await deleteBill(bill.id);
        setShowDeleteConfirmDialog(false);
        navigate("/dashboard/bills");
      } catch (err) {
        if (err instanceof Error) {
          setFormError(err.message);
        } else {
          setFormError("Failed to delete bill. Please try again.");
        }
      }
    }
  };

  // Handle add expense
  const handleAddExpense = async () => {
    if (!bill) return;

    try {
      // Validate form
      if (!newExpense.description.trim()) {
        setFormError("Description is required");
        return;
      }

      if (!newExpense.amount || parseFloat(newExpense.amount) <= 0) {
        setFormError("Amount must be greater than 0");
        return;
      }

      if (!newExpense.paidBy) {
        setFormError("Please select who paid");
        return;
      }

      // Calculate splits based on split type
      const amount = parseFloat(newExpense.amount);
      let splits: { participantId: string; amount: number }[] = [];

      if (newExpense.splitType === "equal") {
        // Equal split among all participants
        const splitAmount = amount / bill.participants.length;
        splits = bill.participants.map((p) => ({
          participantId: p.id,
          amount: parseFloat(splitAmount.toFixed(2)),
        }));

        // Adjust for rounding errors by adding the remainder to the first participant
        const totalSplit = splits.reduce((sum, s) => sum + s.amount, 0);
        if (totalSplit !== amount) {
          const diff = amount - totalSplit;
          splits[0].amount = parseFloat((splits[0].amount + diff).toFixed(2));
        }
      } else if (newExpense.splitType === "custom") {
        // Custom split with specified amounts
        let totalCustomAmount = 0;

        for (const [participantId, amountStr] of Object.entries(
          newExpense.customSplits,
        )) {
          if (!amountStr.trim()) {
            setFormError("All participants must have a split amount");
            return;
          }

          const splitAmount = parseFloat(amountStr);
          if (isNaN(splitAmount) || splitAmount < 0) {
            setFormError("All split amounts must be valid numbers");
            return;
          }

          totalCustomAmount += splitAmount;
          splits.push({
            participantId,
            amount: splitAmount,
          });
        }

        // Validate total equals the expense amount
        if (Math.abs(totalCustomAmount - amount) > 0.01) {
          setFormError(
            `The sum of splits (${totalCustomAmount.toFixed(
              2,
            )}) must equal the expense amount (${amount.toFixed(2)})`,
          );
          return;
        }
      }

      // Create the expense
      await addExpense(bill.id, {
        description: newExpense.description.trim(),
        amount,
        paidBy: newExpense.paidBy,
        date: new Date().toISOString(),
        splitType: newExpense.splitType,
        splits,
      });

      // Reset form and close dialog
      setNewExpense({
        description: "",
        amount: "",
        paidBy: "",
        splitType: "equal",
        customSplits: {},
      });
      setShowAddExpenseDialog(false);
      setFormError(null);

      // Refresh bill data
      const updatedBill = getBillById(bill.id);
      if (updatedBill) setBill(updatedBill);
    } catch (err) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Failed to add expense. Please try again.");
      }
    }
  };

  // Handle add participant
  const handleAddParticipant = async () => {
    if (!bill) return;

    try {
      // Validate form
      if (!newParticipant.name.trim()) {
        setFormError("Name is required");
        return;
      }

      // Add participant
      await addParticipant(bill.id, {
        name: newParticipant.name.trim(),
        email: newParticipant.email.trim(),
        isRegistered: false,
      });

      // Reset form and close dialog
      setNewParticipant({ name: "", email: "" });
      setShowAddParticipantDialog(false);
      setFormError(null);

      // Refresh bill data
      const updatedBill = getBillById(bill.id);
      if (updatedBill) {
        setBill(updatedBill);
        // Update custom splits with new participant
        const updatedSplits = { ...newExpense.customSplits };
        updatedBill.participants.forEach((p) => {
          if (!updatedSplits[p.id]) {
            updatedSplits[p.id] = "";
          }
        });
        setNewExpense((prev) => ({ ...prev, customSplits: updatedSplits }));
      }
    } catch (err) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Failed to add participant. Please try again.");
      }
    }
  };

  // Handle remove participant
  const handleRemoveParticipant = async (participantId: string) => {
    if (!bill) return;

    try {
      await removeParticipant(bill.id, participantId);

      // Refresh bill data
      const updatedBill = getBillById(bill.id);
      if (updatedBill) {
        setBill(updatedBill);
        // Update custom splits without removed participant
        const updatedSplits = { ...newExpense.customSplits };
        delete updatedSplits[participantId];
        setNewExpense((prev) => ({ ...prev, customSplits: updatedSplits }));
      }
    } catch (err) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Failed to remove participant. Please try again.");
      }
    }
  };

  // Handle delete expense
  const handleDeleteExpense = async (expenseId: string) => {
    if (!bill) return;

    try {
      await deleteExpense(bill.id, expenseId);

      // Refresh bill data
      const updatedBill = getBillById(bill.id);
      if (updatedBill) setBill(updatedBill);
    } catch (err) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Failed to delete expense. Please try again.");
      }
    }
  };

  // Calculate total amount for the bill
  const calculateTotalAmount = () => {
    if (!bill) return 0;
    return bill.expenses.reduce((total, expense) => total + expense.amount, 0);
  };

  // Calculate what the current user owes in the bill
  const calculateUserOwes = () => {
    if (!bill || !user) return 0;
    const participant = bill.participants.find((p) => p.email === user.email);
    return participant ? participant.owes - participant.paid : 0;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Bill Not Found</h3>
        <p className="text-muted-foreground mb-6">
          The bill you're looking for doesn't exist or you don't have access to
          it.
        </p>
        <Link to="/dashboard/bills">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Bills
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error message */}
      {(error || formError) && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {formError || error}
        </div>
      )}

      {/* Bill header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{bill.name}</h1>
            <Badge
              variant="outline"
              className={cn(
                bill.status === "active"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                  : bill.status === "pending"
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                    : bill.status === "settled"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
              )}
            >
              {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
            </Badge>
            {bill.isExclusive && (
              <Badge
                variant="outline"
                className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100"
              >
                Private
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">{bill.description}</p>
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <span>Created {formatDate(bill.createdAt)}</span>
            <span>•</span>
            <span>Last updated {formatDate(bill.updatedAt)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddExpenseDialog(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Expense
          </Button>
          {!bill.isExclusive && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddParticipantDialog(true)}
              disabled={
                user?.tier === "standard" &&
                bill.participants.length >= (user?.maxParticipants || 0)
              }
            >
              <Users className="mr-2 h-4 w-4" /> Add Participant
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleArchiveBill}
            disabled={bill.status === "archived"}
          >
            <Archive className="mr-2 h-4 w-4" /> Archive
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteConfirmDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      {/* Bill summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${calculateTotalAmount().toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {bill.expenses.length} expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {calculateUserOwes() > 0 ? "You Owe" : "You're Owed"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-2xl font-bold",
                calculateUserOwes() > 0
                  ? "text-red-600 dark:text-red-400"
                  : calculateUserOwes() < 0
                    ? "text-green-600 dark:text-green-400"
                    : "",
              )}
            >
              ${Math.abs(calculateUserOwes()).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {calculateUserOwes() === 0
                ? "You're all settled up"
                : calculateUserOwes() > 0
                  ? "You need to pay this amount"
                  : "Others owe you this amount"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bill.participants.length}</div>
            <div className="flex -space-x-2 overflow-hidden mt-1">
              {bill.participants.slice(0, 5).map((participant) => (
                <Avatar
                  key={participant.id}
                  className="border-2 border-background"
                >
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.name}`}
                    alt={participant.name}
                  />
                  <AvatarFallback>
                    {participant.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {bill.participants.length > 5 && (
                <Avatar className="border-2 border-background">
                  <AvatarFallback>
                    +{bill.participants.length - 5}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different sections */}
      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bill Summary</CardTitle>
              <CardDescription>
                Overview of expenses and balances
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recent expenses */}
              <div>
                <h3 className="text-lg font-medium mb-2">Recent Expenses</h3>
                {bill.expenses.length === 0 ? (
                  <p className="text-muted-foreground">No expenses yet</p>
                ) : (
                  <div className="space-y-3">
                    {bill.expenses.slice(0, 3).map((expense) => {
                      const paidBy = bill.participants.find(
                        (p) => p.id === expense.paidBy,
                      );
                      return (
                        <div
                          key={expense.id}
                          className="flex justify-between items-center p-3 border rounded-md"
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${paidBy?.name || "unknown"}`}
                                alt={paidBy?.name || "Unknown"}
                              />
                              <AvatarFallback>
                                {paidBy?.name.substring(0, 2).toUpperCase() ||
                                  "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {expense.description}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Paid by {paidBy?.name || "Unknown"} •{" "}
                                {formatDate(expense.date)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              ${expense.amount.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {expense.splitType === "equal"
                                ? "Split equally"
                                : "Custom split"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {bill.expenses.length > 3 && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setActiveTab("expenses")}
                      >
                        View All Expenses
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* Balances */}
              <div>
                <h3 className="text-lg font-medium mb-2">Current Balances</h3>
                <div className="space-y-3">
                  {bill.participants.map((participant) => {
                    const balance = participant.paid - participant.owes;
                    return (
                      <div
                        key={participant.id}
                        className="flex justify-between items-center p-3 border rounded-md"
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.name}`}
                              alt={participant.name}
                            />
                            <AvatarFallback>
                              {participant.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{participant.name}</p>
                            {participant.email && (
                              <p className="text-xs text-muted-foreground">
                                {participant.email}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={cn(
                              "font-medium",
                              balance > 0
                                ? "text-green-600 dark:text-green-400"
                                : balance < 0
                                  ? "text-red-600 dark:text-red-400"
                                  : "",
                            )}
                          >
                            {balance === 0
                              ? "Settled"
                              : balance > 0
                                ? `Gets back $${balance.toFixed(2)}`
                                : `Owes $${Math.abs(balance).toFixed(2)}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Paid ${participant.paid.toFixed(2)} • Owes $
                            {participant.owes.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {!bill.isExclusive && (
                <>
                  <Separator />

                  {/* Invitation code */}
                  <div>
                    <h3 className="text-lg font-medium mb-2">
                      Invitation Code
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Share this code with others to join this bill
                    </p>
                    <div className="flex">
                      <Input
                        value={bill.invitationCode}
                        readOnly
                        className="rounded-r-none font-mono"
                      />
                      <Button
                        variant="outline"
                        className="rounded-l-none"
                        onClick={handleCopyInviteCode}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses tab */}
        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Expenses</CardTitle>
                <CardDescription>All expenses for this bill</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddExpenseDialog(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Expense
              </Button>
            </CardHeader>
            <CardContent>
              {bill.expenses.length === 0 ? (
                <div className="text-center py-6">
                  <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Expenses Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Add your first expense to start tracking
                  </p>
                  <Button onClick={() => setShowAddExpenseDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Expense
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Paid By</TableHead>
                      <TableHead>Split</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bill.expenses.map((expense) => {
                      const paidBy = bill.participants.find(
                        (p) => p.id === expense.paidBy,
                      );
                      return (
                        <TableRow key={expense.id}>
                          <TableCell className="font-medium">
                            {expense.description}
                          </TableCell>
                          <TableCell>{formatDate(expense.date)}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage
                                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${paidBy?.name || "unknown"}`}
                                  alt={paidBy?.name || "Unknown"}
                                />
                                <AvatarFallback>
                                  {paidBy?.name.substring(0, 2).toUpperCase() ||
                                    "?"}
                                </AvatarFallback>
                              </Avatar>
                              <span>{paidBy?.name || "Unknown"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {expense.splitType === "equal"
                                ? "Equal"
                                : expense.splitType === "percentage"
                                  ? "Percentage"
                                  : "Custom"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            ${expense.amount.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteExpense(expense.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Participants tab */}
        <TabsContent value="participants" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Participants</CardTitle>
                <CardDescription>People involved in this bill</CardDescription>
              </div>
              {!bill.isExclusive && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddParticipantDialog(true)}
                  disabled={
                    user?.tier === "standard" &&
                    bill.participants.length >= (user?.maxParticipants || 0)
                  }
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Participant
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Owes</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bill.participants.map((participant) => {
                    const balance = participant.paid - participant.owes;
                    return (
                      <TableRow key={participant.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.name}`}
                                alt={participant.name}
                              />
                              <AvatarFallback>
                                {participant.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {participant.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {participant.email || "Not provided"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              participant.isRegistered
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                : ""
                            }
                          >
                            {participant.isRegistered ? "Registered" : "Guest"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          ${participant.paid.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          ${participant.owes.toFixed(2)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-medium",
                            balance > 0
                              ? "text-green-600 dark:text-green-400"
                              : balance < 0
                                ? "text-red-600 dark:text-red-400"
                                : "",
                          )}
                        >
                          {balance === 0
                            ? "$0.00"
                            : balance > 0
                              ? `+$${balance.toFixed(2)}`
                              : `-$${Math.abs(balance).toFixed(2)}`}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleRemoveParticipant(participant.id)
                            }
                            disabled={
                              // Don't allow removing if they paid for expenses
                              bill.expenses.some(
                                (e) => e.paidBy === participant.id,
                              ) ||
                              // Don't allow removing if they still owe money
                              participant.owes > participant.paid
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Expense Dialog */}
      <Dialog
        open={showAddExpenseDialog}
        onOpenChange={setShowAddExpenseDialog}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
            <DialogDescription>
              Add a new expense to this bill. You can split it equally or
              customize how it's divided.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="expense-description">Description</Label>
              <Input
                id="expense-description"
                placeholder="Dinner, Groceries, etc."
                value={newExpense.description}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, description: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="expense-amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5">$</span>
                <Input
                  id="expense-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="pl-7"
                  value={newExpense.amount}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, amount: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="expense-paid-by">Paid By</Label>
              <Select
                value={newExpense.paidBy}
                onValueChange={(value) =>
                  setNewExpense({ ...newExpense, paidBy: value })
                }
              >
                <SelectTrigger id="expense-paid-by">
                  <SelectValue placeholder="Select who paid" />
                </SelectTrigger>
                <SelectContent>
                  {bill.participants.map((participant) => (
                    <SelectItem key={participant.id} value={participant.id}>
                      {participant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="expense-split-type">Split Type</Label>
              <Select
                value={newExpense.splitType}
                onValueChange={(value: "equal" | "custom" | "percentage") =>
                  setNewExpense({ ...newExpense, splitType: value })
                }
              >
                <SelectTrigger id="expense-split-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equal">Equal Split</SelectItem>
                  <SelectItem value="custom">Custom Amounts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom split inputs */}
            {newExpense.splitType === "custom" && (
              <div className="space-y-3 border rounded-md p-3">
                <Label>Custom Split Amounts</Label>
                {bill.participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center space-x-2"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.name}`}
                        alt={participant.name}
                      />
                      <AvatarFallback>
                        {participant.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm">{participant.name}</span>
                    <div className="relative w-24">
                      <span className="absolute left-3 top-2.5">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="pl-7"
                        value={newExpense.customSplits[participant.id] || ""}
                        onChange={(e) =>
                          setNewExpense({
                            ...newExpense,
                            customSplits: {
                              ...newExpense.customSplits,
                              [participant.id]: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                ))}
                {newExpense.amount && (
                  <div className="flex justify-between text-sm mt-2">
                    <span>Total:</span>
                    <span
                      className={cn(
                        "font-medium",
                        Object.values(newExpense.customSplits).reduce(
                          (sum, val) => sum + (val ? parseFloat(val) : 0),
                          0,
                        ) !== parseFloat(newExpense.amount)
                          ? "text-red-600 dark:text-red-400"
                          : "text-green-600 dark:text-green-400",
                      )}
                    >
                      $
                      {Object.values(newExpense.customSplits)
                        .reduce(
                          (sum, val) => sum + (val ? parseFloat(val) : 0),
                          0,
                        )
                        .toFixed(2)}
                      {" / $"}
                      {parseFloat(newExpense.amount).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddExpenseDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddExpense}>
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                "Add Expense"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Participant Dialog */}
      <Dialog
        open={showAddParticipantDialog}
        onOpenChange={setShowAddParticipantDialog}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Participant</DialogTitle>
            <DialogDescription>
              Add a new person to this bill.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="participant-name">Name</Label>
              <Input
                id="participant-name"
                placeholder="John Doe"
                value={newParticipant.name}
                onChange={(e) =>
                  setNewParticipant({
                    ...newParticipant,
                    name: e.target.value,
                  })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="participant-email">Email (Optional)</Label>
              <Input
                id="participant-email"
                type="email"
                placeholder="john@example.com"
                value={newParticipant.email}
                onChange={(e) =>
                  setNewParticipant({
                    ...newParticipant,
                    email: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddParticipantDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddParticipant}>
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                "Add Participant"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirmDialog}
        onOpenChange={setShowDeleteConfirmDialog}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Bill</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this bill? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteBill}>
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                "Delete Bill"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageBill;
