import { useState } from "react";
import { User, Mail, Phone, MapPin, Calendar, Heart, Shield, Edit3, Save } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../layout/DashboardLayout";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Toast from "../components/common/Toast";

const createProfileForm = (user) => {
  const healthProfile = user?.healthProfile || {};
  return {
    fullName: user?.name || "",
    dateOfBirth: healthProfile.dateOfBirth || "",
    gender: healthProfile.gender || "",
    phone: healthProfile.phone || "",
    address: healthProfile.address || "",
    height: healthProfile.height || "",
    weight: healthProfile.weight || "",
    bloodGroup: healthProfile.bloodGroup || "",
    allergies: healthProfile.allergies || "",
    existingConditions: healthProfile.existingConditions || "",
    emergencyName: healthProfile.emergencyName || "",
    emergencyRelation: healthProfile.emergencyRelation || "",
    emergencyPhone: healthProfile.emergencyPhone || ""
  };
};

const getLocalDateString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const validateProfileForm = (formData) => {
  const name = formData.fullName.trim();
  if (!name || name.length > 100) return "Enter a name of 1 to 100 characters.";
  if (formData.dateOfBirth) {
    const date = new Date(`${formData.dateOfBirth}T00:00:00.000Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.dateOfBirth)
      || Number.isNaN(date.getTime())
      || date.toISOString().slice(0, 10) !== formData.dateOfBirth
      || formData.dateOfBirth > getLocalDateString()) {
      return "Enter a valid date of birth that is not in the future.";
    }
  }

  for (const field of ["phone", "emergencyPhone"]) {
    const value = formData[field].trim();
    if (value && (!/^\+?[\d\s().-]+$/.test(value) || value.replace(/\D/g, "").length < 7 || value.replace(/\D/g, "").length > 15)) {
      return "Enter a valid phone number with 7 to 15 digits.";
    }
  }

  const height = formData.height.trim();
  if (height) {
    const match = height.match(/^(\d{1,3}(?:\.\d{1,2})?)\s*(cm|m|in|ft)?$/i);
    if (!match) return "Enter a valid height in cm, m, in, or ft.";
    const unit = (match[2] || "cm").toLowerCase();
    const centimeters = Number(match[1]) * ({ cm: 1, m: 100, in: 2.54, ft: 30.48 }[unit]);
    if (centimeters < 30 || centimeters > 300) return "Height must be between 30 and 300 cm (or equivalent).";
  }
  const weight = formData.weight.trim();
  if (weight) {
    const match = weight.match(/^(\d{1,3}(?:\.\d{1,2})?)\s*(kg|lbs?)?$/i);
    if (!match) return "Enter a valid weight in kg or lb.";
    const unit = (match[2] || "kg").toLowerCase();
    const kilograms = Number(match[1]) * (unit === "lb" || unit === "lbs" ? 0.45359237 : 1);
    if (kilograms < 1 || kilograms > 700) return "Weight must be between 1 and 700 kg (or equivalent).";
  }
  if (formData.bloodGroup && !["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].includes(formData.bloodGroup)) {
    return "Select a supported blood group.";
  }
  if (formData.gender && !["Male", "Female", "Other", "Prefer not to say"].includes(formData.gender)) {
    return "Select a supported gender option.";
  }
  if (formData.address.length > 300) return "Address must be 300 characters or fewer.";
  if (formData.emergencyName.length > 100) return "Emergency contact name must be 100 characters or fewer.";
  if (formData.emergencyRelation.length > 80) return "Relationship must be 80 characters or fewer.";
  if (formData.allergies.length > 1000 || formData.existingConditions.length > 1000) {
    return "Health notes must be 1000 characters or fewer.";
  }
  return "";
};

const Profile = () => {
  const { user, loading, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [validationError, setValidationError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(() => createProfileForm(user));

  const handleChange = (field, value) => {
    setValidationError("");
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const error = validateProfileForm(formData);
    if (error) {
      setValidationError(error);
      return;
    }
    setSaving(true);
    setValidationError("");
    try {
      const updatedUser = await updateProfile({
        name: formData.fullName.trim(),
        healthProfile: {
          dateOfBirth: formData.dateOfBirth.trim(),
          gender: formData.gender.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          height: formData.height.trim(),
          weight: formData.weight.trim(),
          bloodGroup: formData.bloodGroup.trim(),
          allergies: formData.allergies.trim(),
          existingConditions: formData.existingConditions.trim(),
          emergencyName: formData.emergencyName.trim(),
          emergencyRelation: formData.emergencyRelation.trim(),
          emergencyPhone: formData.emergencyPhone.trim()
        }
      });
      setFormData(createProfileForm(updatedUser));
      setIsEditing(false);
      setToastType("success");
      setToastMessage("Profile updated successfully.");
    } catch (error) {
      setToastType("error");
      setToastMessage(error.message || "Could not save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(createProfileForm(user));
    setValidationError("");
    setIsEditing(false);
  };

  if (loading || !user) {
    return (
      <DashboardLayout>
        <div role="status" style={{ minHeight: "40vh", display: "grid", placeContent: "center", gap: "0.75rem", color: "var(--text-muted)", textAlign: "center" }}>
          <div style={{ width: "36px", height: "36px", margin: "0 auto", border: "3px solid var(--border-color)", borderTopColor: "#16A34A", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          Loading your profile...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Toast message={toastMessage} onClose={() => setToastMessage("")} type={toastType} />

      {/* Page Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.9rem", marginBottom: "0.75rem" }}>
            <div aria-hidden="true" style={{ width: "3.25rem", height: "3.25rem", display: "grid", placeItems: "center", flexShrink: 0, borderRadius: "50%", background: "linear-gradient(135deg, #DCFCE7, #A7F3D0)", color: "#166534", fontSize: "1.1rem", fontWeight: "800" }}>
              {user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")}
            </div>
            <div>
              <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-main)", margin: 0 }}>
                Profile
              </h1>
              <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                Your personal details, health information, and emergency contact
              </p>
            </div>
          </div>
        </div>

        <div>
          {isEditing ? (
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <Button variant="outline" size="md" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
              <Button
                type="submit"
                form="health-profile-form"
                variant="primary"
                size="md"
                icon={Save}
                isLoading={saving}
              >
                Save Changes
              </Button>
            </div>
          ) : (
            <Button variant="primary" size="md" icon={Edit3} onClick={() => { setValidationError(""); setIsEditing(true); }}>
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <form id="health-profile-form" onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
        {validationError && (
          <div role="alert" style={{ padding: "0.85rem 1rem", borderRadius: "0.75rem", border: "1px solid #FCA5A5", background: "#FEF2F2", color: "#991B1B", fontSize: "0.9rem" }}>
            {validationError}
          </div>
        )}
        {/* Personal Information Card */}
        <Card
          title="Personal Information"
          subtitle="Basic identity and contact details"
          icon={User}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
            <Input
              label="Full Name"
              value={formData.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              disabled={!isEditing}
              icon={User}
              required
              maxLength={100}
            />

            <Input
              label="Email Address"
              type="email"
              value={user.email || ""}
              disabled
              icon={Mail}
              helperText="This is your account email and cannot be changed here."
            />

            <Input
              label="Date of Birth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleChange("dateOfBirth", e.target.value)}
              disabled={!isEditing}
              icon={Calendar}
              max={getLocalDateString()}
              helperText={!isEditing && !formData.dateOfBirth ? "Not added" : ""}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label htmlFor="profile-gender" style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)" }}>Gender</label>
              <select
                id="profile-gender"
                value={formData.gender}
                onChange={(e) => handleChange("gender", e.target.value)}
                disabled={!isEditing}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.9rem",
                  fontSize: "0.9rem",
                  borderRadius: "0.65rem",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-main)",
                  color: "var(--text-main)",
                  outline: "none"
                }}
              >
                <option value="">Not provided</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other / Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              disabled={!isEditing}
              icon={Phone}
              maxLength={30}
              placeholder={isEditing ? "Phone number" : "Not added"}
            />

            <Input
              label="Home Address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              disabled={!isEditing}
              icon={MapPin}
              maxLength={300}
              placeholder={isEditing ? "Home address" : "Not added"}
            />
          </div>
        </Card>

        {/* Health Information Card */}
        <Card
          title="Health Vitals & Medical Profile"
          subtitle="Physical measurements, allergies, and conditions"
          icon={Heart}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
            <Input
              label="Height"
              type="text"
              inputMode="decimal"
              value={formData.height}
              onChange={(e) => handleChange("height", e.target.value)}
              disabled={!isEditing}
              placeholder={isEditing ? "e.g. 178 cm" : "Not added"}
              maxLength={20}
            />

            <Input
              label="Weight"
              type="text"
              inputMode="decimal"
              value={formData.weight}
              onChange={(e) => handleChange("weight", e.target.value)}
              disabled={!isEditing}
              placeholder={isEditing ? "e.g. 72 kg" : "Not added"}
              maxLength={20}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label htmlFor="profile-blood-group" style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)" }}>Blood Group</label>
              <select
                id="profile-blood-group"
                value={formData.bloodGroup}
                onChange={(e) => handleChange("bloodGroup", e.target.value)}
                disabled={!isEditing}
                aria-label="Blood group"
                style={{
                  width: "100%",
                  padding: "0.65rem 0.9rem",
                  fontSize: "0.9rem",
                  borderRadius: "0.65rem",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-main)",
                  color: "var(--text-main)",
                  outline: "none"
                }}
              >
                <option value="">Not provided</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <Input
              label="Known Allergies"
              value={formData.allergies}
              onChange={(e) => handleChange("allergies", e.target.value)}
              disabled={!isEditing}
              placeholder={isEditing ? "e.g. Penicillin, Peanuts (comma separated)" : "Not added"}
              maxLength={1000}
            />

            <Input
              label="Existing Medical Conditions"
              value={formData.existingConditions}
              onChange={(e) => handleChange("existingConditions", e.target.value)}
              disabled={!isEditing}
              placeholder={isEditing ? "e.g. Asthma, Hypertension" : "Not added"}
              maxLength={1000}
            />
          </div>
        </Card>

        {/* Emergency Contact */}
        <Card
          title="Emergency Contact"
          subtitle="Designated primary emergency contact details"
          icon={Shield}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
            <Input
              label="Contact Name"
              value={formData.emergencyName}
              onChange={(e) => handleChange("emergencyName", e.target.value)}
              disabled={!isEditing}
              placeholder={isEditing ? "Contact name" : "Not added"}
              maxLength={100}
            />

            <Input
              label="Relationship"
              value={formData.emergencyRelation}
              onChange={(e) => handleChange("emergencyRelation", e.target.value)}
              disabled={!isEditing}
              placeholder={isEditing ? "Relationship" : "Not added"}
              maxLength={80}
            />

            <Input
              label="Emergency Phone"
              value={formData.emergencyPhone}
              onChange={(e) => handleChange("emergencyPhone", e.target.value)}
              disabled={!isEditing}
              icon={Phone}
              maxLength={30}
              placeholder={isEditing ? "Emergency phone number" : "Not added"}
            />
          </div>
        </Card>
      </form>
    </DashboardLayout>
  );
};

export default Profile;
