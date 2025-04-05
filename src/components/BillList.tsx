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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MoreHorizontal,
  Search,
  Filter,
  ArrowUpDown,
  Archive,
  Edit,
  Eye,
  Trash2,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

interface Bill {
  id: string;
  title: string;
  totalAmount: number;
  participants: number;
  dateCreated: string;
  status: "pending" | "paid" | "partially_paid";
  isOwner: boolean;
  userType: "guest" | "standard" | "premium";
}

interface BillListProps {
  bills?: Bill[];
  userType?: "guest" | "standard" | "premium";
  isArchived?: boolean;
}

const BillList: React.FC<BillListProps> = ({
  bills = mockBills,
  userType = "standard",
  isArchived = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [filterStatus, setFilterStatus] = useState("all");
  const [activeTab, setActiveTab] = useState("all");

  // Filter bills based on search term, filter status, and active tab
  const filteredBills = bills.filter((bill) => {
    const matchesSearch = bill.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || bill.status === filterStatus;
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "owned" && bill.isOwner) ||
      (activeTab === "shared" && !bill.isOwner);

    return matchesSearch && matchesStatus && matchesTab;
  });

  // Sort bills based on sort criteria
  const sortedBills = [...filteredBills].sort((a, b) => {
    if (sortBy === "date") {
      return (
        new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
      );
    } else if (sortBy === "amount") {
      return b.totalAmount - a.totalAmount;
    } else if (sortBy === "title") {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500";
      case "partially_paid":
        return "bg-yellow-500";
      case "pending":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "Paid";
      case "partially_paid":
        return "Partially Paid";
      case "pending":
        return "Pending";
      default:
        return "Unknown";
    }
  };

  const canEdit = (bill: Bill) => {
    return bill.isOwner || userType === "premium" || userType === "standard";
  };

  const canDelete = (bill: Bill) => {
    return bill.isOwner || userType === "premium";
  };

  return (
    <div className="w-full bg-background p-4 rounded-lg">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {isArchived ? "Archived Bills" : "Active Bills"}
          </h2>
          {!isArchived && userType !== "guest" && (
            <Button variant="default">Create New Bill</Button>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bills..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partially_paid">Partially Paid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date (Newest)</SelectItem>
                  <SelectItem value="amount">Amount (Highest)</SelectItem>
                  <SelectItem value="title">Title (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {!isArchived && (
          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Bills</TabsTrigger>
              <TabsTrigger value="owned">Bills I Own</TabsTrigger>
              <TabsTrigger value="shared">Shared With Me</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {sortedBills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No bills found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {isArchived
                ? "You don't have any archived bills yet."
                : searchTerm
                  ? "No bills match your search criteria."
                  : "You don't have any bills yet. Create one to get started!"}
            </p>
            {!isArchived && userType !== "guest" && (
              <Button className="mt-4" variant="outline">
                Create Your First Bill
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedBills.map((bill) => (
              <Card key={bill.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{bill.title}</CardTitle>
                      <CardDescription className="mt-1">
                        Created on{" "}
                        {new Date(bill.dateCreated).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        {canEdit(bill) && (
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" /> Edit Bill
                          </DropdownMenuItem>
                        )}
                        {!isArchived && (
                          <DropdownMenuItem>
                            <Archive className="mr-2 h-4 w-4" /> Archive
                          </DropdownMenuItem>
                        )}
                        {canDelete(bill) && (
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">
                      {bill.participants}{" "}
                      {bill.participants === 1 ? "person" : "people"}
                    </span>
                    <Badge
                      variant={bill.status === "paid" ? "default" : "outline"}
                      className="capitalize"
                    >
                      {getStatusText(bill.status)}
                    </Badge>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Amount</span>
                      <span className="text-lg font-bold">
                        ${bill.totalAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full ${getStatusColor(bill.status)}`}
                        style={{
                          width:
                            bill.status === "paid"
                              ? "100%"
                              : bill.status === "partially_paid"
                                ? "50%"
                                : "0%",
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
                <Separator />
                <CardFooter className="pt-4 pb-4">
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Mock data for demonstration
const mockBills: Bill[] = [
  {
    id: "1",
    title: "Dinner at Italian Restaurant",
    totalAmount: 120.5,
    participants: 3,
    dateCreated: "2023-06-15",
    status: "pending",
    isOwner: true,
    userType: "standard",
  },
  {
    id: "2",
    title: "Apartment Rent Split",
    totalAmount: 1500.0,
    participants: 2,
    dateCreated: "2023-06-10",
    status: "partially_paid",
    isOwner: false,
    userType: "standard",
  },
  {
    id: "3",
    title: "Road Trip Expenses",
    totalAmount: 350.75,
    participants: 4,
    dateCreated: "2023-06-05",
    status: "paid",
    isOwner: true,
    userType: "standard",
  },
  {
    id: "4",
    title: "Grocery Shopping",
    totalAmount: 85.2,
    participants: 2,
    dateCreated: "2023-06-01",
    status: "pending",
    isOwner: false,
    userType: "standard",
  },
  {
    id: "5",
    title: "Movie Night",
    totalAmount: 45.0,
    participants: 3,
    dateCreated: "2023-05-28",
    status: "paid",
    isOwner: true,
    userType: "standard",
  },
  {
    id: "6",
    title: "Utility Bills",
    totalAmount: 210.3,
    participants: 3,
    dateCreated: "2023-05-20",
    status: "partially_paid",
    isOwner: true,
    userType: "standard",
  },
];

export default BillList;
