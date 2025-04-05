import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Check,
  Edit,
  Trash2,
  UserPlus,
  DollarSign,
  ArrowLeftRight,
  FileArchive,
} from "lucide-react";

interface Participant {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  userType: "guest" | "standard" | "premium" | "owner";
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  date: string;
  splitType: "equal" | "custom";
  splits: {
    participantId: string;
    amount: number;
    isPaid: boolean;
  }[];
}

interface Bill {
  id: string;
  title: string;
  description: string;
  date: string;
  participants: Participant[];
  expenses: Expense[];
  totalAmount: number;
  isArchived: boolean;
  createdBy: string;
}

interface BillDetailProps {
  bill?: Bill;
  currentUserId?: string;
  currentUserType?: "guest" | "standard" | "premium";
  onEditBill?: (bill: Bill) => void;
  onDeleteBill?: (billId: string) => void;
  onArchiveBill?: (billId: string) => void;
  onAddExpense?: (billId: string, expense: Omit<Expense, "id">) => void;
  onUpdateExpense?: (billId: string, expense: Expense) => void;
  onDeleteExpense?: (billId: string, expenseId: string) => void;
  onUpdatePaymentStatus?: (
    billId: string,
    expenseId: string,
    participantId: string,
    isPaid: boolean,
  ) => void;
}

