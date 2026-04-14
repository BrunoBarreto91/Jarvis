import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="w-full min-h-screen bg-slate-50 relative">
                <div className="p-4 flex items-center gap-2">
                    <SidebarTrigger />
                    <span className="text-sm text-slate-400">Jarvis</span>
                </div>
                <div className="p-4 md:p-8 pt-0">
                    {children}
                </div>
            </main>
        </SidebarProvider>
    )
}
