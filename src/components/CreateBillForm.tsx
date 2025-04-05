import React, { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Plus,
  Trash2,
  Users,
  Mail,
  Copy,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

// Form schema validation
const billFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().optional(),
  date: z.string(),
});

const expenseSchema = z.object({
  name: z.string().min(1, { message: "Expense name is required" }),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  paidBy: z.string(),
  splitType: z.enum(["equal", "custom"]),
});

type BillFormValues = z.infer<typeof billFormSchema>;
type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface Participant {
  id: string;
  name: string;
  email: string;
  type: "registered" | "guest";
  avatar?: string;
}

interface Expense {
  id: string;
  name: string;
  amount: number;
  paidBy: string;
  splitType: "equal" | "custom";
  splits: {
    participantId: string;
    amount: number;
  }[];
}

const CreateBillForm = () => {
  const [step, setStep] = useState<number>(1);
  const [inviteCode, setInviteCode] = useState<string>("BILL-1234-ABCD");
  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: "user-1",
      name: "You",
      email: "you@example.com",
      type: "registered",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user1",
    },
  ]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currentExpense, setCurrentExpense] = useState<
    Partial<ExpenseFormValues>
  >({
    name: "",
    amount: "",
    paidBy: "user-1",
    splitType: "equal",
  });
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [showInviteDialog, setShowInviteDialog] = useState<boolean>(false);
  const [inviteEmail, setInviteEmail] = useState<string>("");
  const [inviteType, setInviteType] = useState<"registered" | "guest">(
    "registered",
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BillFormValues>({
    resolver: zodResolver(billFormSchema),
    defaultValues: {
      title: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
    },
  });

  const handleNextStep = () => {
    setStep(step + 1);
  };

  const handlePreviousStep = () => {
    setStep(step - 1);
  };

  const handleAddExpense = () => {
    if (
      !currentExpense.name ||
      !currentExpense.amount ||
      isNaN(Number(currentExpense.amount)) ||
      Number(currentExpense.amount) <= 0
    ) {
      return;
    }

    const amount = Number(currentExpense.amount);
    const newExpense: Expense = {
      id: `expense-${expenses.length + 1}`,
      name: currentExpense.name || "",
      amount,
      paidBy: currentExpense.paidBy || "user-1",
      splitType: currentExpense.splitType as "equal" | "custom",
      splits: [],
    };

    // Calculate splits
    if (currentExpense.splitType === "equal") {
      const splitAmount = amount / participants.length;
      newExpense.splits = participants.map((p) => ({
        participantId: p.id,
        amount: splitAmount,
      }));
    } else {
      // Custom split
      let remainingAmount = amount;
      const splits = [];

      for (let i = 0; i < participants.length; i++) {
        const participant = participants[i];
        const isLast = i === participants.length - 1;

        if (isLast) {
          splits.push({
            participantId: participant.id,
            amount: remainingAmount,
          });
        } else {
          const splitAmount = customSplits[participant.id]
            ? Number(customSplits[participant.id])
            : amount / participants.length;

          splits.push({
            participantId: participant.id,
            amount: splitAmount,
          });

          remainingAmount -= splitAmount;
        }
      }

      newExpense.splits = splits;
    }

    setExpenses([...expenses, newExpense]);
    setCurrentExpense({
      name: "",
      amount: "",
      paidBy: "user-1",
      splitType: "equal",
    });
    setCustomSplits({});
  };

  const handleRemoveExpense = (id: string) => {
    setExpenses(expenses.filter((expense) => expense.id !== id));
  };

  const handleAddParticipant = () => {
    if (!inviteEmail) return;

    const newParticipant: Participant = {
      id: `user-${participants.length + 1}`,
      name: inviteEmail.split("@")[0],
      email: inviteEmail,
      type: inviteType,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${inviteEmail}`,
    };

    setParticipants([...participants, newParticipant]);
    setInviteEmail("");
    setShowInviteDialog(false);
  };

  const handleRemoveParticipant = (id: string) => {
    if (id === "user-1") return; // Can't remove yourself
    setParticipants(participants.filter((p) => p.id !== id));
  };

  const regenerateInviteCode = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "BILL-";
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    setInviteCode(result);
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode);
    // Could add a toast notification here
  };

  const onSubmit = (data: BillFormValues) => {
    console.log("Form submitted:", { ...data, expenses, participants });
    // Here you would typically send the data to your backend
  };

  const calculateTotalAmount = () => {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  };

  const getParticipantById = (id: string) => {
    return participants.find((p) => p.id === id) || participants[0];
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-background">
      <CardHeader>
        <CardTitle>Create New Bill</CardTitle>
        <CardDescription>
          Split expenses with friends or colleagues. Fill in the details below
          to get started.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${step === stepNumber ? "bg-primary text-primary-foreground" : step > stepNumber ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}
                >
                  {stepNumber}
                </div>
                <span className="text-xs mt-1">
                  {stepNumber === 1
                    ? "Bill Details"
                    : stepNumber === 2
                      ? "Add Expenses"
                      : "Review & Share"}
                </span>
              </div>
            ))}
          </div>
          <div className="w-full bg-muted h-1 mt-2 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300 ease-in-out"
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="title">Bill Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Dinner at Luigi's"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add any additional details about this bill"
                  {...register("description")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" {...register("date")} />
              </div>

              <div className="space-y-2">
                <Label>Participants</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center gap-2 bg-muted p-2 rounded-md"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={participant.avatar} />
                        <AvatarFallback>
                          {participant.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{participant.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {participant.type}
                      </Badge>
                      {participant.id !== "user-1" && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() =>
                            handleRemoveParticipant(participant.id)
                          }
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <Dialog
                  open={showInviteDialog}
                  onOpenChange={setShowInviteDialog}
                >
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Participant
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Participant</DialogTitle>
                      <DialogDescription>
                        Invite someone to split this bill with you.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="inviteEmail">Email Address</Label>
                        <Input
                          id="inviteEmail"
                          placeholder="email@example.com"
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>User Type</Label>
                        <RadioGroup
                          value={inviteType}
                          onValueChange={(value) =>
                            setInviteType(value as "registered" | "guest")
                          }
                          className="flex space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="registered"
                              id="registered"
                            />
                            <Label htmlFor="registered">Registered User</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="guest" id="guest" />
                            <Label htmlFor="guest">Guest User</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" onClick={handleAddParticipant}>
                        Add Participant
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Expenses</h3>
                  <Badge variant="outline">
                    Total: ${calculateTotalAmount().toFixed(2)}
                  </Badge>
                </div>

                {expenses.length > 0 ? (
                  <div className="space-y-4">
                    {expenses.map((expense) => (
                      <div
                        key={expense.id}
                        className="flex justify-between items-center p-3 border rounded-md"
                      >
                        <div>
                          <p className="font-medium">{expense.name}</p>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <span>
                              Paid by {getParticipantById(expense.paidBy).name}
                            </span>
                            <span className="mx-2">•</span>
                            <span>Split: {expense.splitType}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-medium">
                            ${expense.amount.toFixed(2)}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveExpense(expense.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-md">
                    <p className="text-muted-foreground mb-2">
                      No expenses added yet
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Add your first expense below
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Add New Expense</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expenseName">Expense Name</Label>
                    <Input
                      id="expenseName"
                      placeholder="e.g., Dinner, Taxi, Movie tickets"
                      value={currentExpense.name}
                      onChange={(e) =>
                        setCurrentExpense({
                          ...currentExpense,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expenseAmount">Amount</Label>
                    <Input
                      id="expenseAmount"
                      placeholder="0.00"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={currentExpense.amount}
                      onChange={(e) =>
                        setCurrentExpense({
                          ...currentExpense,
                          amount: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paidBy">Paid By</Label>
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
                        {participants.map((participant) => (
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
                  <div className="space-y-2">
                    <Label htmlFor="splitType">Split Type</Label>
                    <Select
                      value={currentExpense.splitType}
                      onValueChange={(value) =>
                        setCurrentExpense({
                          ...currentExpense,
                          splitType: value as "equal" | "custom",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="How to split" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equal">Equal Split</SelectItem>
                        <SelectItem value="custom">Custom Split</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {currentExpense.splitType === "custom" && (
                  <div className="space-y-2 mt-4">
                    <Label>Custom Split Amounts</Label>
                    <div className="space-y-2">
                      {participants.map((participant, index) => (
                        <div
                          key={participant.id}
                          className="flex items-center gap-2"
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={participant.avatar} />
                            <AvatarFallback>
                              {participant.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm flex-grow">
                            {participant.name}
                          </span>
                          <Input
                            className="w-24"
                            placeholder="0.00"
                            type="number"
                            min="0"
                            step="0.01"
                            value={customSplits[participant.id] || ""}
                            onChange={(e) => {
                              setCustomSplits({
                                ...customSplits,
                                [participant.id]: e.target.value,
                              });
                            }}
                            disabled={
                              index === participants.length - 1 &&
                              participants.length > 1
                            }
                          />
                          {index === participants.length - 1 &&
                            participants.length > 1 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-xs text-muted-foreground">
                                      Auto-calculated
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      This amount is automatically calculated
                                      based on the other splits
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  type="button"
                  onClick={handleAddExpense}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Expense
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Bill Summary</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Title</p>
                    <p className="font-medium">Dinner at Luigi's</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">June 15, 2023</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Amount
                    </p>
                    <p className="font-medium">
                      ${calculateTotalAmount().toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Participants
                    </p>
                    <p className="font-medium">{participants.length}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">Expenses</h4>
                  {expenses.length > 0 ? (
                    <div className="space-y-2">
                      {expenses.map((expense) => (
                        <div
                          key={expense.id}
                          className="flex justify-between items-center p-2 bg-muted rounded-md"
                        >
                          <span>{expense.name}</span>
                          <span>${expense.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No expenses added
                    </p>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">Participants</h4>
                  <div className="space-y-2">
                    {participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center gap-2"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={participant.avatar} />
                          <AvatarFallback>
                            {participant.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{participant.name}</span>
                        <Badge variant="outline" className="text-xs ml-auto">
                          {participant.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">Share This Bill</h4>
                  <Alert>
                    <div className="flex justify-between items-center">
                      <div>
                        <AlertTitle>Invitation Code</AlertTitle>
                        <AlertDescription className="font-mono">
                          {inviteCode}
                        </AlertDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={regenerateInviteCode}
                        >
                          Regenerate
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={copyInviteCode}
                        >
                          <Copy className="h-4 w-4 mr-2" /> Copy
                        </Button>
                      </div>
                    </div>
                  </Alert>

                  <div className="flex gap-2 mt-4">
                    <Button type="button" variant="outline" className="flex-1">
                      <Mail className="h-4 w-4 mr-2" /> Email Invitations
                    </Button>
                    <Button type="button" variant="outline" className="flex-1">
                      <Users className="h-4 w-4 mr-2" /> Add More Participants
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        {step > 1 ? (
          <Button type="button" variant="outline" onClick={handlePreviousStep}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        ) : (
          <div></div>
        )}

        {step < 3 ? (
          <Button type="button" onClick={handleNextStep}>
            Next <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button type="submit" onClick={handleSubmit(onSubmit)}>
            <Check className="h-4 w-4 mr-2" /> Create Bill
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default CreateBillForm;
