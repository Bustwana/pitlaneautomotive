import React, { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  useListSubscribers,
  useCreateSubscriber,
  useUpdateSubscriber,
  useDeleteSubscriber,
  useListMechanics,
  getListSubscribersQueryKey,
  type Subscriber,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit2, Trash2, ChevronRight, Car, Phone, Mail, MapPin, Calendar, Wrench, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as z from "zod";

const subscriberSchema = z.object({
  fname: z.string().min(1, "First name is required"),
  lname: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  email: z.string().email("Valid email required").or(z.literal("")).optional(),
  suburb: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.string().optional(),
  tier: z.enum(["basic", "standard", "annual"]),
  mechId: z.coerce.number().optional().nullable(),
  nextService: z.string().optional().nullable(),
  consent: z.enum(["yes", "pending"]).optional(),
});


const tierPricing: Record<string, { weekly: string; annual: string; joining: string; services: string }> = {
  basic:    { weekly: "$7/wk",  annual: "$299/yr",      joining: "$130",       services: "1 service/yr + mid-year check" },
  standard: { weekly: "$13/wk", annual: "$450/yr",      joining: "$160",       services: "2 services/yr + bonus inclusions" },
  annual:   { weekly: "—",      annual: "$299–$450/yr", joining: "No fee",     services: "Tier-dependent inclusions" },
};

const tierStyle = (tier: string) => {
  if (tier === "annual") return "text-green-500 border-green-500/30 bg-green-500/5";
  if (tier === "standard") return "text-primary border-primary/30 bg-primary/5";
  return "text-muted-foreground border-border";
};

export default function Subscribers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: subscribers, isLoading } = useListSubscribers();
  const { data: mechanics } = useListMechanics();

  const createSub = useCreateSubscriber();
  const updateSub = useUpdateSubscriber();
  const deleteSub = useDeleteSubscriber();

  const [selected, setSelected] = useState<Subscriber | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm<z.infer<typeof subscriberSchema>>({
    resolver: zodResolver(subscriberSchema),
    defaultValues: {
      fname: "", lname: "", phone: "", email: "", suburb: "",
      make: "", model: "", year: "", tier: "standard", mechId: null,
      nextService: null, consent: "pending",
    },
  });

  const openAdd = () => {
    setEditingId(null);
    form.reset({ fname: "", lname: "", phone: "", email: "", suburb: "", make: "", model: "", year: "", tier: "standard", mechId: null, nextService: null, consent: "pending" });
    setIsFormOpen(true);
  };

  const openEdit = (sub: Subscriber) => {
    setEditingId(sub.id);
    form.reset({
      fname: sub.fname, lname: sub.lname, phone: sub.phone || "", email: sub.email || "",
      suburb: sub.suburb || "", make: sub.make || "", model: sub.model || "", year: sub.year || "",
      tier: sub.tier as any, mechId: sub.mechId ?? null,
      nextService: sub.nextService ? sub.nextService.split("T")[0] : null,
      consent: sub.consent as any,
    });
    setIsFormOpen(true);
  };

  const onSubmit = (values: z.infer<typeof subscriberSchema>) => {
    if (editingId) {
      updateSub.mutate({ id: editingId, data: values }, {
        onSuccess: (updated) => {
          queryClient.invalidateQueries({ queryKey: getListSubscribersQueryKey() });
          toast({ title: "Subscriber updated." });
          setIsFormOpen(false);
          setEditingId(null);
          setSelected(updated as any);
        },
      });
    } else {
      createSub.mutate({ data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSubscribersQueryKey() });
          toast({ title: "Subscriber added." });
          setIsFormOpen(false);
        },
      });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this subscriber?")) return;
    deleteSub.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSubscribersQueryKey() });
        toast({ title: "Subscriber deleted." });
        setSelected(null);
      },
    });
  };

  const workshopName = (mechId: number | null | undefined) =>
    mechanics?.find((m) => m.id === mechId)?.name ?? "Unassigned";

  return (
    <AdminLayout title="Subscribers">
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-border flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {subscribers?.length ?? 0} subscriber{subscribers?.length !== 1 ? "s" : ""}
          </p>
          <Button size="sm" className="font-condensed tracking-wider uppercase" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Subscriber
          </Button>
        </div>

        <div>
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : subscribers?.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm">No subscribers yet</div>
          ) : (
            subscribers?.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelected(sub)}
                className="w-full flex items-center gap-4 px-4 py-3.5 border-b border-border/50 hover:bg-muted/40 transition-colors text-left group"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{sub.fname} {sub.lname}</div>
                  <div className="text-xs text-muted-foreground truncate mt-0.5">
                    {sub.year} {sub.make} {sub.model}
                    {sub.suburb ? ` · ${sub.suburb}` : ""}
                  </div>
                </div>
                <Badge variant="outline" className={`text-xs font-condensed tracking-wider shrink-0 ${tierStyle(sub.tier)}`}>
                  {sub.tier.toUpperCase()}
                </Badge>
                <div className="text-xs text-muted-foreground shrink-0 hidden sm:block w-32 truncate text-right">
                  {workshopName(sub.mechId)}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md bg-card border-l border-border flex flex-col gap-0 p-0">
          {selected && (
            <>
              <SheetHeader className="px-6 py-5 border-b border-border bg-card/80">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <SheetTitle className="font-condensed text-2xl uppercase tracking-wide">
                      {selected.fname} {selected.lname}
                    </SheetTitle>
                    <Badge variant="outline" className={`mt-1.5 text-xs font-condensed tracking-wider ${tierStyle(selected.tier)}`}>
                      {selected.tier.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                <Section title="Contact">
                  <DetailRow icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={selected.email || "—"} />
                  <DetailRow icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={selected.phone || "—"} />
                  <DetailRow icon={<MapPin className="h-3.5 w-3.5" />} label="Suburb" value={selected.suburb || "—"} />
                </Section>

                <Section title="Vehicle">
                  <DetailRow icon={<Car className="h-3.5 w-3.5" />} label="Make" value={selected.make || "—"} />
                  <DetailRow icon={<Car className="h-3.5 w-3.5" />} label="Model" value={selected.model || "—"} />
                  <DetailRow icon={<Car className="h-3.5 w-3.5" />} label="Year" value={selected.year || "—"} />
                </Section>

                <Section title="Subscription">
                  <DetailRow icon={<Wrench className="h-3.5 w-3.5" />} label="Workshop" value={workshopName(selected.mechId)} />
                  <DetailRow
                    icon={<Calendar className="h-3.5 w-3.5" />}
                    label="Next Service"
                    value={selected.nextService ? new Date(selected.nextService).toLocaleDateString() : "—"}
                  />
                  <DetailRow
                    icon={<span className="h-3.5 w-3.5 text-xs flex items-center justify-center">✓</span>}
                    label="Consent"
                    value={selected.consent === "yes" ? "Given" : "Pending"}
                  />
                </Section>

                {(() => {
                  const p = tierPricing[selected.tier];
                  if (!p) return null;
                  return (
                    <div className="rounded-lg bg-secondary/40 border border-border p-4 space-y-3">
                      <div className="text-xs font-condensed uppercase tracking-widest text-muted-foreground pb-1.5 border-b border-border/60">
                        Pricing Summary
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {p.weekly !== "—" && (
                          <div className="space-y-0.5">
                            <div className="text-xs text-muted-foreground">Weekly</div>
                            <div className="text-lg font-condensed font-bold text-foreground">{p.weekly}</div>
                          </div>
                        )}
                        <div className="space-y-0.5">
                          <div className="text-xs text-muted-foreground">Annual</div>
                          <div className="text-lg font-condensed font-bold text-foreground">{p.annual}</div>
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-xs text-muted-foreground">Joining Fee</div>
                          <div className="text-sm font-medium">{p.joining}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 pt-1 border-t border-border/60">
                        <DollarSign className="h-3.5 w-3.5 text-muted-foreground/60 mt-0.5 shrink-0" />
                        <span className="text-xs text-muted-foreground">{p.services}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="px-6 py-4 border-t border-border flex gap-3">
                <Button className="flex-1 font-condensed tracking-wider uppercase" onClick={() => openEdit(selected)}>
                  <Edit2 className="h-4 w-4 mr-2" /> Edit
                </Button>
                <Button variant="destructive" size="icon" onClick={() => handleDelete(selected.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) { setEditingId(null); form.reset(); } }}>
        <DialogContent className="border-t-4 border-t-primary bg-card max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-condensed text-2xl uppercase tracking-wider">
              {editingId ? "Edit Subscriber" : "New Subscriber"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="fname" render={({ field }) => (
                  <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="lname" render={({ field }) => (
                  <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="suburb" render={({ field }) => (
                  <FormItem><FormLabel>Suburb</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="tier" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tier</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="make" render={({ field }) => (
                  <FormItem><FormLabel>Make</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="model" render={({ field }) => (
                  <FormItem><FormLabel>Model</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="year" render={({ field }) => (
                  <FormItem><FormLabel>Year</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="mechId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned Workshop</FormLabel>
                    <Select onValueChange={(v) => field.onChange(v === "unassigned" ? null : parseInt(v))} value={field.value?.toString() ?? "unassigned"}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {mechanics?.map((m) => <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="nextService" render={({ field }) => (
                  <FormItem><FormLabel>Next Service</FormLabel><FormControl><Input type="date" value={field.value || ""} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="consent" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consent</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createSub.isPending || updateSub.isPending} className="font-condensed tracking-wider uppercase mt-2">
                  {editingId ? "Update Subscriber" : "Create Subscriber"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-condensed uppercase tracking-widest text-muted-foreground mb-3 pb-1.5 border-b border-border/60">
        {title}
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground/60 flex-shrink-0">{icon}</span>
      <span className="text-xs text-muted-foreground w-20 flex-shrink-0">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}
