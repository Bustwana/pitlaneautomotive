import React, { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  useListBookings,
  useCreateBooking,
  useUpdateBooking,
  useDeleteBooking,
  useListSubscribers,
  useListMechanics,
  getListBookingsQueryKey,
  type Booking,
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
import { Plus, Edit2, Trash2, ChevronRight, User, Wrench, Calendar, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as z from "zod";

const bookingSchema = z.object({
  subId: z.coerce.number().min(1, "Subscriber is required"),
  mechId: z.coerce.number().min(1, "Workshop is required"),
  service: z.string().min(1, "Service type is required"),
  date: z.string().optional().nullable(),
  value: z.coerce.number().optional().nullable(),
  status: z.enum(["pending", "active", "completed"]),
});


const statusStyle = (status: string) => {
  if (status === "active") return "text-green-500 border-green-500/30 bg-green-500/5";
  if (status === "pending") return "text-yellow-500 border-yellow-500/30 bg-yellow-500/5";
  return "text-muted-foreground border-border";
};

export default function Bookings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: bookings, isLoading } = useListBookings();
  const { data: subscribers } = useListSubscribers();
  const { data: mechanics } = useListMechanics();

  const createBooking = useCreateBooking();
  const updateBooking = useUpdateBooking();
  const deleteBooking = useDeleteBooking();

  const [selected, setSelected] = useState<Booking | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm<z.infer<typeof bookingSchema>>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { subId: 0, mechId: 0, service: "", date: null, value: null, status: "pending" },
  });

  const openAdd = () => {
    setEditingId(null);
    form.reset({ subId: 0, mechId: 0, service: "", date: null, value: null, status: "pending" });
    setIsFormOpen(true);
  };

  const openEdit = (booking: Booking) => {
    setEditingId(booking.id);
    form.reset({
      subId: booking.subId,
      mechId: booking.mechId,
      service: booking.service,
      date: booking.date ? booking.date.split("T")[0] : null,
      value: booking.value,
      status: booking.status as any,
    });
    setIsFormOpen(true);
  };

  const onSubmit = (values: z.infer<typeof bookingSchema>) => {
    if (editingId) {
      updateBooking.mutate({ id: editingId, data: values }, {
        onSuccess: (updated) => {
          queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
          toast({ title: "Booking updated." });
          setIsFormOpen(false);
          setEditingId(null);
          setSelected(updated as any);
        },
      });
    } else {
      createBooking.mutate({ data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
          toast({ title: "Booking created." });
          setIsFormOpen(false);
        },
      });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this booking?")) return;
    deleteBooking.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        toast({ title: "Booking deleted." });
        setSelected(null);
      },
    });
  };

  const subName = (id: number) => {
    const s = subscribers?.find((s) => s.id === id);
    return s ? `${s.fname} ${s.lname}` : "Unknown";
  };
  const mechName = (id: number) => mechanics?.find((m) => m.id === id)?.name ?? "Unknown";

  return (
    <AdminLayout title="Bookings Registry">
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-border flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {bookings?.length ?? 0} booking{bookings?.length !== 1 ? "s" : ""}
          </p>
          <Button size="sm" className="font-condensed tracking-wider uppercase" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Booking
          </Button>
        </div>

        <div>
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : bookings?.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm">No bookings yet</div>
          ) : (
            bookings?.map((booking) => (
              <button
                key={booking.id}
                onClick={() => setSelected(booking)}
                className="w-full flex items-center gap-4 px-4 py-3.5 border-b border-border/50 hover:bg-muted/40 transition-colors text-left group"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{booking.service}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">
                    {subName(booking.subId)} · {mechName(booking.mechId)}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                  {booking.date ? new Date(booking.date).toLocaleDateString() : "TBD"}
                </div>
                {booking.value ? (
                  <div className="text-xs font-mono text-muted-foreground shrink-0 hidden md:block">
                    ${booking.value}
                  </div>
                ) : null}
                <Badge variant="outline" className={`text-xs font-condensed tracking-wider shrink-0 ${statusStyle(booking.status)}`}>
                  {booking.status.toUpperCase()}
                </Badge>
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
                      {selected.service}
                    </SheetTitle>
                    <Badge variant="outline" className={`mt-1.5 text-xs font-condensed tracking-wider ${statusStyle(selected.status)}`}>
                      {selected.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground font-condensed pt-1">#{selected.id}</div>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                <Section title="Details">
                  <DetailRow icon={<User className="h-3.5 w-3.5" />} label="Subscriber" value={subName(selected.subId)} />
                  <DetailRow icon={<Wrench className="h-3.5 w-3.5" />} label="Workshop" value={mechName(selected.mechId)} />
                  <DetailRow
                    icon={<Calendar className="h-3.5 w-3.5" />}
                    label="Date"
                    value={selected.date ? new Date(selected.date).toLocaleDateString("en-AU", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "TBD"}
                  />
                  <DetailRow
                    icon={<DollarSign className="h-3.5 w-3.5" />}
                    label="Value"
                    value={selected.value ? `$${selected.value.toLocaleString()}` : "—"}
                  />
                </Section>

                {subscribers?.find((s) => s.id === selected.subId) && (
                  <Section title="Subscriber Vehicle">
                    {(() => {
                      const sub = subscribers.find((s) => s.id === selected.subId)!;
                      return (
                        <>
                          <DetailRow icon={<span className="text-xs">🚗</span>} label="Vehicle" value={`${sub.year ?? ""} ${sub.make ?? ""} ${sub.model ?? ""}`.trim() || "—"} />
                          <DetailRow icon={<span className="text-xs">📋</span>} label="Tier" value={sub.tier.toUpperCase()} />
                        </>
                      );
                    })()}
                  </Section>
                )}
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
        <DialogContent className="border-t-4 border-t-primary bg-card max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-condensed text-2xl uppercase tracking-wider">
              {editingId ? "Edit Booking" : "New Booking"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="subId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Subscriber</FormLabel>
                  <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString() || ""}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select subscriber" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {subscribers?.map((s) => <SelectItem key={s.id} value={s.id.toString()}>{s.fname} {s.lname}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="mechId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Workshop</FormLabel>
                  <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString() || ""}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select workshop" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {mechanics?.map((m) => <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="service" render={({ field }) => (
                <FormItem><FormLabel>Service Type</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" value={field.value || ""} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="value" render={({ field }) => (
                  <FormItem><FormLabel>Retail Value ($)</FormLabel><FormControl><Input type="number" value={field.value || ""} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="submit" disabled={createBooking.isPending || updateBooking.isPending} className="font-condensed tracking-wider uppercase mt-2">
                  {editingId ? "Update Booking" : "Create Booking"}
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
