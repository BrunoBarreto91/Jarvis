import { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

/**
 * ErrorBoundary — Jarvis Resiliency Layer
 *
 * Isolates failures in individual components so the sidebar and layout
 * remain functional even if page content crashes.
 */
export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("🚨 ErrorBoundary caught an error:", error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center min-h-[60vh] p-8">
                    <Card className="max-w-md border-red-200 bg-red-50">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-8 h-8 text-red-600" />
                                <CardTitle className="text-red-800">Algo deu errado</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-slate-700">
                                Ocorreu um erro inesperado. Não se preocupe, seus dados estão seguros.
                            </p>
                            <Button
                                onClick={this.handleReload}
                                className="w-full bg-red-100 text-red-700 hover:bg-red-200 border-red-200"
                                variant="outline"
                            >
                                Recarregar Página
                            </Button>
                        {import.meta.env.DEV && this.state.error && (
                                <details className="text-xs text-slate-500 mt-4">
                                    <summary className="cursor-pointer font-mono">
                                        Detalhes técnicos (desenvolvimento)
                                    </summary>
                                    <pre className="mt-2 p-2 bg-slate-100 rounded overflow-auto">
                                        {this.state.error.toString()}
                                    </pre>
                                </details>
                            )}
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}
