import { useEffect, useMemo, useState } from 'react';
import { Loader, Wrench, MapPin, Phone, DollarSign, CheckCircle, Clock, LogOut, Briefcase, Star } from 'lucide-react';
import { supabase, Technician, TechnicianJob, Booking, JobStatus } from '@/lib/supabase';
import { useRouter } from '@/lib/router';

type JobWithBooking = TechnicianJob & { booking?: Partial<Booking> };

const jobStatusColors: Record<string, string> = {
  assigned: 'bg-amber-100 text-amber-700 border-amber-200',
  accepted: 'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-purple-100 text-purple-700 border-purple-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
};

export default function TechnicianDashboard() {
  const { navigate } = useRouter();
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [jobs, setJobs] = useState<JobWithBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileInput, setMobileInput] = useState('');
  const [utrInput, setUtrInput] = useState('');
  const [showLogin, setShowLogin] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadJobs = async (mobile: string, utr: string) => {
    const { data, error } = await supabase.rpc('get_technician_jobs', {
      p_mobile: mobile,
      p_utr: utr,
    });
    if (error) {
      setJobs([]);
      return;
    }
    setJobs((data ?? []).map((j: Record<string, unknown>) => ({
      id: j.id as string,
      booking_id: j.booking_id as string,
      technician_id: j.technician_id as string,
      status: j.status as JobStatus,
      notes: (j.notes as string | null) ?? null,
      service_photo_urls: (j.service_photo_urls as string[]) ?? [],
      customer_signature: (j.customer_signature as string | null) ?? null,
      job_amount: (j.job_amount as number | null) ?? null,
      assigned_at: j.assigned_at as string,
      completed_at: (j.completed_at as string | null) ?? null,
      booking: {
        id: j.booking_id as string,
        booking_number: j.booking_number as string,
        customer_name: j.customer_name as string,
        mobile_number: j.mobile_number as string,
        city: j.city as string,
        address: j.address as string,
        service_category: j.service_category as string,
        problem_description: (j.problem_description as string | null) ?? null,
        preferred_date: (j.preferred_date as string | null) ?? null,
        preferred_time: (j.preferred_time as string | null) ?? null,
      },
    })));
  };

  const authenticate = async (mobile: string, utr: string) => {
    const { data, error } = await supabase.rpc('authenticate_technician', {
      p_mobile: mobile,
      p_utr: utr,
    });
    if (error || !data?.length) {
      setTechnician(null);
      setShowLogin(true);
      setLoading(false);
      return;
    }
    setTechnician(data[0] as Technician);
    sessionStorage.setItem('vattams_tech_mobile', mobile);
    sessionStorage.setItem('vattams_tech_utr', utr);
    setShowLogin(false);
    await loadJobs(mobile, utr);
    setLoading(false);
  };

  useEffect(() => {
    const mobile = sessionStorage.getItem('vattams_tech_mobile');
    const utr = sessionStorage.getItem('vattams_tech_utr');
    if (mobile && utr) {
      setMobileInput(mobile);
      setUtrInput(utr);
      void authenticate(mobile, utr);
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileInput.length !== 10 || !/^[A-Za-z0-9]{8,32}$/.test(utrInput.trim())) return;
    setLoading(true);
    await authenticate(mobileInput, utrInput.trim());
  };

  const updateJobStatus = async (jobId: string, status: JobStatus) => {
    const mobile = sessionStorage.getItem('vattams_tech_mobile') ?? '';
    const utr = sessionStorage.getItem('vattams_tech_utr') ?? '';
    setUpdatingId(jobId);
    const { data, error } = await supabase.rpc('update_technician_job_status', {
      p_mobile: mobile,
      p_utr: utr,
      p_job_id: jobId,
      p_status: status,
    });
    if (!error && data) {
      setJobs((prev) => prev.map((job) => job.id === jobId
        ? { ...job, status, completed_at: status === 'completed' ? new Date().toISOString() : job.completed_at }
        : job));
    }
    setUpdatingId(null);
  };

  const stats = useMemo(() => ({
    total: jobs.length,
    completed: jobs.filter((j) => j.status === 'completed').length,
    active: jobs.filter((j) => ['assigned', 'accepted', 'in_progress'].includes(j.status)).length,
    earnings: jobs.filter((j) => j.status === 'completed').reduce((sum, j) => sum + (j.job_amount ?? 0), 0),
  }), [jobs]);

  const logout = () => {
    sessionStorage.removeItem('vattams_tech_mobile');
    sessionStorage.removeItem('vattams_tech_utr');
    setTechnician(null);
    setJobs([]);
    setShowLogin(true);
    navigate('home');
  };

  if (loading) {
    return <div className="pt-20 md:pt-24 min-h-screen flex items-center justify-center bg-gray-50"><Loader className="animate-spin text-blue-600" size={32} /></div>;
  }

  if (showLogin || !technician) {
    return (
      <div className="pt-20 md:pt-24 min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 px-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <img src="/logo.svg" alt="VATTAMS HOME SERVICES" className="h-20 w-auto mx-auto mb-4 rounded-xl" />
            <h1 className="text-2xl font-extrabold text-white mb-1">Technician Portal</h1>
            <p className="text-blue-200 text-sm">Use your registered mobile number and verified UPI transaction ID / UTR.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="tel" required pattern="[0-9]{10}" value={mobileInput} onChange={(e) => setMobileInput(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200/50 outline-none" placeholder="10-digit mobile number" />
            <input type="password" required minLength={8} maxLength={32} value={utrInput} onChange={(e) => setUtrInput(e.target.value.replace(/\s/g, ''))}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200/50 outline-none" placeholder="Verified UPI transaction ID / UTR" />
            <button type="submit" disabled={loading} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold rounded-xl">Sign In</button>
          </form>
          <p className="text-center text-blue-200/50 text-xs mt-4">Don't have an account? <button onClick={() => navigate('technician-register')} className="text-blue-300 underline">Register here</button></p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 md:pt-24 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <img src="/logo.svg" alt="VATTAMS" className="h-14 w-auto rounded-xl" />
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-gray-900">{technician.full_name}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin size={13} /> {technician.city}
                <span className="text-gray-300">|</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">{technician.status}</span>
                {technician.rating > 0 && <span className="flex items-center gap-0.5 text-amber-500"><Star size={12} className="fill-amber-400" /> {technician.rating}</span>}
              </div>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-xl"><LogOut size={16} /> Logout</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Briefcase, label: 'Total Jobs', value: stats.total },
            { icon: Clock, label: 'Active Jobs', value: stats.active },
            { icon: CheckCircle, label: 'Completed', value: stats.completed },
            { icon: DollarSign, label: 'Earnings', value: `₹${stats.earnings.toLocaleString('en-IN')}` },
          ].map((s) => { const Icon = s.icon; return (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center mb-3"><Icon size={18} className="text-white" /></div>
              <div className="text-2xl font-extrabold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-400 font-medium">{s.label}</div>
            </div>
          ); })}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-extrabold text-gray-900 text-lg mb-4">Your Jobs</h2>
          {jobs.length === 0 ? <div className="text-center py-12"><Briefcase size={40} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-400 text-sm">No jobs assigned yet. Check back later.</p></div> :
            <div className="space-y-4">{jobs.map((job) => job.booking && (
              <div key={job.id} className="border border-gray-100 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div><div className="text-xs text-gray-400">Booking</div><div className="font-bold text-blue-700 text-sm">{job.booking.booking_number}</div></div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize border ${jobStatusColors[job.status]}`}>{job.status.replace('_', ' ')}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div className="flex items-center gap-1.5 text-gray-600"><Wrench size={14} /> {job.booking.service_category}</div>
                  <div className="flex items-center gap-1.5 text-gray-600"><MapPin size={14} /> {job.booking.city}</div>
                  <div className="flex items-center gap-1.5 text-gray-600"><Phone size={14} /> {job.booking.mobile_number}</div>
                  <div className="text-gray-600">{job.booking.customer_name}</div>
                </div>
                <div className="mb-3"><div className="text-xs text-gray-400 uppercase mb-1">Address</div><div className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{job.booking.address}</div></div>
                {job.booking.problem_description && <div className="mb-3"><div className="text-xs text-gray-400 uppercase mb-1">Problem</div><div className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{job.booking.problem_description}</div></div>}
                <div className="flex flex-wrap gap-2">
                  {job.status === 'assigned' && <>
                    <button onClick={() => updateJobStatus(job.id, 'accepted')} disabled={updatingId === job.id} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl disabled:opacity-60">Accept Job</button>
                    <button onClick={() => updateJobStatus(job.id, 'rejected')} disabled={updatingId === job.id} className="px-4 py-2 bg-red-50 text-red-600 text-sm font-semibold rounded-xl disabled:opacity-60">Reject</button>
                  </>}
                  {job.status === 'accepted' && <button onClick={() => updateJobStatus(job.id, 'in_progress')} disabled={updatingId === job.id} className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-xl disabled:opacity-60">Start Work</button>}
                  {job.status === 'in_progress' && <button onClick={() => updateJobStatus(job.id, 'completed')} disabled={updatingId === job.id} className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl disabled:opacity-60">Mark Complete</button>}
                </div>
              </div>
            ))}</div>}
        </div>
      </div>
    </div>
  );
}
