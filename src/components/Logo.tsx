export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'text-xl', md: 'text-2xl', lg: 'text-3xl' }
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-lg">
        V
      </div>
      <span className={`font-bold tracking-tight text-gray-900 ${sizes[size]}`}>
        VATTAMS
      </span>
    </div>
  )
}
