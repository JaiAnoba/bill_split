import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

// Types
export type BillStatus = "active" | "pending" | "settled" | "archived";
export type SplitType = "equal" | "custom" | "percentage";

export interface Participant {
  id: string;
  name: string;
  email?: string;
  isRegistered: boolean;
  owes: number;
  paid: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string; // participant id
  date: string;
  splitType: SplitType;
  splits: {
    participantId: string;
    amount: number;
  }[];
}

export interface Bill {
  id: string;
  name: string;
  description: string;
  createdBy: string; // user id
  createdAt: string;
  updatedAt: string;
  status: BillStatus;
  participants: Participant[];
  expenses: Expense[];
  invitationCode: string;
  isExclusive: boolean; // Whether the bill is exclusive to the creator
}

interface BillContextType {
  bills: Bill[];
  loading: boolean;
  error: string | null;
  createBill: (billData: Partial<Bill>) => Promise<Bill>;
  updateBill: (id: string, billData: Partial<Bill>) => Promise<Bill>;
  archiveBill: (id: string) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
  addExpense: (billId: string, expense: Partial<Expense>) => Promise<Expense>;
  updateExpense: (
    billId: string,
    expenseId: string,
    expenseData: Partial<Expense>,
  ) => Promise<Expense>;
  deleteExpense: (billId: string, expenseId: string) => Promise<void>;
  addParticipant: (
    billId: string,
    participant: Partial<Participant>,
  ) => Promise<Participant>;
  removeParticipant: (billId: string, participantId: string) => Promise<void>;
  getBillById: (id: string) => Bill | undefined;
  getActiveBills: () => Bill[];
  getArchivedBills: () => Bill[];
  getPendingInvitations: () => Bill[];
  acceptInvitation: (invitationCode: string) => Promise<Bill>;
  generateInvitationCode: () => string;
}

const BillContext = createContext<BillContextType | undefined>(undefined);

// Mock data for demonstration
const MOCK_BILLS: Bill[] = [
  {
    id: "bill_1",
    name: "Weekend Trip",
    description: "Expenses for our weekend trip to the mountains",
    createdBy: "1", // John Doe
    createdAt: "2023-06-15T10:30:00Z",
    updatedAt: "2023-06-18T14:20:00Z",
    status: "active",
    participants: [
      {
        id: "part_1",
        name: "John Doe",
        email: "john@example.com",
        isRegistered: true,
        owes: 0,
        paid: 250,
      },
      {
        id: "part_2",
        name: "Jane Smith",
        email: "jane@example.com",
        isRegistered: true,
        owes: 125,
        paid: 0,
      },
      {
        id: "part_3",
        name: "Mike Johnson",
        email: "mike@example.com",
        isRegistered: false,
        owes: 125,
        paid: 0,
      },
    ],
    expenses: [
      {
        id: "exp_1",
        description: "Cabin Rental",
        amount: 150,
        paidBy: "part_1",
        date: "2023-06-15T12:00:00Z",
        splitType: "equal",
        splits: [
          { participantId: "part_1", amount: 50 },
          { participantId: "part_2", amount: 50 },
          { participantId: "part_3", amount: 50 },
        ],
      },
      {
        id: "exp_2",
        description: "Groceries",
        amount: 100,
        paidBy: "part_1",
        date: "2023-06-16T09:00:00Z",
        splitType: "equal",
        splits: [
          { participantId: "part_1", amount: 33.33 },
          { participantId: "part_2", amount: 33.33 },
          { participantId: "part_3", amount: 33.34 },
        ],
      },
    ],
    invitationCode: "TRIP2023",
    isExclusive: false,
  },
  {
    id: "bill_2",
    name: "Dinner Party",
    description: "Monthly dinner party expenses",
    createdBy: "1", // John Doe
    createdAt: "2023-07-05T18:00:00Z",
    updatedAt: "2023-07-05T22:30:00Z",
    status: "active",
    participants: [
      {
        id: "part_1",
        name: "John Doe",
        email: "john@example.com",
        isRegistered: true,
        owes: 0,
        paid: 120,
      },
      {
        id: "part_4",
        name: "Sarah Williams",
        email: "sarah@example.com",
        isRegistered: true,
        owes: 60,
        paid: 0,
      },
    ],
    expenses: [
      {
        id: "exp_3",
        description: "Food and Drinks",
        amount: 120,
        paidBy: "part_1",
        date: "2023-07-05T19:00:00Z",
        splitType: "equal",
        splits: [
          { participantId: "part_1", amount: 60 },
          { participantId: "part_4", amount: 60 },
        ],
      },
    ],
    invitationCode: "DINNER07",
    isExclusive: false,
  },
  {
    id: "bill_3",
    name: "Office Supplies",
    description: "Shared office supplies for the team",
    createdBy: "2", // Jane Smith
    createdAt: "2023-05-10T09:00:00Z",
    updatedAt: "2023-05-20T15:45:00Z",
    status: "archived",
    participants: [
      {
        id: "part_1",
        name: "John Doe",
        email: "john@example.com",
        isRegistered: true,
        owes: 25,
        paid: 0,
      },
      {
        id: "part_2",
        name: "Jane Smith",
        email: "jane@example.com",
        isRegistered: true,
        owes: 0,
        paid: 75,
      },
      {
        id: "part_5",
        name: "Alex Brown",
        email: "alex@example.com",
        isRegistered: true,
        owes: 25,
        paid: 0,
      },
    ],
    expenses: [
      {
        id: "exp_4",
        description: "Printer Paper",
        amount: 30,
        paidBy: "part_2",
        date: "2023-05-10T10:00:00Z",
        splitType: "equal",
        splits: [
          { participantId: "part_1", amount: 10 },
          { participantId: "part_2", amount: 10 },
          { participantId: "part_5", amount: 10 },
        ],
      },
      {
        id: "exp_5",
        description: "Ink Cartridges",
        amount: 45,
        paidBy: "part_2",
        date: "2023-05-15T14:30:00Z",
        splitType: "equal",
        splits: [
          { participantId: "part_1", amount: 15 },
          { participantId: "part_2", amount: 15 },
          { participantId: "part_5", amount: 15 },
        ],
      },
    ],
    invitationCode: "OFFICE05",
    isExclusive: false,
  },
];

