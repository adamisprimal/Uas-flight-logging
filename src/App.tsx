import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Plane, 
  ClipboardList, 
  Settings, 
  Plus, 
  Clock, 
  MapPin, 
  User,
  ShieldCheck,
  History,
  AlertTriangle,
  ChevronRight,
  Menu,
  X
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { format } from "date-fns";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types
interface Drone {
  id: number;
  name: string;
  model: string;
  serial_number: string;
  status: string;
  total_flight_time: number;
}

interface Flight {
  id: number;
  drone_id: number;
  drone_name: string;
  pilot_name: string;
  date: string;
  duration_minutes: number;
  location: string;
  purpose: string;
  notes: string;
}

interface Stats {
  totalFlights: number;
  totalDuration: number;
  droneStats: { name: string; flight_count: number; total_time: number }[];
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "flights" | "drones" | "checklists">("dashboard");
  const [drones, setDrones] = useState<Drone[]>([]);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showNewFlightModal, setShowNewFlightModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dronesRes, flightsRes, statsRes] = await Promise.all([
        fetch("/api/drones"),
        fetch("/api/flights"),
        fetch("/api/stats")
      ]);
      setDrones(await dronesRes.json());
      setFlights(await flightsRes.json());
      setStats(await statsRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleNewFlight = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    try {
      const res = await fetch("/api/flights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          duration_minutes: parseInt(data.duration_minutes as string),
          drone_id: parseInt(data.drone_id as string),
          date: new Date().toISOString()
        })
      });
      if (res.ok) {
        setShowNewFlightModal(false);
        fetchData();
      }
    } catch (error) {
      console.error("Error creating flight:", error);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "bg-[#151619] text-white transition-all duration-300 flex flex-col",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Plane className="w-5 h-5 text-white" />
          </div>
          {isSidebarOpen && <span className="font-bold text-lg tracking-tight">SkyLog Pro</span>}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeTab === "dashboard"} 
            onClick={() => setActiveTab("dashboard")}
            collapsed={!isSidebarOpen}
          />
          <NavItem 
            icon={<History size={20} />} 
            label="Flight Logs" 
            active={activeTab === "flights"} 
            onClick={() => setActiveTab("flights")}
            collapsed={!isSidebarOpen}
          />
          <NavItem 
            icon={<Plane size={20} />} 
            label="Fleet" 
            active={activeTab === "drones"} 
            onClick={() => setActiveTab("drones")}
            collapsed={!isSidebarOpen}
          />
          <NavItem 
            icon={<ClipboardList size={20} />} 
            label="Checklists" 
            active={activeTab === "checklists"} 
            onClick={() => setActiveTab("checklists")}
            collapsed={!isSidebarOpen}
          />
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            {isSidebarOpen && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-xl font-semibold capitalize">{activeTab}</h1>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowNewFlightModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-sm font-medium"
            >
              <Plus size={18} />
              New Flight
            </button>
            <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
              <User size={20} className="text-gray-600" />
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                  title="Total Flights" 
                  value={stats?.totalFlights || 0} 
                  icon={<History className="text-blue-500" />} 
                />
                <StatCard 
                  title="Total Air Time" 
                  value={`${Math.floor((stats?.totalDuration || 0) / 60)}h ${(stats?.totalDuration || 0) % 60}m`} 
                  icon={<Clock className="text-emerald-500" />} 
                />
                <StatCard 
                  title="Active Fleet" 
                  value={drones.length} 
                  icon={<Plane className="text-orange-500" />} 
                />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Flight Activity</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={flights.slice(0, 7).reverse()}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(val) => format(new Date(val), "MMM d")}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#9CA3AF' }}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#9CA3AF' }}
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="duration_minutes" 
                          stroke="#10B981" 
                          strokeWidth={3} 
                          dot={{ r: 4, fill: '#10B981' }} 
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Fleet Utilization (Minutes)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.droneStats || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#9CA3AF' }}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#9CA3AF' }}
                        />
                        <Tooltip 
                          cursor={{ fill: '#F9FAFB' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="total_time" radius={[4, 4, 0, 0]}>
                          {(stats?.droneStats || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#3B82F6', '#F59E0B', '#10B981'][index % 3]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Recent Flights Table */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold">Recent Flights</h3>
                  <button onClick={() => setActiveTab("flights")} className="text-emerald-600 text-sm font-medium hover:underline">View All</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4 font-medium">Date</th>
                        <th className="px-6 py-4 font-medium">Drone</th>
                        <th className="px-6 py-4 font-medium">Pilot</th>
                        <th className="px-6 py-4 font-medium">Duration</th>
                        <th className="px-6 py-4 font-medium">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {flights.slice(0, 5).map((flight) => (
                        <tr key={flight.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                          <td className="px-6 py-4 text-sm">{format(new Date(flight.date), "MMM d, yyyy")}</td>
                          <td className="px-6 py-4 text-sm font-medium">{flight.drone_name}</td>
                          <td className="px-6 py-4 text-sm">{flight.pilot_name}</td>
                          <td className="px-6 py-4 text-sm">{flight.duration_minutes}m</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{flight.location}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "flights" && (
             <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold">All Flight Logs</h3>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Search logs..." 
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4 font-medium">Date</th>
                        <th className="px-6 py-4 font-medium">Drone</th>
                        <th className="px-6 py-4 font-medium">Pilot</th>
                        <th className="px-6 py-4 font-medium">Duration</th>
                        <th className="px-6 py-4 font-medium">Location</th>
                        <th className="px-6 py-4 font-medium">Purpose</th>
                        <th className="px-6 py-4 font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {flights.map((flight) => (
                        <tr key={flight.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm whitespace-nowrap">{format(new Date(flight.date), "MMM d, yyyy HH:mm")}</td>
                          <td className="px-6 py-4 text-sm font-medium">{flight.drone_name}</td>
                          <td className="px-6 py-4 text-sm">{flight.pilot_name}</td>
                          <td className="px-6 py-4 text-sm">{flight.duration_minutes}m</td>
                          <td className="px-6 py-4 text-sm">{flight.location}</td>
                          <td className="px-6 py-4 text-sm">{flight.purpose}</td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{flight.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
          )}

          {activeTab === "drones" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {drones.map((drone) => (
                <div key={drone.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                      <Plane className="text-gray-600 group-hover:text-emerald-600" />
                    </div>
                    <span className={cn(
                      "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
                      drone.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    )}>
                      {drone.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-lg mb-1">{drone.name}</h4>
                  <p className="text-sm text-gray-500 mb-4">{drone.model}</p>
                  <div className="space-y-2 border-t border-gray-100 pt-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Serial Number</span>
                      <span className="font-mono">{drone.serial_number}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Total Air Time</span>
                      <span className="font-medium">{Math.floor(drone.total_flight_time / 60)}h {drone.total_flight_time % 60}m</span>
                    </div>
                  </div>
                </div>
              ))}
              <button 
                className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-emerald-500 hover:text-emerald-500 transition-all bg-white/50"
              >
                <Plus size={32} />
                <span className="font-medium">Add New Drone</span>
              </button>
            </div>
          )}

          {activeTab === "checklists" && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <ShieldCheck className="text-emerald-600" size={24} />
                  <h3 className="text-xl font-bold">Pre-Flight Checklist</h3>
                </div>
                <div className="space-y-4">
                  <CheckItem label="Propellers secured and undamaged" />
                  <CheckItem label="Battery fully charged and locked" />
                  <CheckItem label="MicroSD card inserted and formatted" />
                  <CheckItem label="Remote controller connected" />
                  <CheckItem label="GPS signal acquired (10+ satellites)" />
                  <CheckItem label="Compass calibrated" />
                  <CheckItem label="IMU status normal" />
                  <CheckItem label="Area clear of obstacles and people" />
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <AlertTriangle className="text-orange-600" size={24} />
                  <h3 className="text-xl font-bold">Post-Flight Checklist</h3>
                </div>
                <div className="space-y-4">
                  <CheckItem label="Drone powered off" />
                  <CheckItem label="Battery removed and inspected for heat" />
                  <CheckItem label="Propellers inspected for damage" />
                  <CheckItem label="Lens cap replaced" />
                  <CheckItem label="Flight logs synced" />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* New Flight Modal */}
      {showNewFlightModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold">Log New Flight</h3>
              <button onClick={() => setShowNewFlightModal(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
            </div>
            <form onSubmit={handleNewFlight} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Drone</label>
                  <select name="drone_id" required className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none">
                    {drones.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Pilot Name</label>
                  <input name="pilot_name" required type="text" className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" placeholder="John Doe" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Duration (min)</label>
                  <input name="duration_minutes" required type="number" className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" placeholder="15" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Location</label>
                  <input name="location" required type="text" className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" placeholder="Central Park" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Purpose</label>
                <input name="purpose" required type="text" className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" placeholder="Aerial Photography" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Notes</label>
                <textarea name="notes" rows={3} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none" placeholder="Any issues or observations..."></textarea>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowNewFlightModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-sm">Save Flight Log</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function NavItem({ icon, label, active, onClick, collapsed }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, collapsed: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group",
        active ? "bg-emerald-600 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
      )}
    >
      <div className={cn("shrink-0 transition-transform", active && "scale-110")}>{icon}</div>
      {!collapsed && <span className="font-medium">{label}</span>}
      {!collapsed && active && <ChevronRight size={14} className="ml-auto opacity-50" />}
    </button>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
        {icon}
      </div>
    </div>
  );
}

function CheckItem({ label }: { label: string }) {
  const [checked, setChecked] = useState(false);
  return (
    <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
      <div 
        onClick={() => setChecked(!checked)}
        className={cn(
          "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all",
          checked ? "bg-emerald-500 border-emerald-500" : "border-gray-200 group-hover:border-emerald-300"
        )}
      >
        {checked && <ShieldCheck size={14} className="text-white" />}
      </div>
      <span className={cn("text-sm font-medium transition-all", checked ? "text-gray-400 line-through" : "text-gray-700")}>
        {label}
      </span>
    </label>
  );
}
