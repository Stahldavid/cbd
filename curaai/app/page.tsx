import { DashboardLayout } from "@/components/dashboard-layout"
import { PatientList } from "@/components/patient-list"
import { ConsultationChat } from "@/components/consultation-chat"
import { PatientDetails } from "@/components/patient-details"

export default function Home() {
  return (
    <DashboardLayout>
      <PatientList />
      <ConsultationChat />
      <PatientDetails />
    </DashboardLayout>
  )
}
