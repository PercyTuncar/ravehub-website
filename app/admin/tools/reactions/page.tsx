import { ReactionFixer } from "@/components/admin/reaction-fixer"

export default function ReactionFixerPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Herramientas de Administración - Corrector de Reacciones</h1>
      <p className="text-muted-foreground mb-8">
        Esta herramienta te permite corregir y normalizar las reacciones en los posts del blog para evitar problemas
        como reacciones duplicadas o mal formateadas.
      </p>
      <ReactionFixer />
    </div>
  )
}
