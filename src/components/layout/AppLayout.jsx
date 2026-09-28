export default function AppLayout({ children, navigation }) {
  return (
    <div className="min-h-screen pb-[calc(var(--bottom-navigation-height)+env(safe-area-inset-bottom))] bg-[#f2f4f6] text-[#191f28]">
      <main className="mx-auto max-w-lg">
        {children}
      </main>

      {navigation}
    </div>
  )
}
