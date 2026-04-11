export default function VerbumCanvasLoading() {
  return (
    <div
      className="flex flex-col items-center justify-center w-full h-screen gap-3"
      style={{ background: '#0A0806' }}
    >
      <div
        className="w-8 h-8 border-2 rounded-full animate-spin"
        style={{ borderColor: 'rgba(201,168,76,0.3)', borderTopColor: '#C9A84C' }}
      />
      <span
        className="text-xs tracking-widest uppercase"
        style={{ fontFamily: 'Cinzel, serif', color: '#6B5D4F' }}
      >
        Carregando Verbum...
      </span>
    </div>
  )
}
