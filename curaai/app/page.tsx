import { DashboardLayout } from "@/components/dashboard-layout"
import { PatientList } from "@/components/patient-list"
import { ConsultationChat } from "@/components/consultation-chat"
import { PatientDetails } from "@/components/patient-details"
import { AuthRedirect } from "@/components/auth-redirect"

export default function Home() {
  return (
    <>
      <AuthRedirect />
      <DashboardLayout>
        <PatientList />
        <ConsultationChat />
        <PatientDetails />
      </DashboardLayout>
    </>
  )
}
