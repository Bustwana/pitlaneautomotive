import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth";
import NotFound from "@/pages/not-found";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminSubscribers from "@/pages/admin/Subscribers";
import AdminMechanics from "@/pages/admin/Mechanics";
import AdminBookings from "@/pages/admin/Bookings";
import MechanicPortal from "@/pages/mechanic/Portal";

const queryClient = new QueryClient();

function Redirect({ to }: { to: string }) {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation(to);
  }, [to, setLocation]);
  return null;
}

function ProtectedAdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { role } = useAuth();
  if (role !== "admin") return <Redirect to="/login" />;
  return <Component />;
}

function ProtectedMechanicRoute({ component: Component }: { component: React.ComponentType }) {
  const { role } = useAuth();
  if (role !== "mechanic") return <Redirect to="/login" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />

      <Route path="/admin">
        {() => <Redirect to="/admin/dashboard" />}
      </Route>
      <Route path="/admin/dashboard">
        {() => <ProtectedAdminRoute component={AdminDashboard} />}
      </Route>
      <Route path="/admin/subscribers">
        {() => <ProtectedAdminRoute component={AdminSubscribers} />}
      </Route>
      <Route path="/admin/mechanics">
        {() => <ProtectedAdminRoute component={AdminMechanics} />}
      </Route>
      <Route path="/admin/bookings">
        {() => <ProtectedAdminRoute component={AdminBookings} />}
      </Route>

      <Route path="/mechanic/:id">
        {() => <ProtectedMechanicRoute component={MechanicPortal} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
