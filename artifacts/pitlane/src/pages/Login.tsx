import React, { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { useAdminLogin, useMechanicLogin } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const adminSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

const mechanicSchema = z.object({
  code: z.string().min(1, "Workshop code is required"),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { setAdmin, setMechanic } = useAuth();
  const { toast } = useToast();
  
  const adminLogin = useAdminLogin();
  const mechanicLogin = useMechanicLogin();

  const adminForm = useForm<z.infer<typeof adminSchema>>({
    resolver: zodResolver(adminSchema),
    defaultValues: { password: "" },
  });

  const mechanicForm = useForm<z.infer<typeof mechanicSchema>>({
    resolver: zodResolver(mechanicSchema),
    defaultValues: { code: "", password: "" },
  });

  const onAdminSubmit = (values: z.infer<typeof adminSchema>) => {
    adminLogin.mutate({ data: values }, {
      onSuccess: (res) => {
        if (res.success) {
          setAdmin();
          setLocation("/admin/dashboard");
        } else {
          toast({ title: "Login failed", description: "Invalid password", variant: "destructive" });
        }
      },
      onError: () => {
        toast({ title: "Error", description: "Could not connect to server", variant: "destructive" });
      }
    });
  };

  const onMechanicSubmit = (values: z.infer<typeof mechanicSchema>) => {
    mechanicLogin.mutate({ data: values }, {
      onSuccess: (res) => {
        if (res.success && res.mechanic) {
          setMechanic(res.mechanic);
          setLocation(`/mechanic/${res.mechanic.id}`);
        } else {
          toast({ title: "Login failed", description: "Invalid code or password", variant: "destructive" });
        }
      },
      onError: () => {
        toast({ title: "Error", description: "Could not connect to server", variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex items-center justify-center">
        <div className="font-condensed font-bold text-5xl tracking-wider flex items-center">
          <span className="text-primary">PIT</span>
          <span className="text-foreground">LANE</span>
        </div>
      </div>

      <Card className="w-full max-w-md border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle className="font-condensed text-2xl tracking-wide text-center uppercase">Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="admin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="admin" className="font-condensed tracking-wider">ADMIN</TabsTrigger>
              <TabsTrigger value="mechanic" className="font-condensed tracking-wider">MECHANIC</TabsTrigger>
            </TabsList>
            
            <TabsContent value="admin">
              <Form {...adminForm}>
                <form onSubmit={adminForm.handleSubmit(onAdminSubmit)} className="space-y-4">
                  <FormField
                    control={adminForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground uppercase text-xs font-condensed tracking-wider">Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" className="bg-background" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full font-condensed tracking-wider text-lg mt-4" disabled={adminLogin.isPending}>
                    {adminLogin.isPending ? "AUTHENTICATING..." : "ENTER COMMAND CENTER"}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="mechanic">
              <Form {...mechanicForm}>
                <form onSubmit={mechanicForm.handleSubmit(onMechanicSubmit)} className="space-y-4">
                  <FormField
                    control={mechanicForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground uppercase text-xs font-condensed tracking-wider">Workshop Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. WS-123" className="bg-background" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={mechanicForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground uppercase text-xs font-condensed tracking-wider">Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" className="bg-background" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full font-condensed tracking-wider text-lg mt-4" disabled={mechanicLogin.isPending}>
                    {mechanicLogin.isPending ? "AUTHENTICATING..." : "ACCESS PORTAL"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="mt-8 text-center space-y-3">
        <div>
          <Link href="/signup" className="text-primary hover:text-primary/80 font-condensed tracking-wider uppercase underline underline-offset-4">
            Join as a Subscriber
          </Link>
        </div>
        <div>
          <Link href="/" className="text-muted-foreground/60 hover:text-muted-foreground font-condensed tracking-wider uppercase text-xs transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
