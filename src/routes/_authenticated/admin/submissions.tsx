import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import {
  getAllSubmissions,
  approveSubmission,
  rejectSubmission,
  deleteSubmission,
} from "@/lib/api/book-submissions.functions";
import { BookOpen, Check, X, Eye, Trash2, FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/submissions")({
  head: () => ({ meta: [{ title: "Book Submissions — Admin" }] }),
  component: AdminSubmissions,
});

type Submission = {
  id: string;
  user_id: string;
  title: string;
  author: string;
  description: string | null;
  cover_url: string | null;
  content_url: string;
  year: number | null;
  language: string;
  categories: string[];
  source: string;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    display_name: string;
    email: string;
  };
};

function AdminSubmissions() {
  const qc = useQueryClient();
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

  const { data: submissions = [], isLoading, error } = useQuery({
    queryKey: ["all-submissions"],
    queryFn: getAllSubmissions,
  });

  // Debug: log submissions and errors
  useEffect(() => {
    console.log("Submissions data:", submissions);
    console.log("Submissions error:", error);
  }, [submissions, error]);

  const handleAction = (submission: Submission, action: "approve" | "reject") => {
    setSelectedSubmission(submission);
    setActionType(action);
    setAdminNotes("");
    setShowActionModal(true);
  };

  const confirmAction = useMutation({
    mutationFn: async () => {
      if (!selectedSubmission || !actionType) return;
      if (actionType === "approve") {
        await approveSubmission(selectedSubmission.id, adminNotes || undefined);
      } else {
        await rejectSubmission(selectedSubmission.id, adminNotes || undefined);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-submissions"] });
      toast.success(`Submission ${actionType}d successfully`);
      setShowActionModal(false);
      setSelectedSubmission(null);
      setActionType(null);
      setAdminNotes("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleDelete = useMutation({
    mutationFn: async (id: string) => {
      await deleteSubmission(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-submissions"] });
      toast.success("Submission deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = submissions.filter((submission: Submission) => submission.status === "pending").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-1 tracking-tight">Book Submissions</h2>
        <p className="text-muted-foreground text-sm">
          {pendingCount > 0 ? `${pendingCount} pending review` : "No pending submissions"}
        </p>
      </div>

      {/* Submissions list */}
      {isLoading ? (
        <Card className="p-12 text-center">
          <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary/30 border-t-primary mb-3" />
          <p className="text-sm text-muted-foreground">Loading submissions...</p>
        </Card>
      ) : submissions.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium mb-1">No submissions yet</p>
          <p className="text-sm text-muted-foreground">Book submissions will appear here for review.</p>
          {error && (
            <p className="text-xs text-destructive mt-4">
              Error: {error.message}. Check console for details.
            </p>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission: Submission) => (
            <Card key={submission.id} className="p-5 bg-card/60 backdrop-blur border-border/60 hover:border-primary/40 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{submission.title}</h3>
                    {getStatusBadge(submission.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">by {submission.author}</p>
                  
                  {submission.description && (
                    <p className="text-sm text-muted-foreground mb-3">{submission.description}</p>
                  )}
                  
                  {submission.cover_url && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Cover Image:</p>
                      <img 
                        src={submission.cover_url} 
                        alt={submission.title}
                        className="w-32 h-48 object-cover rounded-md border border-border/60"
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>Submitted by: {submission.user?.display_name || submission.user?.email || "Unknown"}</span>
                    <span>•</span>
                    <span>{new Date(submission.created_at).toLocaleDateString()}</span>
                    {submission.reviewed_at && (
                      <>
                        <span>•</span>
                        <span>Reviewed {new Date(submission.reviewed_at).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>

                  {submission.admin_notes && (
                    <div className="mt-3 p-3 rounded-lg bg-background/50 border border-border/40">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Admin Notes:</p>
                      <p className="text-sm">{submission.admin_notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {submission.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleAction(submission, "approve")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-3.5 w-3.5 mr-1.5" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleAction(submission, "reject")}
                      >
                        <X className="h-3.5 w-3.5 mr-1.5" />
                        Reject
                      </Button>
                    </>
                  )}
                  {submission.content_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                    >
                      <a href={submission.content_url} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        {submission.status === "approved" ? "Read" : "Check"}
                      </a>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this submission?")) {
                        handleDelete.mutate(submission.id);
                      }
                    }}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-md p-6 bg-card/95 backdrop-blur-xl border-border/60">
            <h3 className="text-lg font-semibold mb-4">
              {actionType === "approve" ? "Approve" : "Reject"} Submission
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              You are about to {actionType} <span className="font-medium text-foreground">"{selectedSubmission.title}"</span> by {selectedSubmission.author}.
            </p>
            <div className="space-y-2 mb-4">
              <Label htmlFor="admin-notes" className="text-sm font-medium">
                Admin Notes {actionType === "reject" ? "(required)" : "(optional)"}
              </Label>
              <Textarea
                id="admin-notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={actionType === "approve" ? "Optional notes for the author..." : "Please provide a reason for rejection..."}
                rows={4}
                className="bg-background/50"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => confirmAction.mutate()}
                disabled={actionType === "reject" && !adminNotes.trim()}
                className={actionType === "approve" ? "flex-1 bg-green-600 hover:bg-green-700" : "flex-1 bg-destructive hover:bg-destructive/90"}
              >
                {actionType === "approve" ? "Approve" : "Reject"}
              </Button>
              <Button variant="outline" onClick={() => setShowActionModal(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}