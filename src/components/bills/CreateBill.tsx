import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBill } from "@/contexts/BillContext";
import { useAuth } from "@/contexts/AuthContext";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  Copy,
  Info,
  Lock,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const CreateBill = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createBill, generateInvitationCode, loading, error } = useBill();

  const [billName, setBillName] = useState("");
  const [description, setDescription] = useState("");
  const [isExclusive, setIsExclusive] = useState(false);
  const [participants, setParticipants] = useState<
    { id: string; name: string; email: string; isRegistered: boolean }[]
  >([]);
  const [newParticipantName, setNewParticipantName] = useState("");
  const [newParticipantEmail, setNewParticipantEmail] = useState("");
  const [invitationCode, setInvitationCode] = useState(
    generateInvitationCode(),
  );
  const [formError, setFormError] = useState<string | null>(null);

  // Check if user has reached their bill limit
  const hasReachedBillLimit =
    user?.tier === "standard" && user?.billsCreated >= user?.maxBills;

  // Check if user has reached their participant limit
  const hasReachedParticipantLimit =
    user?.tier === "standard" &&
    participants.length >= (user?.maxParticipants || 0) - 1; // -1 because the user is also a participant

  const handleAddParticipant = () => {
    if (!newParticipantName.trim()) {
      setFormError("Participant name is required");
      return;
    }

    if (hasReachedParticipantLimit) {
      setFormError(
        `You can only add up to ${user?.maxParticipants - 1} participants with your Standard plan. Upgrade to Premium for unlimited participants.`,
      );
      return;
    }

    const newParticipant = {
      id: `temp_${Date.now()}`,
      name: newParticipantName.trim(),
      email: newParticipantEmail.trim(),
      isRegistered: false,
    };

    setParticipants([...participants, newParticipant]);
    setNewParticipantName("");
    setNewParticipantEmail("");
    setFormError(null);
  };

  const handleRemoveParticipant = (id: string) => {
    setParticipants(participants.filter((p) => p.id !== id));
  };

  const handleGenerateNewCode = () => {
    setInvitationCode(generateInvitationCode());
  };

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(invitationCode);
    // In a real app, you would show a toast notification
    alert(`Invitation code ${invitationCode} copied to clipboard!`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!billName.trim()) {
      setFormError("Bill name is required");
      return;
    }

    try {
      const newBill = await createBill({
        name: billName.trim(),
        description: description.trim(),
        invitationCode,
        isExclusive,
        participants: participants.map((p) => ({
          ...p,
          owes: 0,
          paid: 0,
        })),
      });

      navigate(`/dashboard/manage-bill/${newBill.id}`);
    } catch (err) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Failed to create bill. Please try again.");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Error messages */}
      {(error || formError) && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {formError || error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Create New Bill</CardTitle>
            <CardDescription>
              Create a new bill to track and split expenses with others.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bill details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bill-name">Bill Name</Label>
                <Input
                  id="bill-name"
                  placeholder="Weekend Trip, Dinner Party, etc."
                  value={billName}
                  onChange={(e) => setBillName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add details about this bill..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="exclusive-mode"
                  checked={isExclusive}
                  onCheckedChange={setIsExclusive}
                />
                <div className="grid gap-1.5">
                  <Label
                    htmlFor="exclusive-mode"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Private Bill
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Keep this bill exclusive to you without sharing it with
                    others.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Participants section - only show if not exclusive */}
            {!isExclusive && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Participants</h3>
                    <p className="text-sm text-muted-foreground">
                      Add people to split this bill with.
                    </p>
                  </div>
                  {user?.tier === "standard" && (
                    <Badge variant="outline">
                      {participants.length + 1}/{user.maxParticipants} People
                    </Badge>
                  )}
                </div>

                {/* Current participants */}
                {participants.length > 0 && (
                  <div className="border rounded-md p-3 space-y-3">
                    {participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center justify-between py-1"
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
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleRemoveParticipant(participant.id)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new participant */}
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="participant-name">Name</Label>
                      <Input
                        id="participant-name"
                        placeholder="Participant name"
                        value={newParticipantName}
                        onChange={(e) => setNewParticipantName(e.target.value)}
                        disabled={hasReachedParticipantLimit}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="participant-email">
                        Email (Optional)
                      </Label>
                      <Input
                        id="participant-email"
                        type="email"
                        placeholder="email@example.com"
                        value={newParticipantEmail}
                        onChange={(e) => setNewParticipantEmail(e.target.value)}
                        disabled={hasReachedParticipantLimit}
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleAddParticipant}
                    disabled={hasReachedParticipantLimit}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Participant
                  </Button>
                </div>

                <Separator />

                {/* Invitation code */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Invitation Code</h3>
                    <p className="text-sm text-muted-foreground">
                      Share this code with others to join this bill.
                    </p>
                  </div>

                  <div className="flex">
                    <Input
                      value={invitationCode}
                      readOnly
                      className="rounded-r-none font-mono"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-none border-l-0"
                            onClick={handleCopyInviteCode}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copy invitation code</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-l-none border-l-0"
                            onClick={handleGenerateNewCode}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="lucide lucide-refresh-cw"
                            >
                              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                              <path d="M21 3v5h-5" />
                              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                              <path d="M3 21v-5h5" />
                            </svg>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Generate new code</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            )}

            {/* Private bill notice */}
            {isExclusive && (
              <div className="bg-muted p-4 rounded-md flex items-start space-x-3">
                <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h4 className="font-medium">Private Bill</h4>
                  <p className="text-sm text-muted-foreground">
                    This bill will be exclusive to you. No participants will be
                    added, and no invitation code will be generated.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard/bills")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || hasReachedBillLimit}
              className="min-w-24"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                "Create Bill"
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Bill limit warning */}
        {hasReachedBillLimit && (
          <div className="mt-4 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 p-4 rounded-md flex items-start space-x-3">
            <Info className="h-5 w-5 mt-0.5" />
            <div>
              <h4 className="font-medium">Bill Limit Reached</h4>
              <p className="text-sm">
                You have reached your limit of {user?.maxBills} bills with your
                Standard plan. Upgrade to Premium for unlimited bills.
              </p>
              <Button
                type="button"
                className="mt-2 bg-amber-500 hover:bg-amber-600 text-white"
                onClick={() => navigate("/dashboard/upgrade")}
              >
                Upgrade to Premium
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default CreateBill;
