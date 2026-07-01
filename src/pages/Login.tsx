import { useState } from "react";
import { useNavigate, Link } from "react-router";

import { useAuth } from "../contexts/AuthContext";
import { useLogin } from "../features/auth/api";

export const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const loginMutation = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { identifier, password, deviceId: "web-1", deviceName: navigator.userAgent },
      {
        onSuccess: (data) => {
          login(data);
          navigate("/dashboard");
        },
      },
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-blue-700">Nima</h1>
        <p className="text-gray-500 text-sm">Sign in to your account</p>

        {loginMutation.isError && (
          <p className="text-red-500 text-sm">{(loginMutation.error as Error)?.message || "Login failed"}</p>
        )}

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

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
        >
          {loginMutation.isPending ? "Signing in..." : "Sign In"}
        </button>

        <div className="text-center space-y-1 text-sm">
          <Link to="/onboarding" className="text-blue-600 hover:underline block">
            Register your school
          </Link>
          <Link to="/forgot-password" className="text-gray-400 hover:underline text-xs block">
            Forgot password?
          </Link>
        </div>
      </form>
    </div>
  );
};
