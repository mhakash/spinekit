/**
 * Login Page
 * Authentication page for SpineKit dashboard
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { authClient, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Database, Loader2 } from "lucide-react";
import { toast } from "sonner";

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

export function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  });

  const form = isSignUp ? signUpForm : signInForm;
  const {
    formState: { errors, isSubmitting },
    register,
    handleSubmit,
    reset,
  } = form;

  useEffect(() => {
    if (session) {
      navigate("/", { replace: true });
    }
  }, [session, navigate]);

  useEffect(() => {
    reset();
  }, [isSignUp, reset]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (isSignUp) {
        const signUpData = data as SignUpFormData;
        const { error } = await authClient.signUp.email({
          email: signUpData.email,
          password: signUpData.password,
          name: signUpData.name,
        });

        if (error) {
          toast.error(error.message || "Sign up failed");
          return;
        }

        toast.success("Account created successfully!");
      } else {
        const signInData = data as SignInFormData;
        const { error } = await authClient.signIn.email({
          email: signInData.email,
          password: signInData.password,
        });

        if (error) {
          toast.error(error.message || "Sign in failed");
          return;
        }

        toast.success("Signed in successfully!");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    }
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-2 mx-auto">
            <Database className="h-8 w-8" />
            <span className="text-2xl font-bold">SpineKit</span>
          </div>
          <CardTitle className="text-center">
            {isSignUp ? "Create Account" : "Sign In"}
          </CardTitle>
          <CardDescription className="text-center">
            {isSignUp
              ? "Enter your details to create a new account"
              : "Enter your credentials to access the dashboard"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  autoComplete="name"
                  disabled={isSubmitting}
                  {...signUpForm.register("name")}
                />
                {signUpForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {signUpForm.formState.errors.name.message}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete={isSignUp ? "email" : "username"}
                disabled={isSubmitting}
                {...(isSignUp
                  ? signUpForm.register("email")
                  : signInForm.register("email"))}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                disabled={isSubmitting}
                {...(isSignUp
                  ? signUpForm.register("password")
                  : signInForm.register("password"))}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : isSignUp ? (
                "Create Account"
              ) : (
                "Sign In"
              )}
            </Button>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary hover:underline"
                disabled={isSubmitting}
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
