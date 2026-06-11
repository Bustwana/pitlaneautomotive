import React, { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  useListMechanics,
  useCreateMechanic,
  useUpdateMechanic,
  useDeleteMechanic,
  useListSubscribers,
  getListMechanicsQueryKey,
  type Mechanic,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit2, Trash2, ChevronRight, Mail, Phone, MapPin, Users, Percent } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as z from "zod";

const mechanicSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contact: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Valid email required").or(z.literal("")).optional(),
  location: z.string().optional(),
  discount: z.coerce.number().min(0).max(100),
  revShare: z.coerce.number().min(0).max(100),
  password: z.string().optional(),
});


export default function Mechanics() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: mechanics, isLoading } = useListMechanics();
  const { data: subscribers } = useListSubscribers();

  const createMech = useCreateMechanic();
  const updateMech = useUpdateMechanic();
  const deleteMech = useDeleteMechanic();

  const [selected, setSelected] = useState<Mechanic | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm<z.infer<typeof mechanicSchema>>({
    resolver: zodResolver(mechanicSchema),
    defaultValues: { name: "", contact: "", phone: "", email: "", location: "", discount: 0, revShare: 0, password: "" },
  });

  const openAdd = () => {
    setEditingId(null);
    form.reset({ name: "", contact: "", phone: "", email: "", location: "", discount: 0, revShare: 0, password: "" });
    setIsFormOpen(true);
  };

  const openEdit = (mech: Mechanic) => {
    setEditingId(mech.id);
    form.reset({
      name: mech.name, contact: mech.contact || "", phone: mech.phone || "", email: mech.email || "",
      location: mech.location || "", discount: mech.discount, revShare: mech.revShare, password: "",
    });
    setIsFormOpen(true);
  };

  const onSubmit = (values: z.infer<typeof mechanicSchema>) => {
    if (editingId) {
      updateMech.mutate({ id: editingId, data: values }, {
        onSuccess: (updated) => {
          queryClient.invalidateQueries({ queryKey: getListMechanicsQueryKey() });
          toast({ title: "Workshop updated." });
          setIsFormOpen(false);
          setEditingId(null);
          setSelected(updated as any);
        },
      });
    } else {
      createMech.mutate({ data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMechanicsQueryKey() });
          toast({ title: "Workshop added." });
          setIsFormOpen(false);
        },
      });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this workshop?")) return;
    deleteMech.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMechanicsQueryKey() });
        toast({ title: "Workshop deleted." });
        setSelected(null);
      },
    });
  };

  const subCount = (mechId: number) =>
    subscribers?.filter((s) => s.mechId === mechId).length ?? 0;

  return (
    <AdminLayout title="Partner Workshops">
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-border flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {mechanics?.length ?? 0} workshop{mechanics?.length !== 1 ? "s" : ""}
          </p>
          <Button size="sm" className="font-condensed tracking-wider uppercase" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Workshop
          </Button>
        </div>

        <div>
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : mechanics?.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm">No workshops yet</div>
          ) : (
            mechanics?.map((mech) => (
              <button
                key={mech.id}
                onClick={() => setSelected(mech)}
                className="w-full flex items-center gap-4 px-4 py-3.5 border-b border-border/50 hover:bg-muted/40 transition-colors text-left group"
              >
                <div className="font-condensed font-bold text-primary tracking-wider text-sm w-20 shrink-0">
                  {mech.code}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{mech.name}</div>
                  <div className="text-xs text-muted-foreground truncate mt-0.5">
                    {mech.location || "No location set"}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground shrink-0 hidden sm:flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {subCount(mech.id)} sub{subCount(mech.id) !== 1 ? "s" : ""}
                </div>
                <div className="text-xs text-muted-foreground shrink-0 hidden md:block">
                  {mech.revShare}% rev
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
                <div className="flex items-start gap-3">
                  <div className="font-condensed font-bold text-primary tracking-wider text-xl pt-0.5">
                    {selected.code}
                  </div>
                  <SheetTitle className="font-condensed text-2xl uppercase tracking-wide">
                    {selected.name}
                  </SheetTitle>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                <Section title="Contact">
                  <DetailRow icon={<span className="text-xs">👤</span>} label="Contact" value={selected.contact || "—"} />
                  <DetailRow icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={selected.email || "—"} />
                  <DetailRow icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={selected.phone || "—"} />
                  <DetailRow icon={<MapPin className="h-3.5 w-3.5" />} label="Location" value={selected.location || "—"} />
                </Section>

                <Section title="Terms">
                  <DetailRow icon={<Percent className="h-3.5 w-3.5" />} label="Discount" value={`${selected.discount}%`} />
                  <DetailRow icon={<Percent className="h-3.5 w-3.5" />} label="Rev Share" value={`${selected.revShare}%`} />
                </Section>

                <Section title="Subscribers">
                  {subscribers?.filter((s) => s.mechId === selected.id).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No subscribers assigned</p>
                  ) : (
                    <div className="space-y-2">
                      {subscribers?.filter((s) => s.mechId === selected.id).map((s) => (
                        <div key={s.id} className="flex items-center justify-between text-sm bg-secondary/40 rounded px-3 py-2">
                          <span>{s.fname} {s.lname}</span>
                          <span className="text-xs text-muted-foreground font-condensed uppercase">{s.tier}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>
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
              {editingId ? "Edit Workshop" : "New Workshop"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Workshop Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="contact" render={({ field }) => (
                  <FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="location" render={({ field }) => (
                  <FormItem className="col-span-2"><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="discount" render={({ field }) => (
                  <FormItem><FormLabel>Discount %</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="revShare" render={({ field }) => (
                  <FormItem><FormLabel>Revenue Share %</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Portal Password {editingId ? "(Leave blank to keep unchanged)" : ""}</FormLabel>
                    <FormControl><Input type="password" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMech.isPending || updateMech.isPending} className="font-condensed tracking-wider uppercase mt-2">
                  {editingId ? "Update Workshop" : "Create Workshop"}
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