export const BillProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load bills on mount and when user changes
  useEffect(() => {
    const loadBills = async () => {
      setLoading(true);
      try {
        // In a real app, this would be an API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Filter bills based on user
        if (user) {
          const userBills = MOCK_BILLS.filter((bill) => {
            // Bills created by the user
            if (bill.createdBy === user.id) return true;

            // Bills where user is a participant
            return bill.participants.some((p) => p.email === user.email);
          });

          setBills(userBills);
        } else {
          setBills([]);
        }

        setError(null);
      } catch (err) {
        console.error("Failed to load bills:", err);
        setError("Failed to load bills. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadBills();
  }, [user]);

  // Get bill by ID
  const getBillById = (id: string) => {
    return bills.find((bill) => bill.id === id);
  };

  // Get active bills
  const getActiveBills = () => {
    return bills.filter((bill) => bill.status === "active");
  };

  // Get archived bills
  const getArchivedBills = () => {
    return bills.filter((bill) => bill.status === "archived");
  };

  // Get pending invitations
  const getPendingInvitations = () => {
    return bills.filter((bill) => bill.status === "pending");
  };

  // Generate a random invitation code
  const generateInvitationCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Create a new bill
  const createBill = async (billData: Partial<Bill>): Promise<Bill> => {
    if (!user) throw new Error("You must be logged in to create a bill");

    // Check if user has reached their bill limit
    if (user.tier !== "premium" && user.billsCreated >= user.maxBills) {
      throw new Error(
        `You have reached your limit of ${user.maxBills} bills. Please upgrade to create more.`,
      );
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newBill: Bill = {
        id: `bill_${Date.now()}`,
        name: billData.name || "Untitled Bill",
        description: billData.description || "",
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "active",
        participants: [
          {
            id: `part_${Date.now()}`,
            name: user.name,
            email: user.email,
            isRegistered: true,
            owes: 0,
            paid: 0,
          },
          ...(billData.participants || []),
        ],
        expenses: billData.expenses || [],
        invitationCode: billData.invitationCode || generateInvitationCode(),
        isExclusive: billData.isExclusive || false,
      };

      setBills((prevBills) => [...prevBills, newBill]);

      // Update user's bill count
      if (user.tier !== "premium") {
        // In a real app, this would update the user in the database
      }

      return newBill;
    } catch (err) {
      console.error("Failed to create bill:", err);
      setError("Failed to create bill. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing bill
  const updateBill = async (
    id: string,
    billData: Partial<Bill>,
  ): Promise<Bill> => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const billIndex = bills.findIndex((bill) => bill.id === id);
      if (billIndex === -1) throw new Error("Bill not found");

      const updatedBill = {
        ...bills[billIndex],
        ...billData,
        updatedAt: new Date().toISOString(),
      };

      const newBills = [...bills];
      newBills[billIndex] = updatedBill;
      setBills(newBills);

      return updatedBill;
    } catch (err) {
      console.error("Failed to update bill:", err);
      setError("Failed to update bill. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Archive a bill
  const archiveBill = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const billIndex = bills.findIndex((bill) => bill.id === id);
      if (billIndex === -1) throw new Error("Bill not found");

      const updatedBill = {
        ...bills[billIndex],
        status: "archived" as BillStatus,
        updatedAt: new Date().toISOString(),
      };

      const newBills = [...bills];
      newBills[billIndex] = updatedBill;
      setBills(newBills);
    } catch (err) {
      console.error("Failed to archive bill:", err);
      setError("Failed to archive bill. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete a bill
  const deleteBill = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setBills((prevBills) => prevBills.filter((bill) => bill.id !== id));
    } catch (err) {
      console.error("Failed to delete bill:", err);
      setError("Failed to delete bill. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Add an expense to a bill
  const addExpense = async (
    billId: string,
    expenseData: Partial<Expense>,
  ): Promise<Expense> => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const billIndex = bills.findIndex((bill) => bill.id === billId);
      if (billIndex === -1) throw new Error("Bill not found");

      const newExpense: Expense = {
        id: `exp_${Date.now()}`,
        description: expenseData.description || "Untitled Expense",
        amount: expenseData.amount || 0,
        paidBy: expenseData.paidBy || "",
        date: expenseData.date || new Date().toISOString(),
        splitType: expenseData.splitType || "equal",
        splits: expenseData.splits || [],
      };

      // Update bill with new expense
      const updatedBill = {
        ...bills[billIndex],
        expenses: [...bills[billIndex].expenses, newExpense],
        updatedAt: new Date().toISOString(),
      };

      // Recalculate participant balances
      updatedBill.participants = recalculateBalances(updatedBill);

      const newBills = [...bills];
      newBills[billIndex] = updatedBill;
      setBills(newBills);

      return newExpense;
    } catch (err) {
      console.error("Failed to add expense:", err);
      setError("Failed to add expense. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update an expense
  const updateExpense = async (
    billId: string,
    expenseId: string,
    expenseData: Partial<Expense>,
  ): Promise<Expense> => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const billIndex = bills.findIndex((bill) => bill.id === billId);
      if (billIndex === -1) throw new Error("Bill not found");

      const expenseIndex = bills[billIndex].expenses.findIndex(
        (exp) => exp.id === expenseId,
      );
      if (expenseIndex === -1) throw new Error("Expense not found");

      const updatedExpense = {
        ...bills[billIndex].expenses[expenseIndex],
        ...expenseData,
      };

      const updatedExpenses = [...bills[billIndex].expenses];
      updatedExpenses[expenseIndex] = updatedExpense;

      // Update bill with modified expense
      const updatedBill = {
        ...bills[billIndex],
        expenses: updatedExpenses,
        updatedAt: new Date().toISOString(),
      };

      // Recalculate participant balances
      updatedBill.participants = recalculateBalances(updatedBill);

      const newBills = [...bills];
      newBills[billIndex] = updatedBill;
      setBills(newBills);

      return updatedExpense;
    } catch (err) {
      console.error("Failed to update expense:", err);
      setError("Failed to update expense. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete an expense
  const deleteExpense = async (
    billId: string,
    expenseId: string,
  ): Promise<void> => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const billIndex = bills.findIndex((bill) => bill.id === billId);
      if (billIndex === -1) throw new Error("Bill not found");

      // Update bill with expense removed
      const updatedBill = {
        ...bills[billIndex],
        expenses: bills[billIndex].expenses.filter(
          (exp) => exp.id !== expenseId,
        ),
        updatedAt: new Date().toISOString(),
      };

      // Recalculate participant balances
      updatedBill.participants = recalculateBalances(updatedBill);

      const newBills = [...bills];
      newBills[billIndex] = updatedBill;
      setBills(newBills);
    } catch (err) {
      console.error("Failed to delete expense:", err);
      setError("Failed to delete expense. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Add a participant to a bill
  const addParticipant = async (
    billId: string,
    participantData: Partial<Participant>,
  ): Promise<Participant> => {
    if (!user) throw new Error("You must be logged in to add a participant");

    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const billIndex = bills.findIndex((bill) => bill.id === billId);
      if (billIndex === -1) throw new Error("Bill not found");

      // Check if user has reached their participant limit
      if (
        user.tier !== "premium" &&
        bills[billIndex].participants.length >= user.maxParticipants
      ) {
        throw new Error(
          `You have reached your limit of ${user.maxParticipants} participants. Please upgrade to add more.`,
        );
      }

      const newParticipant: Participant = {
        id: `part_${Date.now()}`,
        name: participantData.name || "Unnamed Participant",
        email: participantData.email,
        isRegistered: participantData.isRegistered || false,
        owes: 0,
        paid: 0,
      };

      // Update bill with new participant
      const updatedBill = {
        ...bills[billIndex],
        participants: [...bills[billIndex].participants, newParticipant],
        updatedAt: new Date().toISOString(),
      };

      const newBills = [...bills];
      newBills[billIndex] = updatedBill;
      setBills(newBills);

      return newParticipant;
    } catch (err) {
      console.error("Failed to add participant:", err);
      setError("Failed to add participant. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Remove a participant from a bill
  const removeParticipant = async (
    billId: string,
    participantId: string,
  ): Promise<void> => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const billIndex = bills.findIndex((bill) => bill.id === billId);
      if (billIndex === -1) throw new Error("Bill not found");

      // Check if participant has expenses or is owed money
      const hasExpenses = bills[billIndex].expenses.some(
        (exp) => exp.paidBy === participantId,
      );
      const participant = bills[billIndex].participants.find(
        (p) => p.id === participantId,
      );

      if (hasExpenses) {
        throw new Error(
          "Cannot remove a participant who has paid for expenses. Reassign the expenses first.",
        );
      }

      if (participant && participant.owes > 0) {
        throw new Error(
          "Cannot remove a participant who still owes money. Settle up first.",
        );
      }

      // Update bill with participant removed
      const updatedBill = {
        ...bills[billIndex],
        participants: bills[billIndex].participants.filter(
          (p) => p.id !== participantId,
        ),
        updatedAt: new Date().toISOString(),
      };

      // Remove participant from expense splits
      updatedBill.expenses = updatedBill.expenses.map((exp) => ({
        ...exp,
        splits: exp.splits.filter(
          (split) => split.participantId !== participantId,
        ),
      }));

      const newBills = [...bills];
      newBills[billIndex] = updatedBill;
      setBills(newBills);
    } catch (err) {
      console.error("Failed to remove participant:", err);
      setError("Failed to remove participant. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Accept an invitation to join a bill
  const acceptInvitation = async (invitationCode: string): Promise<Bill> => {
    if (!user) throw new Error("You must be logged in to accept an invitation");

    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In a real app, this would be an API call to find the bill by invitation code
      const bill = MOCK_BILLS.find((b) => b.invitationCode === invitationCode);
      if (!bill) throw new Error("Invalid invitation code");

      // Check if user is already a participant
      const isParticipant = bill.participants.some(
        (p) => p.email === user.email,
      );
      if (isParticipant)
        throw new Error("You are already a participant in this bill");

      // Add user as a participant
      const newParticipant: Participant = {
        id: `part_${Date.now()}`,
        name: user.name,
        email: user.email,
        isRegistered: true,
        owes: 0,
        paid: 0,
      };

      const updatedBill = {
        ...bill,
        participants: [...bill.participants, newParticipant],
        updatedAt: new Date().toISOString(),
      };

      // Add bill to user's bills if not already there
      const billExists = bills.some((b) => b.id === bill.id);
      if (!billExists) {
        setBills((prevBills) => [...prevBills, updatedBill]);
      } else {
        // Update existing bill
        setBills((prevBills) =>
          prevBills.map((b) => (b.id === bill.id ? updatedBill : b)),
        );
      }

      return updatedBill;
    } catch (err) {
      console.error("Failed to accept invitation:", err);
      setError("Failed to accept invitation. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Helper function to recalculate balances for all participants in a bill
  const recalculateBalances = (bill: Bill): Participant[] => {
    const participants = [...bill.participants];

    // Reset all balances
    participants.forEach((p) => {
      p.owes = 0;
      p.paid = 0;
    });

    // Calculate what each person paid and owes
    bill.expenses.forEach((expense) => {
      // Add to payer's paid amount
      const payer = participants.find((p) => p.id === expense.paidBy);
      if (payer) {
        payer.paid += expense.amount;
      }

      // Add to each participant's owed amount
      expense.splits.forEach((split) => {
        const participant = participants.find(
          (p) => p.id === split.participantId,
        );
        if (participant) {
          participant.owes += split.amount;
        }
      });
    });

    return participants;
  };

  return (
    <BillContext.Provider
      value={{
        bills,
        loading,
        error,
        createBill,
        updateBill,
        archiveBill,
        deleteBill,
        addExpense,
        updateExpense,
        deleteExpense,
        addParticipant,
        removeParticipant,
        getBillById,
        getActiveBills,
        getArchivedBills,
        getPendingInvitations,
        acceptInvitation,
        generateInvitationCode,
      }}
    >
      {children}
    </BillContext.Provider>
  );
};

// Using named function declaration for better Fast Refresh compatibility
export function useBill() {
  const context = useContext(BillContext);
  if (context === undefined) {
    throw new Error("useBill must be used within a BillProvider");
  }
  return context;
}
