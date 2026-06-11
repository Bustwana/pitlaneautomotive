import React from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Check, CheckCircle2 } from "lucide-react";
import { usePublicSignup } from "@workspace/api-client-react";

const signupSchema = z.object({
  fname: z.string().min(1, "First name is required"),
  lname: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Valid email is required"),
  suburb: z.string().min(1, "Suburb is required"),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.string().min(1, "Year is required"),
  tier: z.enum(["basic", "standard", "annual"]),
  consent: z.boolean().refine(val => val === true, "You must agree to the terms"),
});

const tiers = [
  {
    id: "basic",
    name: "Basic",
    price: "$7",
    period: "/wk",
    joining: "$130 joining fee",
    annual: "$299/yr pay-upfront option",
    inclusions: [
      "1 full service per year",
      "Mid-year fluid check",
      "Mid-year tyre pressure check",
    ],
    highlight: false,
  },
  {
    id: "standard",
    name: "Standard",
    price: "$13",
    period: "/wk",
    joining: "$160 joining fee",
    annual: "$450/yr pay-upfront option",
    inclusions: [
      "2 full services per year",
      "Mid-year fluid check",
      "Mid-year tyre pressure check",
      "Bonus inclusions (tyre rotation etc.)",
    ],
    highlight: true,
  },
  {
    id: "annual",
    name: "Annual",
    price: "$299",
    period: "/yr",
    joining: "No joining fee",
    annual: "Basic $299 · Standard $450",
    inclusions: [
      "All inclusions of chosen tier",
      "Pay upfront — slight discount baked in",
      "12-month coverage from start date",
    ],
    highlight: false,
  },
];

export default function Signup() {
  const { toast } = useToast();
  const [success, setSuccess] = React.useState(false);

  const signupMutation = usePublicSignup();

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fname: "", lname: "", phone: "", email: "", suburb: "",
      make: "", model: "", year: "", tier: "standard", consent: false
    },
  });

  const onSubmit = (values: z.infer<typeof signupSchema>) => {
    const { consent: _consent, ...submitData } = values;
    signupMutation.mutate({ data: submitData }, {
      onSuccess: () => {
        setSuccess(true);
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to submit application", variant: "destructive" });
      }
    });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] text-gray-900 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md border-t-4 border-t-green-600 bg-white">
          <CardContent className="p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
              <Check className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-condensed font-bold mb-2">Welcome to Pitlane</h2>
            <p className="text-gray-600 mb-8">Your subscription application has been received. Our team will contact you shortly to assign a workshop.</p>
            <Link href="/" className="text-primary hover:underline font-condensed tracking-wider uppercase">
              Back to Home
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] text-gray-900 flex flex-col items-center py-12 px-4">
      <div className="mb-10 text-center">
        <div className="font-condensed font-bold text-5xl tracking-wider flex items-center justify-center mb-2">
          <span className="text-primary">PIT</span>
          <span className="text-gray-900">LANE</span>
        </div>
        <p className="text-gray-500 uppercase tracking-widest text-sm font-condensed">Subscriber Application</p>
      </div>

      <div className="w-full max-w-3xl bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Tier Selection */}
              <div>
                <h3 className="text-xl font-condensed font-bold mb-1 uppercase border-b pb-2">Select Your Plan</h3>
                <p className="text-xs text-gray-500 mt-2 mb-4">All plans include workshop assignment and access to the Pitlane network.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {tiers.map((t) => {
                    const selected = form.watch("tier") === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => form.setValue("tier", t.id as any)}
                        className={`relative rounded-lg border-2 cursor-pointer transition-all flex flex-col ${
                          selected
                            ? "border-primary bg-red-50 shadow-md"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        {t.highlight && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-condensed tracking-wider px-3 py-0.5 rounded-full uppercase">
                            Most Popular
                          </div>
                        )}
                        <div className="p-4 border-b border-gray-100">
                          <div className="font-condensed font-bold text-lg uppercase tracking-wide mb-2">{t.name}</div>
                          <div className="flex items-end gap-0.5 mb-1">
                            <span className="text-3xl font-condensed font-bold text-primary leading-none">{t.price}</span>
                            <span className="text-sm text-gray-500 mb-0.5">{t.period}</span>
                          </div>
                          <div className="text-xs text-gray-400">{t.joining}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{t.annual}</div>
                        </div>
                        <div className="p-4 flex-1">
                          <ul className="space-y-2">
                            {t.inclusions.map((inc) => (
                              <li key={inc} className="flex items-start gap-2 text-xs text-gray-600">
                                <CheckCircle2 className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${selected ? "text-primary" : "text-gray-400"}`} />
                                {inc}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Personal Info */}
                <div className="space-y-4">
                  <h3 className="text-xl font-condensed font-bold mb-4 uppercase border-b pb-2">Personal Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="fname" render={({ field }) => (
                      <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="lname" render={({ field }) => (
                      <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="suburb" render={({ field }) => (
                      <FormItem><FormLabel>Suburb</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </div>

                {/* Vehicle Info */}
                <div className="space-y-4">
                  <h3 className="text-xl font-condensed font-bold mb-4 uppercase border-b pb-2">Vehicle Details</h3>
                  <FormField control={form.control} name="make" render={({ field }) => (
                    <FormItem><FormLabel>Make (e.g. Toyota)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="model" render={({ field }) => (
                    <FormItem><FormLabel>Model (e.g. Corolla)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="year" render={({ field }) => (
                    <FormItem><FormLabel>Year</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </div>

              <div className="pt-6 border-t">
                <FormField control={form.control} name="consent" render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 bg-gray-50 rounded-lg">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>I agree to the Terms of Service and Privacy Policy</FormLabel>
                      <p className="text-sm text-gray-500">I consent to being matched with a partner workshop.</p>
                    </div>
                  </FormItem>
                )} />
              </div>

              <Button type="submit" className="w-full text-lg font-condensed tracking-wider py-6" disabled={signupMutation.isPending}>
                {signupMutation.isPending ? "SUBMITTING..." : "COMPLETE APPLICATION"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
      
      <div className="mt-8 text-center space-y-2">
        <div>
          <Link href="/" className="text-gray-400 hover:text-primary font-condensed tracking-wider uppercase transition-colors text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
