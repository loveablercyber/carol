import AdminReviews from '@/components/admin/AdminReviews'

export default function AdminReviewsPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display font-bold text-3xl text-foreground">
        Comentarios
      </h1>
      <AdminReviews />
    </div>
  )
}

