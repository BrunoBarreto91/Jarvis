import { Home, ListTodo, Kanban, ShieldAlert, LogOut, Settings2 } from "lucide-react"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Link, useLocation } from "wouter"
import { useAuthContext } from "@/_core/context/AuthContext"
import { toast } from "sonner"

// Menu items.
const items = [
    {
        title: "Zen Mode",
        url: "/",
        icon: Home,
    },
    {
        title: "Tarefas",
        url: "/tasks",
        icon: ListTodo,
    },
    {
        title: "Kanban",
        url: "/kanban",
        icon: Kanban,
    },
    {
        title: "Bloqueadores",
        url: "/blockers",
        icon: ShieldAlert,
    },
    {
        title: "Configurações",
        url: "/settings",
        icon: Settings2,
    },
]

export function AppSidebar() {
    const [location] = useLocation();
    const { logout, user } = useAuthContext();

    const handleLogout = () => {
        logout();
        toast.success("Sessão encerrada.");
    };

    return (
        <Sidebar collapsible="icon" className="border-r border-slate-200">
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Jarvis</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={location === item.url} tooltip={item.title}>
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-slate-200 p-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton tooltip="Sair" onClick={handleLogout}>
                            <LogOut className="h-4 w-4" />
                            <span className="text-sm text-slate-600">{user?.email ?? "Sair"}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}

