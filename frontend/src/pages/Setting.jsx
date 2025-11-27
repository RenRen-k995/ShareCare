import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import authService from "../services/authService";
import MainLayout from "../components/layout/MainLayout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  User,
  ShieldCheck,
  Bell,
  HelpCircle,
  Camera,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

// --- Sub-Component: Edit Profile Form ---
const EditProfileForm = ({ user, onUpdate, loading, message, error }) => {
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    bio: user?.bio || "",
    avatar: user?.avatar || "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 duration-300 animate-in fade-in slide-in-from-right-4"
    >
      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>

        {/* Avatar Section */}
        <div className="flex items-center gap-6 p-4 border bg-slate-50 rounded-2xl border-slate-100">
          <div className="relative group">
            <div className="w-24 h-24 overflow-hidden border-4 border-white rounded-full shadow-md bg-slate-200">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="Profile"
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-2xl font-bold text-slate-400">
                  {user?.username?.[0].toUpperCase()}
                </div>
              )}
            </div>
            <button
              type="button"
              className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white transition-opacity rounded-full opacity-0 bg-black/40 group-hover:opacity-100"
              onClick={() => alert("Avatar upload implementation required")}
            >
              <Camera className="w-6 h-6" />
            </button>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Profile Picture</h3>
            <p className="mb-3 text-sm text-gray-500">
              PNG, JPG or GIF. Max size of 2MB.
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
              >
                Change Avatar
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-500 rounded-full hover:text-red-600"
              >
                Remove
              </Button>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fullName">Display Name</Label>
            <Input
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="How should we call you?"
              className="border-gray-200 rounded-xl focus:border-cyan-400 focus:ring-cyan-400"
            />
            <p className="text-xs text-gray-400">
              This name will be displayed on your profile and posts.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us a little bit about yourself..."
              rows={4}
              className="border-gray-200 resize-none rounded-xl focus:border-cyan-400 focus:ring-cyan-400"
              maxLength={500}
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Share your interests and hobbies.</span>
              <span>{formData.bio.length}/500</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-100">
        <div className="flex-1">
          {message && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" /> {message}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 animate-in fade-in">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="rounded-full bg-cyan-400 hover:bg-cyan-500 text-white px-8 font-bold min-w-[120px]"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  );
};

const SecurityForm = ({ user }) => {
  return (
    <div className="space-y-8 duration-300 animate-in fade-in slide-in-from-right-4">
      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-gray-900">Security & Login</h2>

        <div className="p-4 border border-yellow-100 rounded-xl bg-yellow-50/50">
          <h3 className="mb-1 text-sm font-semibold text-yellow-800">
            Security Recommendation
          </h3>
          <p className="text-xs text-yellow-700">
            For better security, enable two-factor authentication on your
            account.
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Email Address</Label>
            <div className="flex gap-4">
              <Input
                value={user?.email}
                disabled
                className="bg-slate-50 text-slate-500 border-slate-200 rounded-xl"
              />
              <Button
                variant="outline"
                className="rounded-xl whitespace-nowrap"
              >
                Change Email
              </Button>
            </div>
          </div>

          <div className="pt-4 space-y-4 border-t border-gray-100">
            <h3 className="font-medium text-gray-900">Change Password</h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  className="rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                variant="secondary"
                className="text-white rounded-full bg-slate-800 hover:bg-slate-900"
              >
                Update Password
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const tabs = [
    { id: "profile", label: "Edit Profile", icon: User },
    { id: "security", label: "Password & Security", icon: ShieldCheck },
  ];

  const handleUpdateProfile = async (data) => {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const updatedUser = await authService.updateProfile(data);
      updateUser(updatedUser.user);
      setMessage("Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout rightSidebar={null} leftSidebar={false}>
      {/* Container Wrapper 
        Removed 'overflow-hidden' from here because it breaks 'sticky' positioning
        of children elements. If you strictly need it, add it back, but the sidebar won't stick.
      */}
      <div className="max-w-5xl px-6 mx-auto mt-8 mb-40">
        {/* "Body Scroll" Wrapper - Flex Container */}
        <div className="flex flex-col items-start gap-6 md:flex-row">
          {/* Left Sidebar - Navigation 
              Added: bg-white, rounded-[2rem], border, shadow, sticky 
          */}
          <aside className="sticky top-8 w-full md:w-64 shrink-0 z-10 bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6">
              <h1 className="px-2 mb-6 text-2xl font-extrabold text-gray-900">
                Settings
              </h1>
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-200
                        ${
                          isActive
                            ? "bg-slate-50 text-cyan-600 ring-1 ring-slate-100"
                            : "text-gray-500 hover:bg-slate-50 hover:text-gray-900"
                        }
                      `}
                    >
                      <Icon
                        className={`w-5 h-5 shrink-0 ${
                          isActive ? "text-cyan-500" : "text-gray-400"
                        }`}
                      />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content Area 
              Added: bg-white, rounded-[2rem], border, shadow 
          */}
          <div className="flex-1 w-full min-w-0 bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 md:p-10">
              {activeTab === "profile" && (
                <EditProfileForm
                  user={user}
                  onUpdate={handleUpdateProfile}
                  loading={loading}
                  message={message}
                  error={error}
                />
              )}

              {activeTab === "security" && <SecurityForm user={user} />}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
