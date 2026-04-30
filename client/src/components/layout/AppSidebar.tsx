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
import { NavLink } from "react-router-dom"
import { useAuth } from "@/_core/hooks/useAuth"
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
    const { signOut, user } = useAuth();

    const handleLogout = () => {
        signOut();
        toast.success("Your session has ended");
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
                                    <SidebarMenuButton asChild tooltip={item.title}>
                                        <NavLink to={item.url} end={item.url === "/"}>
                                            {({ isActive }) => (
                                                <>
                                                    <item.icon className={isActive ? "text-violet-500" : ""} />
                                                    <span>{item.title}</span>
                                                </>
                                            )}
                                        </NavLink>
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
                            <span className="text-sm text-slate-600">{user?.username ?? "Sair"}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
