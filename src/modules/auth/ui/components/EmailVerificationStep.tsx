"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { OctagonAlertIcon, Loader2, Mail, ArrowLeft } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormField,
} from "@/components/ui/form";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const otpSchema = z.object({
  otp: z
    .string()
    .min(6, "OTP must be 6 digits")
    .max(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only numbers"),
});

interface EmailVerificationStepProps {
  onVerified: (email: string) => void;
  onBack: () => void;
}

export const EmailVerificationStep = ({ onVerified, onBack }: EmailVerificationStepProps) => {
  const trpc = useTRPC();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  // Timer for OTP expiration
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  // Reset OTP form when switching to OTP step
  useEffect(() => {
    if (step === 'otp') {
      otpForm.reset({ otp: "" });
    }
  }, [step, otpForm]);

  const sendOtpMutation = useMutation(
    trpc.auth.sendOtp.mutationOptions({
      onSuccess: () => {
        setTimeLeft(300); // 5 minutes
        setStep('otp');
        toast.success("Verification code sent to your email");
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to send OTP');
      },
    })
  );

  const verifyOtpMutation = useMutation(
    trpc.auth.verifyOtp.mutationOptions({
      onSuccess: () => {
        onVerified(email);
        toast.success("Email verified successfully");
      },
      onError: (error) => {
        toast.error(error.message || 'Invalid OTP');
        // Reset the form on error to allow retry
        otpForm.setError("otp", {
          type: "manual",
          message: error.message || 'Invalid OTP'
        });
      },
    })
  );

  const onEmailSubmit = (data: z.infer<typeof emailSchema>) => {
    setEmail(data.email);
    sendOtpMutation.mutate({ email: data.email });
  };

  const onOtpSubmit = (data: z.infer<typeof otpSchema>) => {
    verifyOtpMutation.mutate({ email, otp: data.otp });
  };

  const handleResendOtp = () => {
    sendOtpMutation.mutate({ email });
  };

  const handleBackToEmail = () => {
    setStep('email');
    setTimeLeft(0);
    otpForm.reset({ otp: "" });
  };

  // Custom onChange handler for OTP input to restrict to numbers only
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    otpForm.setValue("otp", value);
    // Clear any existing errors when user starts typing
    if (otpForm.formState.errors.otp) {
      otpForm.clearErrors("otp");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isEmailPending = sendOtpMutation.isPending;
  const isOtpPending = verifyOtpMutation.isPending;

  if (step === 'email') {
    return (
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="p-6 md:p-8">
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-2 mb-4">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={onBack}
                    className="p-0 h-auto"
                    disabled={isEmailPending}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">Back to options</span>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="bg-primary/10 p-3 rounded-full mb-4">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold">Verify Your Email</h1>
                  <p className="text-muted-foreground text-balance">
                    We'll send you a verification code to confirm your email address
                  </p>
                </div>

                <FormField
                  control={emailForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="agent@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isEmailPending}
                >
                  {isEmailPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Send Verification Code"
                  )}
                </Button>
              </div>
            </form>
          </Form>

          <div className="bg-radial from-sidebar-accent to-sidebar relative hidden md:flex flex-col gap-y-4 items-center justify-center">
            <img src="/logo.svg" alt="Image" className="h-[92px] w-[92px]" />
            <p className="text-2xl font-semibold text-white">AgentSync</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <CardContent className="grid p-0 md:grid-cols-2">
        <Form {...otpForm}>
          <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-4">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBackToEmail}
                  className="p-0 h-auto"
                  disabled={isOtpPending}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">Change email</span>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="bg-primary/10 p-3 rounded-full mb-4">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold">Enter Verification Code</h1>
                <p className="text-muted-foreground text-balance">
                  We sent a 6-digit code to <strong>{email}</strong>
                </p>
              </div>

              <FormField
                control={otpForm.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Code</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="123456"
                        className="text-center text-lg tracking-widest"
                        maxLength={6}
                        value={field.value || ""}
                        onChange={handleOtpChange}
                        autoComplete="one-time-code"
                        inputMode="numeric"
                        disabled={isOtpPending}
                        autoFocus
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isOtpPending || !otpForm.watch("otp") || otpForm.watch("otp").length !== 6}
              >
                {isOtpPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Verify Email"
                )}
              </Button>

              <div className="text-center space-y-2">
                {timeLeft > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Code expires in {formatTime(timeLeft)}
                  </p>
                ) : (
                  <p className="text-sm text-destructive">Code has expired</p>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResendOtp}
                  disabled={timeLeft > 240 || isEmailPending} // Allow resend after 1 minute
                  className="w-full"
                >
                  {isEmailPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    timeLeft > 240 ? `Resend in ${formatTime(timeLeft - 240)}` : "Resend Code"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>

        <div className="bg-radial from-sidebar-accent to-sidebar relative hidden md:flex flex-col gap-y-4 items-center justify-center">
          <img src="/logo.svg" alt="Image" className="h-[92px] w-[92px]" />
          <p className="text-2xl font-semibent text-white">AgentSync</p>
        </div>
      </CardContent>
    </Card>
  );
};