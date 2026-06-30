import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../contexts/AuthContext";

export const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({
      id: "user_1",
      name: "Dr. Adebayo Okonkwo",
      email: identifier,
      role: "PRINCIPAL",
      schoolId: "school_1",
      schoolName: "Greenfield Secondary School",
    });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-blue-700">Nima</h1>
        <p className="text-gray-500 text-sm">Sign in to your account</p>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email or Phone</label>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
            required
          />
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold">
          Sign In
        </button>

        <div className="text-center space-y-1 text-sm">
          <Link to="/onboarding" className="text-blue-600 hover:underline block">
            Register your school
          </Link>
          <button type="button" className="text-gray-400 hover:underline text-xs">
            Forgot password?
          </button>
        </div>
      </form>
    </div>
  );
};
