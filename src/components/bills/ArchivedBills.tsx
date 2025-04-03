import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useBill, Bill } from "@/contexts/BillContext";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertCircle,
  Archive,
  FileText,
  MoreVertical,
  Search,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ArchivedBills = () => {
  const { user } = useAuth();
  const { getArchivedBills, deleteBill, loading, error } = useBill();
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const archivedBills = getArchivedBills();

  // Filter bills based on search term
  const filteredBills = archivedBills.filter(
    (bill) =>
      bill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleDelete = async (billId: string) => {
    try {
      await deleteBill(billId);
      setConfirmDelete(null);
    } catch (error) {
      console.error("Failed to delete bill:", error);
    }
  };

  // Calculate total amount for a bill
  const calculateTotalAmount = (bill: Bill) => {
    return bill.expenses.reduce((total, expense) => total + expense.amount, 0);
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

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search archived bills..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
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
              <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? "No archived bills found" : "No archived bills"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm
                  ? `No archived bills matching "${searchTerm}"`
                  : "You haven't archived any bills yet"}
              </p>
              <Link to="/dashboard/bills">
                <Button variant="outline">View Active Bills</Button>
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
                          <Link to={`/dashboard/manage-bill/${bill.id}`}>
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                          </Link>
                          <DropdownMenuSeparator />
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
                      <Badge
                        variant="outline"
                        className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                      >
                        <Archive className="mr-1 h-3 w-3" /> Archived
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
                            Archived Date
                          </p>
                          <p className="text-lg font-medium">
                            {formatDate(bill.updatedAt)}
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

      {/* Confirm delete dialog */}
      <Dialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bill</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this archived bill? This action
              cannot be undone.
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

export default ArchivedBills;
