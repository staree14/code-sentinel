"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Activity, 
  Cpu, 
  DollarSign, 
  TrendingDown, 
  Clock, 
  Calendar,
  ChevronLeft,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import { Nav } from "@/components/nav";

interface AnalyticsData {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  modelUsage: Record<string, number>;
  costSavedEstimate: number;
}

const COLORS = ['#00ff66', '#00E5FF', '#9333EA', '#ffbd2e'];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const resp = await fetch("http://localhost:8000/api/analytics");
      if (!resp.ok) throw new Error("Failed to fetch analytics");
      const d = await resp.json();
      setData(d);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const email = localStorage.getItem("user_email");
    if (!email) {
      router.push("/login");
      return;
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center font-press-start text-[#00ff66] text-xs">
        INITIALIZING_ANALYTICS_KERNEL...
      </div>
    );
  }

  const modelUsageData = data ? Object.entries(data.modelUsage).map(([name, value]) => ({ name, value })) : [];
  
  const costData = data ? [
    { name: 'Actual Cost', value: data.totalCost },
    { name: 'Cost Saved', value: data.costSavedEstimate }
  ] : [];

  return (
    <main className="min-h-screen bg-[#050505] text-[#eee] p-8 pt-24 font-ibm-plex">
      <Nav />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,255,100,0.02)_0,transparent_50%)] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto space-y-8 relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[var(--green)] mb-2">
              <Activity size={18} />
              <span className="text-[0.65rem] font-press-start tracking-tighter uppercase">Operations_Center</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">System Performance & Analytics</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchAnalytics}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-xs font-press-start text-[#444] hover:text-[var(--green)] transition-colors"
            >
              <RefreshCw size={14} />
              SYNC_DATA
            </button>
            <Link 
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 bg-[#00ff6611] border border-[#00ff6633] text-[var(--green)] text-xs font-press-start hover:bg-[#00ff6622] transition-colors"
            >
              <ChevronLeft size={14} />
              BACK_TO_DASHBOARD
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Requests", value: data?.totalRequests || 0, icon: Clock, color: "#00ff66" },
            { label: "Tokens Processed", value: (data?.totalTokens || 0).toLocaleString(), icon: Cpu, color: "#00E5FF" },
            { label: "Total Cost", value: `$${(data?.totalCost || 0).toFixed(4)}`, icon: DollarSign, color: "#ffbd2e" },
            { label: "Efficiency Savings", value: `$${(data?.costSavedEstimate || 0).toFixed(4)}`, icon: TrendingDown, color: "#9333EA" }
          ].map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="pixel-border bg-[#0d0d0d] p-6 space-y-2 border-l-2"
              style={{ borderLeftColor: stat.color + "44" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[0.55rem] font-press-start text-[#444] uppercase">{stat.label}</span>
                <stat.icon size={16} style={{ color: stat.color }} />
              </div>
              <div className="text-2xl font-bold font-mono tracking-tighter" style={{ color: stat.color }}>
                {stat.value}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Graphs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-24">
          {/* Model Usage */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pixel-border bg-[#0d0d0d] p-6 h-[400px] flex flex-col"
          >
            <h3 className="text-xs font-press-start text-[#444] mb-8 uppercase tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 bg-[var(--green)]" />
              Core_Model_Distribution
            </h3>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelUsageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="name" stroke="#444" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#444" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ background: '#0d0d0d', border: '1px solid #333' }}
                    itemStyle={{ color: '#00ff66' }}
                    cursor={{ fill: '#ffffff05' }}
                  />
                  <Bar dataKey="value" fill="#00ff6666" stroke="#00ff66" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Cost Savings */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pixel-border bg-[#0d0d0d] p-6 h-[400px] flex flex-col"
          >
            <h3 className="text-xs font-press-start text-[#444] mb-8 uppercase tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500" />
              Efficiency_Analysis
            </h3>
            <div className="flex-1 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {costData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.8} stroke={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: '#0d0d0d', border: '1px solid #333' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'var(--font-press-start)' }} verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Full Width Token Usage Visualization - Placeholder/Demo for now */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pixel-border bg-[#0d0d0d] p-6 h-[400px] flex flex-col lg:col-span-2"
          >
             <h3 className="text-xs font-press-start text-[#444] mb-8 uppercase tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500" />
              Node_Resource_Utilization // Token_Load
            </h3>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[
                  { name: '00:00', tokens: 120 },
                  { name: '04:00', tokens: 450 },
                  { name: '08:00', tokens: 800 },
                  { name: '12:00', tokens: 1200 },
                  { name: '16:00', tokens: 900 },
                  { name: '20:00', tokens: 1500 },
                  { name: '23:59', tokens: 300 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={true} />
                  <XAxis dataKey="name" stroke="#444" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#444" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ background: '#0d0d0d', border: '1px solid #333' }}
                    itemStyle={{ color: '#00E5FF' }}
                  />
                  <Line type="monotone" dataKey="tokens" stroke="#00E5FF" strokeWidth={2} dot={{ r: 4, fill: '#00E5FF' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
