interface HubHeaderProps {
  title: string
  subtitle?: string
}

export default function HubHeader({ title, subtitle }: HubHeaderProps) {
  return (
    <header className="px-5 pt-8 pb-4">
      <h1
        className="text-3xl font-semibold"
        style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F2EDE4' }}
      >
        {title}
      </h1>
      {subtitle && (
        <p
          className="text-sm mt-2"
          style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
        >
          {subtitle}
        </p>
      )}
    </header>
  )
}
