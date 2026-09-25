import { createBrowserRouter } from "react-router-dom";
import { LoginPage } from "@/features/auth/components/LoginPage";
import { ForgotPasswordPage } from "@/features/auth/components/ForgotPasswordPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/recuperar-password",
    element: <ForgotPasswordPage />,
  },
]);