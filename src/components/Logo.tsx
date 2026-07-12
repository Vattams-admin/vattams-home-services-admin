import { Link } from 'react-router-dom'

export function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  return <Link to="/" className="flex items-center gap-2"><img src="/vattams.svg" alt="VATTAMS" className={className} /><span className="text-lg font-bold text-slate-900">VATTAMS</span></Link>
}
