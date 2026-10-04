import { useState } from "react";
import { User, Mail, Phone, MapPin, Calendar, Heart, Shield, Edit3, Save } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../layout/DashboardLayout";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Toast from "../components/common/Toast";
import { initialProfileData } from "../data/mockData";

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [formData, setFormData] = useState({
    fullName: user?.name || initialProfileData.fullName,
    email: user?.email || initialProfileData.email,
    dateOfBirth: initialProfileData.dateOfBirth,
    gender: initialProfileData.gender,
    phone: initialProfileData.phone,
    address: initialProfileData.address,

    height: initialProfileData.height,
    weight: initialProfileData.weight,
    bloodGroup: initialProfileData.bloodGroup,
    allergies: initialProfileData.allergies.join(", "),
    existingConditions: initialProfileData.existingConditions.join(", "),
    emergencyName: initialProfileData.emergencyContact.name,
    emergencyRelation: initialProfileData.emergencyContact.relation,
    emergencyPhone: initialProfileData.emergencyContact.phone
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateProfile({ name: formData.fullName, email: formData.email });
    setIsEditing(false);
    setToastMessage("Profile information updated successfully!");
  };

  return (
    <DashboardLayout>
      <Toast message={toastMessage} onClose={() => setToastMessage("")} type="success" />

      {/* Page Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-main)", margin: 0 }}>
            My Health Profile
          </h1>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            Manage your personal data, health metrics, and emergency contacts
          </p>
        </div>

        <div>
          {isEditing ? (
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <Button variant="outline" size="md" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" icon={Save} onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          ) : (
            <Button variant="primary" size="md" icon={Edit3} onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
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
            />

            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              disabled={!isEditing}
              icon={Mail}
            />

            <Input
              label="Date of Birth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleChange("dateOfBirth", e.target.value)}
              disabled={!isEditing}
              icon={Calendar}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)" }}>Gender</label>
              <select
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
            />

            <Input
              label="Home Address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              disabled={!isEditing}
              icon={MapPin}
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
              value={formData.height}
              onChange={(e) => handleChange("height", e.target.value)}
              disabled={!isEditing}
              placeholder="e.g. 178 cm"
            />

            <Input
              label="Weight"
              value={formData.weight}
              onChange={(e) => handleChange("weight", e.target.value)}
              disabled={!isEditing}
              placeholder="e.g. 72 kg"
            />

            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)" }}>Blood Group</label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => handleChange("bloodGroup", e.target.value)}
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
              placeholder="e.g. Penicillin, Peanuts (comma separated)"
            />

            <Input
              label="Existing Medical Conditions"
              value={formData.existingConditions}
              onChange={(e) => handleChange("existingConditions", e.target.value)}
              disabled={!isEditing}
              placeholder="e.g. Asthma, Hypertension"
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
            />

            <Input
              label="Relationship"
              value={formData.emergencyRelation}
              onChange={(e) => handleChange("emergencyRelation", e.target.value)}
              disabled={!isEditing}
            />

            <Input
              label="Emergency Phone"
              value={formData.emergencyPhone}
              onChange={(e) => handleChange("emergencyPhone", e.target.value)}
              disabled={!isEditing}
              icon={Phone}
            />
          </div>
        </Card>
      </form>
    </DashboardLayout>
  );
};

export default Profile;
