import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useSession } from "@/lib/auth-hook";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState, useRef } from "react";
import { LogOut, User, Shield, Camera } from "lucide-react";
import { ReadingStats } from "@/components/reading-stats";
import { isAdmin } from "@/lib/admin";
import { ensureUserProfile, ensureProfileExistsOnce } from "@/lib/profile";
import { AvatarEditor } from "@/components/avatar-editor";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Lumen" },
      { name: "description", content: "Manage your Lumen profile, reading stats, and preferences." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { user, session } = useSession();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const userIsAdmin = isAdmin(user?.email);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      await ensureProfileExistsOnce(user!);
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      if (data?.display_name) setDisplayName(data.display_name);
      return data;
    },
  });

  const updateProfile = useMutation({
    mutationFn: async () => {
      let avatarUrl = profile?.avatar_url;

      // Upload new avatar if selected
      if (avatarFile) {
        setUploadingAvatar(true);

        const fileExt = (avatarFile.name.split(".").pop() || "png").toLowerCase();
        const fileName = `${user!.id}-avatar.${fileExt}`;

        // WhatsApp-style replacement: delete ALL existing avatar files for this
        // user first (regardless of extension), so we never leave a stale image
        // behind and always get a fresh, clean URL (avoids CDN caching issues).
        const { data: existingFiles } = await supabase.storage
          .from("avatars")
          .list("", { search: `${user!.id}-avatar` });

        if (existingFiles && existingFiles.length > 0) {
          const oldPaths = existingFiles.map((f: { name: string }) => f.name);

          const { error: removeError } = await supabase.storage
            .from("avatars")
            .remove(oldPaths);
          // A failed delete shouldn't block the upload (e.g. file already gone),
          // but a real RLS error here is worth surfacing.
          if (removeError) {
            console.warn("Could not remove old avatar(s):", removeError.message);
          }
        }

        // Upload the new avatar. Since we deleted the old file above, upsert is
        // not strictly required, but we keep it true so a same-name overwrite
        // still succeeds even if the delete silently failed.
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, avatarFile, {
            upsert: true,
            contentType: avatarFile.type || undefined,
            cacheControl: "3600",
          });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(fileName);

        // Append a cache-busting timestamp to prevent CDN caching stale images
        avatarUrl = `${publicUrl}?t=${Date.now()}`;
      }


      // Try direct Supabase update first
      const { error: directError } = await supabase
        .from("profiles")
        .update({ 
          display_name: displayName,
          avatar_url: avatarUrl 
        })
        .eq("id", user!.id);
      
      if (!directError) return;

      // If direct update fails (RLS), try the proxy server
      const proxyRes = await fetch('http://localhost:3001/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user!.id,
          displayName,
          avatarUrl,
        }),
      });
      
      if (!proxyRes.ok) {
        const err = await proxyRes.json();
        throw new Error(err.error || 'Failed to update profile');
      }
    },
    onSuccess: () => {
      toast.success("Profile updated!");
      setAvatarFile(null);
      setUploadingAvatar(false);
      // Refetch profile data and header avatar to show updates
      qc.invalidateQueries({ queryKey: ["profile", user?.id] });
      qc.invalidateQueries({ queryKey: ["profile-avatar", user?.id] });
    },
    onError: (error: any) => {
      toast.error(error.message);
      setUploadingAvatar(false);
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      setOriginalImageSrc(previewUrl);
      // Open editor instead of directly setting avatarFile
      setIsEditorOpen(true);
    }
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    // Create a new File from the cropped blob
    const croppedFile = new File([croppedBlob], "avatar.jpg", {
      type: "image/jpeg",
    });
    setAvatarFile(croppedFile);

    // Update preview with cropped image
    const croppedPreviewUrl = URL.createObjectURL(croppedBlob);
    setAvatarPreview(croppedPreviewUrl);

    // Clean up original preview
    if (originalImageSrc) {
      URL.revokeObjectURL(originalImageSrc);
    }
  };

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success("Logged out");
    navigate({ to: "/auth" });
  }

  // Cleanup preview URLs on unmount
  const cleanupPreview = () => {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    if (originalImageSrc) {
      URL.revokeObjectURL(originalImageSrc);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
          Your Profile
        </h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <ReadingStats />

      <Card className="p-6 mb-6 bg-card/60 backdrop-blur border-border/60">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center overflow-hidden">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
            ) : profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <User className="h-8 w-8 text-primary-foreground" />
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="text-lg font-semibold">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Profile Picture</Label>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => avatarInputRef.current?.click()}
              className="mt-1"
            >
              <Camera className="h-4 w-4 mr-2" />
              {avatarFile ? "Change Photo" : "Upload Photo"}
            </Button>
            {avatarFile && (
              <p className="text-xs text-muted-foreground mt-1">
                Selected: {avatarFile.name} ({(avatarFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <Button
            onClick={() => updateProfile.mutate()}
            disabled={updateProfile.isPending || uploadingAvatar}
            className="w-full bg-gradient-to-r from-primary to-accent"
          >
            {uploadingAvatar ? "Uploading..." : updateProfile.isPending ? "Updating..." : "Update Profile"}
          </Button>
        </div>
      </Card>

      {userIsAdmin && (
        <Card className="p-6 mb-6 bg-primary/10 border-primary/30">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Admin Panel</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Manage books, users, and site settings.</p>
          <Link to="/admin" className="inline-block w-full">
            <Button className="w-full bg-gradient-to-r from-primary to-accent">
              Go to Admin Dashboard
            </Button>
          </Link>
        </Card>
      )}

      <Card className="p-6 bg-destructive/10 border-destructive/30">
        <h3 className="font-semibold mb-3">Danger Zone</h3>
        <Button
          onClick={handleLogout}
          variant="destructive"
          className="w-full"
        >
          <LogOut className="h-4 w-4 mr-2" /> Log Out
        </Button>
      </Card>

      {/* Avatar Editor Modal */}
      {originalImageSrc && (
        <AvatarEditor
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            // Clean up if user cancels
            if (!avatarFile) {
              if (originalImageSrc) URL.revokeObjectURL(originalImageSrc);
              if (avatarPreview) URL.revokeObjectURL(avatarPreview);
              setOriginalImageSrc(null);
              setAvatarPreview(null);
            }
          }}
          imageSrc={originalImageSrc}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}
