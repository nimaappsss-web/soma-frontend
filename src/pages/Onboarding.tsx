import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";

interface PrincipalForm {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface SchoolForm {
  name: string;
  state: string;
  lga: string;
  schoolType: string;
}

const NIGERIAN_STATES = [
  "Lagos", "Abuja", "Rivers", "Kano", "Oyo", "Kaduna",
];

export const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [principal, setPrincipal] = useState<PrincipalForm>({
    name: "", email: "", phone: "", password: "",
  });
  const [school, setSchool] = useState<SchoolForm>({
    name: "", state: "", lga: "", schoolType: "secondary",
  });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handlePrincipalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleSchoolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({
      id: "user_1",
      name: principal.name,
      email: principal.email,
      role: "PRINCIPAL",
      schoolId: "school_1",
      schoolName: school.name,
    });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <div className="flex items-center gap-2 mb-6">
          <div className={`h-2 w-full rounded ${step >= 1 ? "bg-blue-600" : "bg-gray-200"}`} />
          <div className={`h-2 w-full rounded ${step >= 2 ? "bg-blue-600" : "bg-gray-200"}`} />
        </div>

        {step === 1 && (
          <form onSubmit={handlePrincipalSubmit} className="space-y-4">
            <h1 className="text-2xl font-bold text-blue-700">Create Account</h1>
            <p className="text-gray-500 text-sm">Step 1 — Principal details</p>

            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                value={principal.name}
                onChange={(e) => setPrincipal({ ...principal, name: e.target.value })}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={principal.email}
                onChange={(e) => setPrincipal({ ...principal, email: e.target.value })}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                value={principal.phone}
                onChange={(e) => setPrincipal({ ...principal, phone: e.target.value })}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={principal.password}
                onChange={(e) => setPrincipal({ ...principal, password: e.target.value })}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                required
              />
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold">
              Next
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSchoolSubmit} className="space-y-4">
            <h1 className="text-2xl font-bold text-blue-700">Register School</h1>
            <p className="text-gray-500 text-sm">Step 2 — School details</p>

            <div>
              <label className="block text-sm font-medium text-gray-700">School Name</label>
              <input
                type="text"
                value={school.name}
                onChange={(e) => setSchool({ ...school, name: e.target.value })}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">State</label>
              <select
                value={school.state}
                onChange={(e) => setSchool({ ...school, state: e.target.value })}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                required
              >
                <option value="">Select state</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">LGA</label>
              <input
                type="text"
                value={school.lga}
                onChange={(e) => setSchool({ ...school, lga: e.target.value })}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">School Type</label>
              <select
                value={school.schoolType}
                onChange={(e) => setSchool({ ...school, schoolType: e.target.value })}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="secondary">Secondary</option>
                <option value="primary">Primary</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-semibold"
              >
                Back
              </button>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold">
                Complete
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
