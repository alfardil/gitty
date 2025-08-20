"use client";

import {
  useSubscriptionSeats,
  useAssignSeat,
  useUnassignSeat,
} from "@/lib/hooks/api/useSubscriptionSeats";
import { useInviteCodes } from "@/lib/hooks/api/useInviteCodes";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/neo/spinner";
import { toast } from "sonner";
import { User, Users, X, Mail, Copy } from "lucide-react";

interface SubscriptionSeatsProps {
  selectedEnterprise?: string;
}

export function SubscriptionSeats({
  selectedEnterprise,
}: SubscriptionSeatsProps) {
  const {
    data: seats,
    isLoading,
    error,
  } = useSubscriptionSeats(selectedEnterprise);
  const { data: inviteCodes, isLoading: inviteCodesLoading } = useInviteCodes();
  const assignSeat = useAssignSeat();
  const unassignSeat = useUnassignSeat();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Seats
          </CardTitle>
          <CardDescription>Manage your subscription seats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Seats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500 py-4">
            Failed to load subscription seats
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!seats || seats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Seats
          </CardTitle>
          <CardDescription>No subscription seats found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            You don&apos;t have any subscription seats yet.
          </div>
        </CardContent>
      </Card>
    );
  }

  const availableSeats = seats.filter((seat) => seat.status === "available");
  const assignedSeats = seats.filter((seat) => seat.status === "assigned");

  const handleUnassignSeat = async (seatId: string) => {
    try {
      await unassignSeat.mutateAsync(seatId);
      toast.success("Seat unassigned successfully");
    } catch (error) {
      toast.error("Failed to unassign seat");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Seats
        </CardTitle>
        <CardDescription>
          Manage your subscription seats ({assignedSeats.length}/{seats.length}{" "}
          assigned)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Assigned Seats */}
        {assignedSeats.length > 0 && (
          <div>
            <h3 className="font-medium mb-3">Assigned Seats</h3>
            <div className="space-y-3">
              {assignedSeats.map((seat) => (
                <div
                  key={seat.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {seat.assignedUser?.firstName &&
                        seat.assignedUser?.lastName
                          ? `${seat.assignedUser.firstName} ${seat.assignedUser.lastName}`
                          : seat.assignedUser?.githubUsername ||
                            seat.assignedUser?.email ||
                            "Unknown User"}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {seat.assignedUser?.email || "No email"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Seat {seat.seatNumber}</Badge>
                    <Button
                      size="sm"
                      onClick={() => handleUnassignSeat(seat.id)}
                      disabled={unassignSeat.isPending}
                      className="bg-red-800 hover:bg-red-900 text-white border-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Seats */}
        {availableSeats.length > 0 && (
          <div>
            <h3 className="font-medium mb-3">Available Seats</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Share these invite codes with your team members to give them Pro
              access
            </p>
            <div className="space-y-3">
              {availableSeats.map((seat) => (
                <div
                  key={seat.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center">
                      <Mail className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <div className="font-medium">Seat {seat.seatNumber}</div>
                      <div className="text-sm text-muted-foreground">
                        Available for assignment
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono">
                      {seat.inviteCode || "No invite code"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (seat.inviteCode) {
                          navigator.clipboard.writeText(seat.inviteCode);
                          toast.success("Invite code copied to clipboard!");
                        }
                      }}
                      disabled={!seat.inviteCode}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
