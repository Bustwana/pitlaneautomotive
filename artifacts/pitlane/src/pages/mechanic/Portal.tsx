import React from "react";
import { useParams } from "wouter";
import MechanicLayout from "@/components/layout/MechanicLayout";
import { 
  useGetMechanicStats,
  getGetMechanicStatsQueryKey
} from "@workspace/api-client-react";
import { StatCard } from "@/components/ui/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function MechanicPortal() {
  const params = useParams();
  const id = parseInt(params.id || "0");
  
  const { data: stats, isLoading } = useGetMechanicStats(id, { 
    query: { enabled: !!id, queryKey: getGetMechanicStatsQueryKey(id) } 
  });

  return (
    <MechanicLayout title="Workshop Operations">
      {isLoading ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      ) : stats ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="Your Subscribers" value={stats.totalSubscribers} />
            <StatCard label="Total Bookings" value={stats.totalBookings} />
            <StatCard label="Revenue Share Earned" value={`$${stats.revenueEarned.toLocaleString()}`} valueClassName="text-green-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upcoming Bookings */}
            <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border bg-card/50">
                <h3 className="font-condensed font-bold uppercase tracking-wider text-lg">Active & Upcoming Bookings</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-secondary/50 text-muted-foreground font-condensed uppercase tracking-wider text-xs">
                    <tr>
                      <th className="px-4 py-3">Service</th>
                      <th className="px-4 py-3">Client</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.upcomingBookings.map((booking) => {
                      const sub = stats.subscribers.find(s => s.id === booking.subId);
                      return (
                        <tr key={booking.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3 font-medium">{booking.service}</td>
                          <td className="px-4 py-3 text-muted-foreground">{sub ? `${sub.fname} ${sub.lname}` : 'Unknown'}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {booking.date ? new Date(booking.date).toLocaleDateString() : 'TBD'}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={
                              booking.status === 'active' ? 'text-green-500 border-green-500/30' : 
                              booking.status === 'pending' ? 'text-yellow-500 border-yellow-500/30' : 
                              'text-muted-foreground'
                            }>
                              {booking.status.toUpperCase()}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                    {stats.upcomingBookings.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No active bookings</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Assigned Subscribers */}
            <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border bg-card/50">
                <h3 className="font-condensed font-bold uppercase tracking-wider text-lg">Assigned Subscribers</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-secondary/50 text-muted-foreground font-condensed uppercase tracking-wider text-xs">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Vehicle</th>
                      <th className="px-4 py-3">Tier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.subscribers.map((sub) => (
                      <tr key={sub.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 font-medium">{sub.fname} {sub.lname}</td>
                        <td className="px-4 py-3 text-muted-foreground">{sub.year} {sub.make} {sub.model}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={
                            sub.tier === 'standard' ? 'text-primary border-primary/30' : 
                            sub.tier === 'annual' ? 'text-green-500 border-green-500/30' : 
                            'text-muted-foreground'
                          }>
                            {sub.tier.toUpperCase()}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {stats.subscribers.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No assigned subscribers</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </MechanicLayout>
  );
}
