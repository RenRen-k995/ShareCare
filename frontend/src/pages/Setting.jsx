import React, { useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import authService from "../services/authService";
import MainLayout from "../components/layout/MainLayout";
import { uploadAvatar } from "../lib/api";
import { compressImage } from "../utils/imageCompression";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import DatePicker from "../components/DatePicker";
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
    username: user?.username || "",
    fullName: user?.fullName || "",
    bio: user?.bio || "",
    avatar: user?.avatar || "",
    gender: user?.gender || "",
    dateOfBirth: user?.dateOfBirth
      ? new Date(user.dateOfBirth).toISOString().split("T")[0]
      : "",
  });

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  // Handle Avatar File Upload
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    try {
      setUploadingAvatar(true);

      // Compress avatar image before upload (500px max size, suitable for avatars)
      const compressedBase64 = await compressImage(file, 500, 0.85);

      // Convert base64 to blob
      const response = await fetch(compressedBase64);
      const blob = await response.blob();
      const compressedFile = new File([blob], file.name, {
        type: "image/jpeg",
      });

      console.log(
        `Avatar compressed: ${(file.size / 1024).toFixed(1)}KB -> ${(
          compressedFile.size / 1024
        ).toFixed(1)}KB`
      );

      // Use dedicated avatar upload endpoint
      const avatarUrl = await uploadAvatar(compressedFile);

      // Update form state with new URL
      setFormData((prev) => ({ ...prev, avatar: avatarUrl }));
    } catch (err) {
      console.error("Avatar upload failed:", err);
      alert("Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
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
              {formData.avatar ? (
                <img
                  src={formData.avatar}
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
              onClick={handleAvatarClick}
              disabled={uploadingAvatar}
            >
              <Camera className="w-6 h-6" />
            </button>
            {/* Hidden Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
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
                onClick={handleAvatarClick}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? "Uploading..." : "Change Avatar"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-500 rounded-full hover:text-red-600"
                onClick={() => setFormData((prev) => ({ ...prev, avatar: "" }))}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="userName">Display Name</Label>
            <Input
              id="userName"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="How should we call you?"
              className="border-gray-200 rounded-xl focus:border-cyan-400 focus:ring-cyan-400"
            />
            <p className="text-xs text-gray-400">
              This name will be displayed on your profile and posts.
            </p>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-gray-700">
              Full Name
            </Label>
            <Input
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="e.g. John Doe"
              className="h-12 transition-all border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:border-cyan-400 focus:ring-cyan-400"
            />
            <p className="pl-1 text-xs text-gray-400">
              Your real name, useful for verifications.
            </p>
          </div>
          {/* Date of Birth Picker */}
          <div className="space-y-3">
            <Label className="font-semibold text-gray-700">Date of Birth</Label>
            <DatePicker
              value={formData.dateOfBirth}
              onChange={(date) =>
                setFormData({ ...formData, dateOfBirth: date })
              }
            />
          </div>
          {/* Gender */}
          <div className="space-y-2">
            <Label className="text-gray-700">Gender</Label>
            <div className="flex gap-4">
              {[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "other", label: "Other" },
                { value: "prefer-not-to-say", label: "Prefer not to say" },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="gender"
                    value={option.value}
                    checked={formData.gender === option.value}
                    onChange={handleChange}
                    className="w-4 h-4 border-gray-300 text-cyan-500 focus:ring-cyan-400"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
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

const SecurityForm = ({ user, onUpdateUser }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [emailChange, setEmailChange] = useState({
    newEmail: "",
    password: "",
    showDialog: false,
  });

  const handlePasswordUpdate = async () => {
    setMessage("");
    setError("");

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (passwords.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setMessage("Password updated successfully");
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = async () => {
    setMessage("");
    setError("");

    if (!emailChange.newEmail || !emailChange.password) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);
    try {
      const result = await authService.changeEmail({
        newEmail: emailChange.newEmail,
        password: emailChange.password,
      });
      if (result.user) {
        onUpdateUser(result.user);
      }
      setMessage("Email updated successfully");
      setEmailChange({ newEmail: "", password: "", showDialog: false });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 duration-300 animate-in fade-in slide-in-from-right-4">
      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-gray-900">Security & Login</h2>

        <div className="p-4 border border-yellow-100 rounded-xl bg-yellow-50/50">
          <h3 className="mb-1 text-sm font-semibold text-yellow-800">
            Security Recommendation
          </h3>
          <p className="text-xs text-yellow-700">
            For better security, please change your password regularly.
          </p>
        </div>

        {/* Feedback Messages */}
        {message && (
          <div className="p-3 text-sm text-center border rounded-lg bg-emerald-50 text-emerald-600 border-emerald-100">
            <CheckCircle2 className="inline w-4 h-4 mr-2" /> {message}
          </div>
        )}
        {error && (
          <div className="p-3 text-sm text-center text-red-600 border border-red-100 rounded-lg bg-red-50">
            <AlertCircle className="inline w-4 h-4 mr-2" /> {error}
          </div>
        )}

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Email Address</Label>
            {!emailChange.showDialog ? (
              <div className="flex gap-4">
                <Input
                  value={user?.email}
                  className="bg-slate-50 text-slate-500 border-slate-200 rounded-xl"
                />
                <Button
                  variant="outline"
                  className="rounded-xl whitespace-nowrap"
                  onClick={() =>
                    setEmailChange({ ...emailChange, showDialog: true })
                  }
                >
                  Change Email
                </Button>
              </div>
            ) : (
              <div className="p-4 space-y-3 border bg-slate-50 rounded-xl border-slate-200">
                <div className="space-y-2">
                  <Label htmlFor="new-email">New Email Address</Label>
                  <Input
                    id="new-email"
                    type="email"
                    className="rounded-xl"
                    placeholder="Enter new email"
                    value={emailChange.newEmail}
                    onChange={(e) =>
                      setEmailChange({
                        ...emailChange,
                        newEmail: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-password">Confirm Password</Label>
                  <Input
                    id="email-password"
                    type="password"
                    className="rounded-xl"
                    placeholder="Enter your password"
                    value={emailChange.password}
                    onChange={(e) =>
                      setEmailChange({
                        ...emailChange,
                        password: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    className="rounded-xl"
                    onClick={() =>
                      setEmailChange({
                        newEmail: "",
                        password: "",
                        showDialog: false,
                      })
                    }
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="secondary"
                    className="rounded-xl"
                    onClick={handleEmailChange}
                    disabled={
                      loading || !emailChange.newEmail || !emailChange.password
                    }
                  >
                    Update Email
                  </Button>
                </div>
              </div>
            )}
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
                  placeholder="Enter current password"
                  value={passwords.currentPassword}
                  onChange={(e) =>
                    setPasswords({
                      ...passwords,
                      currentPassword: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    className="rounded-xl"
                    placeholder="Enter new password"
                    value={passwords.newPassword}
                    onChange={(e) =>
                      setPasswords({
                        ...passwords,
                        newPassword: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    className="rounded-xl"
                    placeholder="Confirm new password"
                    value={passwords.confirmPassword}
                    onChange={(e) =>
                      setPasswords({
                        ...passwords,
                        confirmPassword: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                variant="secondary"
                className="text-white rounded-full bg-slate-800 hover:bg-slate-900"
                onClick={handlePasswordUpdate}
                disabled={
                  loading ||
                  !passwords.currentPassword ||
                  !passwords.newPassword
                }
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

              {activeTab === "security" && (
                <SecurityForm user={user} onUpdateUser={updateUser} />
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
