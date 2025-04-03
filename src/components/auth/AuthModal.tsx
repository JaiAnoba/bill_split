import React, { useState } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import PasswordRecoveryForm from "./PasswordRecoveryForm";

interface AuthModalProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultTab?: "login" | "register" | "recovery";
  onLoginSuccess?: () => void;
  onRegisterSuccess?: () => void;
  onPasswordRecoverySuccess?: () => void;
}

const AuthModal = ({
  isOpen = true,
  onOpenChange = () => {},
  defaultTab = "login",
  onLoginSuccess = () => {},
  onRegisterSuccess = () => {},
  onPasswordRecoverySuccess = () => {},
}: AuthModalProps) => {
  const [activeTab, setActiveTab] = useState<"login" | "register" | "recovery">(
    defaultTab,
  );

  const handleLoginSubmit = (values: any) => {
    console.log("Login submitted:", values);
    // Here you would typically make an API call to authenticate the user
    onLoginSuccess();
  };

  const handleRegisterSubmit = (values: any) => {
    console.log("Registration submitted:", values);
    // Here you would typically make an API call to register the user
    onRegisterSuccess();
  };

  const handlePasswordRecoverySubmit = (values: any) => {
    console.log("Password recovery submitted:", values);
    // Here you would typically make an API call to initiate password recovery
    onPasswordRecoverySuccess();
  };

  const handleForgotPassword = () => {
    setActiveTab("recovery");
  };

  const handleLoginClick = () => {
    setActiveTab("login");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg bg-background">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {activeTab === "login" && "Welcome Back"}
            {activeTab === "register" && "Create Account"}
            {activeTab === "recovery" && "Reset Password"}
          </DialogTitle>
        </DialogHeader>
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <LoginForm
              onSubmit={handleLoginSubmit}
              onForgotPassword={handleForgotPassword}
            />
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <RegisterForm
              onSubmit={handleRegisterSubmit}
              onLoginClick={handleLoginClick}
            />
          </TabsContent>

          <TabsContent value="recovery" className="space-y-4">
            <PasswordRecoveryForm onSubmit={handlePasswordRecoverySubmit} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
