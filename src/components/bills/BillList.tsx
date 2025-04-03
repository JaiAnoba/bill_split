import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useBill, Bill, BillStatus } from "@/contexts/BillContext";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Archive,
  Copy,
  Edit,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  Users,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";

const BillList = () => {
  const { user } = useAuth();
  const { getActiveBills, archiveBill, deleteBill, loading, error } = useBill();
  const [searchTerm, setSearchTerm] = useState("");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const activeBills = getActiveBills();

  // Filter bills based on search term
  const filteredBills = activeBills.filter(
    (bill) =>
      bill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleArchive = async (billId: string) => {
    try {
      await archiveBill(billId);
    } catch (error) {
      console.error("Failed to archive bill:", error);
    }
  };

  const handleDelete = async (billId: string) => {
    try {
      await deleteBill(billId);
      setConfirmDelete(null);
    } catch (error) {
      console.error("Failed to delete bill:", error);
    }
  };

  const handleCopyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    // In a real app, you would show a toast notification
    alert(`Invitation code ${code} copied to clipboard!`);
  };

  const getBillStatusBadge = (status: BillStatus) => {
    switch (status) {
      case "active":
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
          >
            <CheckCircle2 className="mr-1 h-3 w-3" /> Active
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
          >
            <Clock className="mr-1 h-3 w-3" /> Pending
          </Badge>
        );
      case "settled":
        return (
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
          >
            <CheckCircle2 className="mr-1 h-3 w-3" /> Settled
          </Badge>
        );
      case "archived":
        return (
          <Badge
            variant="outline"
            className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
          >
            <Archive className="mr-1 h-3 w-3" /> Archived
          </Badge>
        );
      default:
        return null;
    }
  };

  // Calculate total amount for a bill
  const calculateTotalAmount = (bill: Bill) => {
    return bill.expenses.reduce((total, expense) => total + expense.amount, 0);
  };

  // Calculate what the current user owes in a bill
  const calculateUserOwes = (bill: Bill) => {
    if (!user) return 0;
    const participant = bill.participants.find((p) => p.email === user.email);
    return participant ? participant.owes - participant.paid : 0;
  };

  return (
    <div className="space-y-6">
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bills..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Link to="/dashboard/create-bill">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create New Bill
          </Button>
        </Link>
      </div>

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
          {/* No bills state */}
          {filteredBills.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? "No bills found" : "No bills yet"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm
                  ? `No bills matching "${searchTerm}"`
                  : "Create your first bill to start tracking expenses"}
              </p>
              <Link to="/dashboard/create-bill">
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Create New Bill
                </Button>
              </Link>
            </div>
          )}

          {/* Bills list */}
          {filteredBills.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredBills.map((bill) => (
                <Card key={bill.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{bill.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {bill.description}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedBill(bill);
                              setShowInviteDialog(true);
                            }}
                          >
                            <Users className="mr-2 h-4 w-4" />
                            Invite People
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleCopyInviteCode(bill.invitationCode)
                            }
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Invite Code
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <Link to={`/dashboard/manage-bill/${bill.id}`}>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Bill
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem
                            onClick={() => handleArchive(bill.id)}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Archive Bill
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setConfirmDelete(bill.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Bill
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {getBillStatusBadge(bill.status)}
                      {bill.isExclusive && (
                        <Badge
                          variant="outline"
                          className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100"
                        >
                          Private
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="space-y-4">
                      {/* Bill summary */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Total Amount
                          </p>
                          <p className="text-lg font-medium">
                            ${calculateTotalAmount(bill).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {calculateUserOwes(bill) > 0
                              ? "You Owe"
                              : "You're Owed"}
                          </p>
                          <p
                            className={cn(
                              "text-lg font-medium",
                              calculateUserOwes(bill) > 0
                                ? "text-red-600 dark:text-red-400"
                                : calculateUserOwes(bill) < 0
                                  ? "text-green-600 dark:text-green-400"
                                  : "",
                            )}
                          >
                            ${Math.abs(calculateUserOwes(bill)).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Participants */}
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Participants ({bill.participants.length})
                        </p>
                        <div className="flex -space-x-2 overflow-hidden">
                          {bill.participants
                            .slice(0, 5)
                            .map((participant, index) => (
                              <Avatar
                                key={participant.id}
                                className="border-2 border-background"
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
                          {bill.participants.length > 5 && (
                            <Avatar className="border-2 border-background">
                              <AvatarFallback>
                                +{bill.participants.length - 5}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Link
                      to={`/dashboard/manage-bill/${bill.id}`}
                      className="w-full"
                    >
                      <Button variant="outline" className="w-full">
                        View Details
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Invite dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite People to Bill</DialogTitle>
            <DialogDescription>
              Share this invitation code with others to join this bill.
            </DialogDescription>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-code">Invitation Code</Label>
                <div className="flex">
                  <Input
                    id="invite-code"
                    value={selectedBill.invitationCode}
                    readOnly
                    className="rounded-r-none"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="rounded-l-none"
                    onClick={() =>
                      handleCopyInviteCode(selectedBill.invitationCode)
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Current Participants</Label>
                <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                  {selectedBill.participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.name}`}
                            alt={participant.name}
                          />
                          <AvatarFallback>
                            {participant.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {participant.name}
                          </p>
                          {participant.email && (
                            <p className="text-xs text-muted-foreground">
                              {participant.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          participant.isRegistered
                            ? "bg-green-100 text-green-800"
                            : ""
                        }
                      >
                        {participant.isRegistered ? "Registered" : "Guest"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm delete dialog */}
      <Dialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bill</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this bill? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BillList;