const BillDetail: React.FC<BillDetailProps> = ({
  bill = {
    id: "1",
    title: "Dinner at Italian Restaurant",
    description: "Team dinner after project completion",
    date: "2023-06-15",
    participants: [
      {
        id: "user1",
        name: "John Doe",
        email: "john@example.com",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
        userType: "owner",
      },
      {
        id: "user2",
        name: "Jane Smith",
        email: "jane@example.com",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jane",
        userType: "standard",
      },
      {
        id: "user3",
        name: "Bob Johnson",
        email: "bob@example.com",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
        userType: "guest",
      },
    ],
    expenses: [
      {
        id: "exp1",
        description: "Main course",
        amount: 120,
        paidBy: "user1",
        date: "2023-06-15",
        splitType: "equal",
        splits: [
          { participantId: "user1", amount: 40, isPaid: true },
          { participantId: "user2", amount: 40, isPaid: false },
          { participantId: "user3", amount: 40, isPaid: false },
        ],
      },
      {
        id: "exp2",
        description: "Drinks",
        amount: 60,
        paidBy: "user2",
        date: "2023-06-15",
        splitType: "custom",
        splits: [
          { participantId: "user1", amount: 25, isPaid: false },
          { participantId: "user2", amount: 25, isPaid: true },
          { participantId: "user3", amount: 10, isPaid: false },
        ],
      },
    ],
    totalAmount: 180,
    isArchived: false,
    createdBy: "user1",
  },
  currentUserId = "user1",
  currentUserType = "premium",
  onEditBill = () => {},
  onDeleteBill = () => {},
  onArchiveBill = () => {},
  onAddExpense = () => {},
  onUpdateExpense = () => {},
  onDeleteExpense = () => {},
  onUpdatePaymentStatus = () => {},
}) => {
  const [activeTab, setActiveTab] = useState("expenses");
  const [isAddExpenseDialogOpen, setIsAddExpenseDialogOpen] = useState(false);
  const [isEditExpenseDialogOpen, setIsEditExpenseDialogOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    description: "",
    amount: 0,
    paidBy: currentUserId,
    splitType: "equal",
    splits: [],
  });

  const isOwner = currentUserId === bill.createdBy;
  const isPremium = currentUserType === "premium";
  const canEdit = isOwner || isPremium;
  const canDelete = isOwner || isPremium;

  const calculateBalances = () => {
    const balances: Record<string, number> = {};

    // Initialize balances for all participants
    bill.participants.forEach((participant) => {
      balances[participant.id] = 0;
    });

    // Calculate what each person paid and owes
    bill.expenses.forEach((expense) => {
      // Add the full amount to the person who paid
      balances[expense.paidBy] += expense.amount;

      // Subtract what each person owes
      expense.splits.forEach((split) => {
        balances[split.participantId] -= split.amount;
      });
    });

    return balances;
  };

  const balances = calculateBalances();

  const handleAddExpense = () => {
    if (!newExpense.description || !newExpense.amount) return;

    // Calculate splits based on split type
    let splits = [];
    if (newExpense.splitType === "equal") {
      const equalAmount = Number(newExpense.amount) / bill.participants.length;
      splits = bill.participants.map((participant) => ({
        participantId: participant.id,
        amount: equalAmount,
        isPaid: participant.id === newExpense.paidBy,
      }));
    } else {
      // For custom split, we'd need UI to input individual amounts
      // This is a simplified version
      splits = bill.participants.map((participant) => ({
        participantId: participant.id,
        amount: 0, // This would be set by the user in the UI
        isPaid: participant.id === newExpense.paidBy,
      }));
    }

    const expenseToAdd = {
      description: newExpense.description || "",
      amount: Number(newExpense.amount) || 0,
      paidBy: newExpense.paidBy || currentUserId,
      date: new Date().toISOString().split("T")[0],
      splitType: newExpense.splitType || "equal",
      splits,
    };

    onAddExpense(bill.id, expenseToAdd);
    setNewExpense({
      description: "",
      amount: 0,
      paidBy: currentUserId,
      splitType: "equal",
      splits: [],
    });
    setIsAddExpenseDialogOpen(false);
  };

  const handleEditExpense = () => {
    if (!currentExpense) return;
    onUpdateExpense(bill.id, currentExpense);
    setCurrentExpense(null);
    setIsEditExpenseDialogOpen(false);
  };

  const handleDeleteExpense = (expenseId: string) => {
    onDeleteExpense(bill.id, expenseId);
  };

  const handleUpdatePaymentStatus = (
    expenseId: string,
    participantId: string,
    isPaid: boolean,
  ) => {
    onUpdatePaymentStatus(bill.id, expenseId, participantId, isPaid);
  };

  const getParticipantName = (participantId: string) => {
    const participant = bill.participants.find((p) => p.id === participantId);
    return participant ? participant.name : "Unknown";
  };

  return (
    <div className="bg-background w-full max-w-5xl mx-auto p-4 rounded-lg">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-2xl">{bill.title}</CardTitle>
            <CardDescription className="mt-2">
              {bill.description}
              <div className="mt-1 text-sm">
                Created on: {new Date(bill.date).toLocaleDateString()}
              </div>
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditBill(bill)}
              >
                <Edit className="h-4 w-4 mr-1" /> Edit
              </Button>
            )}
            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will delete the bill and all its expenses.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDeleteBill(bill.id)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {!bill.isArchived && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onArchiveBill(bill.id)}
              >
                <FileArchive className="h-4 w-4 mr-1" /> Archive
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue="expenses"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="participants">Participants</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>

            <TabsContent value="expenses" className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Expense List</h3>
                {canEdit && (
                  <Dialog
                    open={isAddExpenseDialogOpen}
                    onOpenChange={setIsAddExpenseDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button>
                        <DollarSign className="h-4 w-4 mr-1" /> Add Expense
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Expense</DialogTitle>
                        <DialogDescription>
                          Enter the details of the expense to add it to this
                          bill.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="description">Description</Label>
                          <Input
                            id="description"
                            value={newExpense.description}
                            onChange={(e) =>
                              setNewExpense({
                                ...newExpense,
                                description: e.target.value,
                              })
                            }
                            placeholder="Dinner, Groceries, etc."
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="amount">Amount</Label>
                          <Input
                            id="amount"
                            type="number"
                            value={newExpense.amount || ""}
                            onChange={(e) =>
                              setNewExpense({
                                ...newExpense,
                                amount: parseFloat(e.target.value),
                              })
                            }
                            placeholder="0.00"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="paidBy">Paid By</Label>
                          <Select
                            value={newExpense.paidBy}
                            onValueChange={(value) =>
                              setNewExpense({ ...newExpense, paidBy: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select who paid" />
                            </SelectTrigger>
                            <SelectContent>
                              {bill.participants.map((participant) => (
                                <SelectItem
                                  key={participant.id}
                                  value={participant.id}
                                >
                                  {participant.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label>Split Type</Label>
                          <RadioGroup
                            value={newExpense.splitType}
                            onValueChange={(value) =>
                              setNewExpense({
                                ...newExpense,
                                splitType: value as "equal" | "custom",
                              })
                            }
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="equal" id="equal" />
                              <Label htmlFor="equal">Equal Split</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="custom" id="custom" />
                              <Label htmlFor="custom">Custom Split</Label>
                            </div>
                          </RadioGroup>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsAddExpenseDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleAddExpense}>Add Expense</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              {bill.expenses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No expenses available. Add an expense to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {bill.expenses.map((expense) => (
                    <Card key={expense.id} className="overflow-hidden">
                      <CardHeader className="p-4 pb-2 flex flex-row justify-between items-start">
                        <div>
                          <CardTitle className="text-base">
                            {expense.description}
                          </CardTitle>
                          <CardDescription>
                            {new Date(expense.date).toLocaleDateString()} • Paid
                            by {getParticipantName(expense.paidBy)} •
                            <Badge variant="outline">
                              {expense.splitType === "equal"
                                ? "Equal Split"
                                : "Custom Split"}
                            </Badge>
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-lg font-semibold">
                            ${expense.amount.toFixed(2)}
                          </div>
                          {canEdit && (
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setCurrentExpense(expense);
                                  setIsEditExpenseDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Expense
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this
                                      expense? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleDeleteExpense(expense.id)
                                      }
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Participant</TableHead>
                              <TableHead className="text-right">
                                Amount
                              </TableHead>
                              <TableHead className="text-right">
                                Status
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {expense.splits.map((split) => (
                              <TableRow
                                key={`${expense.id}-${split.participantId}`}
                              >
                                <TableCell>
                                  {getParticipantName(split.participantId)}
                                </TableCell>
                                <TableCell className="text-right">
                                  ${split.amount.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {split.isPaid ? (
                                    <Badge
                                      variant="outline"
                                      className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                    >
                                      <Check className="h-3 w-3 mr-1" /> Paid
                                    </Badge>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleUpdatePaymentStatus(
                                          expense.id,
                                          split.participantId,
                                          true,
                                        )
                                      }
                                      disabled={!canEdit}
                                    >
                                      Mark as Paid
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="participants" className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Participants</h3>
                {canEdit && (
                  <Button variant="outline">
                    <UserPlus className="h-4 w-4 mr-1" /> Invite User
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {bill.participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={participant.avatar} />
                        <AvatarFallback>
                          {participant.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{participant.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {participant.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          participant.userType === "owner"
                            ? "default"
                            : participant.userType === "premium"
                              ? "secondary"
                              : participant.userType === "standard"
                                ? "outline"
                                : "outline"
                        }
                      >
                        {participant.userType.charAt(0).toUpperCase() +
                          participant.userType.slice(1)}
                      </Badge>
                      <div className="text-sm font-medium">
                        {balances[participant.id] > 0 ? (
                          <span className="text-green-600 dark:text-green-400">
                            Gets ${balances[participant.id].toFixed(2)}
                          </span>
                        ) : balances[participant.id] < 0 ? (
                          <span className="text-red-600 dark:text-red-400">
                            Owes $
                            {Math.abs(balances[participant.id]).toFixed(2)}
                          </span>
                        ) : (
                          <span>Settled</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="summary" className="mt-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Bill Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">
                        Total Amount
                      </div>
                      <div className="text-2xl font-bold">
                        ${bill.totalAmount.toFixed(2)}
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">
                        Number of Expenses
                      </div>
                      <div className="text-2xl font-bold">
                        {bill.expenses.length}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Payment Summary</h3>
                  <Card>
                    <CardContent className="p-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Participant</TableHead>
                            <TableHead className="text-right">Paid</TableHead>
                            <TableHead className="text-right">Owes</TableHead>
                            <TableHead className="text-right">
                              Balance
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bill.participants.map((participant) => {
                            // Calculate total paid by this participant
                            const totalPaid = bill.expenses
                              .filter((e) => e.paidBy === participant.id)
                              .reduce((sum, e) => sum + e.amount, 0);

                            // Calculate total owed by this participant
                            const totalOwed = bill.expenses
                              .flatMap((e) => e.splits)
                              .filter((s) => s.participantId === participant.id)
                              .reduce((sum, s) => sum + s.amount, 0);

                            const balance = totalPaid - totalOwed;

                            return (
                              <TableRow key={participant.id}>
                                <TableCell>{participant.name}</TableCell>
                                <TableCell className="text-right">
                                  ${totalPaid.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right">
                                  ${totalOwed.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <span
                                    className={
                                      balance > 0
                                        ? "text-green-600 dark:text-green-400"
                                        : balance < 0
                                          ? "text-red-600 dark:text-red-400"
                                          : ""
                                    }
                                  >
                                    ${balance.toFixed(2)}
                                  </span>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Settlement Plan</h3>
                  <Card>
                    <CardContent className="p-4">
                      {Object.entries(balances).some(
                        ([_, balance]) => balance !== 0,
                      ) ? (
                        <div className="space-y-3">
                          {Object.entries(balances)
                            .filter(([_, balance]) => balance < 0) // People who owe money
                            .map(([debtorId, debtorBalance]) => {
                              return Object.entries(balances)
                                .filter(([_, balance]) => balance > 0) // People who are owed money
                                .map(([creditorId, creditorBalance]) => {
                                  const paymentAmount = Math.min(
                                    Math.abs(debtorBalance),
                                    creditorBalance,
                                  );
                                  if (paymentAmount > 0) {
                                    return (
                                      <div
                                        key={`${debtorId}-${creditorId}`}
                                        className="flex items-center justify-between p-3 border rounded-lg"
                                      >
                                        <div className="flex items-center space-x-2">
                                          <span className="font-medium">
                                            {getParticipantName(debtorId)}
                                          </span>
                                          <ArrowLeftRight className="h-4 w-4" />
                                          <span className="font-medium">
                                            {getParticipantName(creditorId)}
                                          </span>
                                        </div>
                                        <div className="font-semibold">
                                          ${paymentAmount.toFixed(2)}
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                });
                            })}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          All balances are settled.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            {bill.participants.length} participants • {bill.expenses.length}{" "}
            expenses
          </div>
          <div className="text-sm font-medium">
            Total: ${bill.totalAmount.toFixed(2)}
          </div>
        </CardFooter>
      </Card>

      {/* Edit Expense Dialog */}
      <Dialog
        open={isEditExpenseDialogOpen}
        onOpenChange={setIsEditExpenseDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Update the details of this expense.
            </DialogDescription>
          </DialogHeader>
          {currentExpense && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={currentExpense.description}
                  onChange={(e) =>
                    setCurrentExpense({
                      ...currentExpense,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-amount">Amount</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  value={currentExpense.amount}
                  onChange={(e) =>
                    setCurrentExpense({
                      ...currentExpense,
                      amount: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-paidBy">Paid By</Label>
                <Select
                  value={currentExpense.paidBy}
                  onValueChange={(value) =>
                    setCurrentExpense({ ...currentExpense, paidBy: value })
                  }
                >
                  <SelectTrigger>
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
                <Label>Split Type</Label>
                <RadioGroup
                  value={currentExpense.splitType}
                  onValueChange={(value) =>
                    setCurrentExpense({
                      ...currentExpense,
                      splitType: value as "equal" | "custom",
                    })
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="equal" id="edit-equal" />
                    <Label htmlFor="edit-equal">Equal Split</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="edit-custom" />
                    <Label htmlFor="edit-custom">Custom Split</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditExpenseDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEditExpense}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BillDetail;
