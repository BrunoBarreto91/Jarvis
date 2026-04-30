import { useState, FormEvent } from "react";
import { toast } from "sonner";
import { Loader2, KeyRound, Trash2, AlertTriangle } from "lucide-react";
import { updatePassword, deleteUser as amplifyDeleteUser } from "aws-amplify/auth";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { signOut } = useAuth();

  const [isLoading, setIsLoading] = useState(false);

  // Change Password state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Delete Account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    setIsLoading(true);
    try {
      await updatePassword({ oldPassword, newPassword });
      toast.success("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteUser(e: FormEvent) {
    e.preventDefault();
    if (!deletePassword) {
      toast.error("Please confirm your password to delete the account.");
      return;
    }
    setIsLoading(true);
    try {
      await amplifyDeleteUser();
      await signOut();
      toast.success("Account deleted. Goodbye.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-8 py-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your Jarvis account.</p>
      </div>

      {/* Security section */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-slate-500" />
            <CardTitle className="text-base font-semibold text-slate-800">
              Security
            </CardTitle>
          </div>
          <CardDescription className="text-slate-400 text-sm">
            Change your access password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleChangePassword}
            className="space-y-4"
            noValidate
          >
            <div className="space-y-1.5">
              <Label
                htmlFor="oldPassword"
                className="text-slate-700 text-sm"
              >
                Current password
              </Label>
              <Input
                id="oldPassword"
                type="password"
                autoComplete="current-password"
                value={oldPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setOldPassword(e.target.value)
                }
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="newPassword"
                className="text-slate-700 text-sm"
              >
                New password
              </Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewPassword(e.target.value)
                }
                placeholder="Min. 8 characters"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="confirmPassword"
                className="text-slate-700 text-sm"
              >
                Confirm new password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setConfirmPassword(e.target.value)
                }
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-violet-600 hover:bg-violet-500 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save new password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-200 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-red-500" />
            <CardTitle className="text-base font-semibold text-red-700">
              Delete account
            </CardTitle>
          </div>
          <CardDescription className="text-slate-500 text-sm">
            This action is permanent and cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showDeleteConfirm ? (
            <Button
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Delete my account
            </Button>
          ) : (
            <form
              onSubmit={handleDeleteUser}
              className="space-y-4"
              noValidate
            >
              <Separator className="bg-red-100" />
              <p className="text-sm text-slate-600">
                To confirm, enter your current password:
              </p>
              <Input
                id="deletePassword"
                type="password"
                autoComplete="current-password"
                value={deletePassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDeletePassword(e.target.value)
                }
                placeholder="Your password"
                disabled={isLoading}
                autoFocus
                className="border-red-300 focus-visible:ring-red-400"
              />
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isLoading || !deletePassword}
                  className="bg-red-600 hover:bg-red-500 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting…
                    </>
                  ) : (
                    "Delete permanently"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePassword("");
                  }}
                  className="text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
