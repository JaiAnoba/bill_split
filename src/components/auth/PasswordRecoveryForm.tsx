import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface PasswordRecoveryFormProps {
  onSubmit?: (values: FormValues) => void;
  isLoading?: boolean;
}

const PasswordRecoveryForm = ({
  onSubmit = () => {},
  isLoading = false,
}: PasswordRecoveryFormProps) => {
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleSubmit = (values: FormValues) => {
    onSubmit(values);
    setIsSuccess(true);
    // In a real implementation, this would be handled by the parent component
    // which would make an API call and then set success state
  };

  return (
    <div className="w-full space-y-6 bg-background p-6 rounded-lg shadow-sm">
      {isSuccess ? (
        <div className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <Mail className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold">Check your email</h3>
          <p className="text-muted-foreground">
            We've sent a password reset link to your email address. Please check
            your inbox and follow the instructions.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setIsSuccess(false)}
          >
            Back to recovery form
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-2 text-center">
            <h3 className="text-xl font-semibold">Forgot your password?</h3>
            <p className="text-muted-foreground">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="your.email@example.com"
                        {...field}
                        type="email"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      We'll send a password reset link to this email address.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send reset link"}
              </Button>
            </form>
          </Form>
        </>
      )}
    </div>
  );
};

export default PasswordRecoveryForm;
