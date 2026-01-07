import SharedCustomerLayout from "@/components/layout/SharedCustomerLayout"

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return <SharedCustomerLayout>{children}</SharedCustomerLayout>
}

