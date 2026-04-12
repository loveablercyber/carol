import AdminBackup from '@/components/admin/AdminBackup'

export default function AdminBackupPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display font-bold text-3xl text-foreground">
        Backup
      </h1>
      <AdminBackup />
    </div>
  )
}

