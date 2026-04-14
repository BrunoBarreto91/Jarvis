import { useState, useCallback } from "react";
import {
    CognitoUserPool,
    CognitoUser,
    AuthenticationDetails,
    CognitoUserSession,
    CognitoUserAttribute,
    ISignUpResult,
} from "amazon-cognito-identity-js";

// ─── Cognito Pool Config ────────────────────────────────────────────────────
const userPool = new CognitoUserPool({
    UserPoolId: import.meta.env.VITE_AWS_COGNITO_USER_POOL_ID as string,
    ClientId: import.meta.env.VITE_AWS_COGNITO_CLIENT_ID as string,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
const PT_ERRORS: Record<string, string> = {
    NotAuthorizedException: "E-mail ou senha incorretos.",
    UserNotFoundException: "Usuário não encontrado.",
    UserNotConfirmedException: "Conta não confirmada. Verifique seu e-mail.",
    PasswordResetRequiredException: "Redefinição de senha obrigatória.",
    UsernameExistsException: "Este e-mail já está cadastrado.",
    CodeMismatchException: "Código inválido. Verifique e tente novamente.",
    ExpiredCodeException: "Código expirado. Solicite um novo.",
    InvalidPasswordException: "A senha não atende aos requisitos mínimos.",
    LimitExceededException: "Muitas tentativas. Aguarde antes de tentar novamente.",
    TooManyRequestsException: "Muitas requisições. Tente novamente em breve.",
};

function pt(err: { name: string; message: string }): Error {
    return new Error(PT_ERRORS[err.name] ?? err.message);
}

function makeCognitoUser(email: string): CognitoUser {
    return new CognitoUser({ Username: email, Pool: userPool });
}

// ─── Types ───────────────────────────────────────────────────────────────────
export interface AuthUser {
    email: string;
    username: string;
    name?: string;
}

export interface UseAuthReturn {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    // ── Session ──
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<boolean>;
    // ── Onboarding ──
    signUp: (email: string, password: string, name: string) => Promise<ISignUpResult>;
    confirmSignUp: (email: string, code: string) => Promise<void>;
    // ── Recovery ──
    forgotPassword: (email: string) => Promise<void>;
    confirmForgotPassword: (email: string, code: string, newPassword: string) => Promise<void>;
    // ── Account Management ──
    changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
    deleteUser: () => Promise<void>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useAuth(): UseAuthReturn {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // ── checkAuth ────────────────────────────────────────────────────────────
    const checkAuth = useCallback((): Promise<boolean> => {
        return new Promise((resolve) => {
            const cognitoUser = userPool.getCurrentUser();
            if (!cognitoUser) {
                setIsAuthenticated(false);
                setUser(null);
                resolve(false);
                return;
            }
            cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
                if (err || !session?.isValid()) {
                    setIsAuthenticated(false);
                    setUser(null);
                    resolve(false);
                    return;
                }
                const payload = session.getIdToken().decodePayload();
                setUser({
                    email: payload["email"] as string,
                    username: cognitoUser.getUsername(),
                    name: payload["name"] as string | undefined,
                });
                setIsAuthenticated(true);
                resolve(true);
            });
        });
    }, []);

    // ── login ────────────────────────────────────────────────────────────────
    const login = useCallback((email: string, password: string): Promise<void> => {
        setIsLoading(true);
        const cognitoUser = makeCognitoUser(email);
        const authDetails = new AuthenticationDetails({ Username: email, Password: password });

        return new Promise((resolve, reject) => {
            cognitoUser.authenticateUser(authDetails, {
                onSuccess(session: CognitoUserSession) {
                    const payload = session.getIdToken().decodePayload();
                    setUser({
                        email: payload["email"] as string,
                        username: cognitoUser.getUsername(),
                        name: payload["name"] as string | undefined,
                    });
                    setIsAuthenticated(true);
                    setIsLoading(false);
                    resolve();
                },
                onFailure(err) {
                    setIsLoading(false);
                    reject(pt(err));
                },
                newPasswordRequired() {
                    setIsLoading(false);
                    reject(new Error("Nova senha necessária. Contacte o administrador."));
                },
            });
        });
    }, []);

    // ── logout ───────────────────────────────────────────────────────────────
    const logout = useCallback(() => {
        const cognitoUser = userPool.getCurrentUser();
        if (cognitoUser) cognitoUser.signOut();
        setUser(null);
        setIsAuthenticated(false);
    }, []);

    // ── signUp ───────────────────────────────────────────────────────────────
    const signUp = useCallback(
        (email: string, password: string, name: string): Promise<ISignUpResult> => {
            setIsLoading(true);
            // The User Pool uses email as an ALIAS, so the username must NOT be
            // an email address. We generate a UUID as the internal username and
            // pass the email exclusively as an attribute so Cognito resolves it.
            const username = crypto.randomUUID();
            const attributes = [
                new CognitoUserAttribute({ Name: "email", Value: email }),
                new CognitoUserAttribute({ Name: "name", Value: name }),
            ];
            return new Promise((resolve, reject) => {
                userPool.signUp(username, password, attributes, [], (err, result) => {
                    setIsLoading(false);
                    if (err) { reject(pt(err)); return; }
                    resolve(result!);
                });
            });
        },
        []

    );

    // ── confirmSignUp ────────────────────────────────────────────────────────
    // username here is the internal UUID generated during signUp, NOT the email.
    const confirmSignUp = useCallback((username: string, code: string): Promise<void> => {
        setIsLoading(true);
        return new Promise((resolve, reject) => {
            makeCognitoUser(username).confirmRegistration(code, true, (err) => {
                setIsLoading(false);
                if (err) { reject(pt(err)); return; }
                resolve();
            });
        });
    }, []);

    // ── forgotPassword ───────────────────────────────────────────────────────
    const forgotPassword = useCallback((email: string): Promise<void> => {
        setIsLoading(true);
        return new Promise((resolve, reject) => {
            makeCognitoUser(email).forgotPassword({
                onSuccess: () => { setIsLoading(false); resolve(); },
                onFailure: (err) => { setIsLoading(false); reject(pt(err)); },
            });
        });
    }, []);

    // ── confirmForgotPassword ────────────────────────────────────────────────
    const confirmForgotPassword = useCallback(
        (email: string, code: string, newPassword: string): Promise<void> => {
            setIsLoading(true);
            return new Promise((resolve, reject) => {
                makeCognitoUser(email).confirmPassword(code, newPassword, {
                    onSuccess: () => { setIsLoading(false); resolve(); },
                    onFailure: (err) => { setIsLoading(false); reject(pt(err)); },
                });
            });
        },
        []
    );

    // ── changePassword ───────────────────────────────────────────────────────
    const changePassword = useCallback(
        (oldPassword: string, newPassword: string): Promise<void> => {
            setIsLoading(true);
            return new Promise((resolve, reject) => {
                const cognitoUser = userPool.getCurrentUser();
                if (!cognitoUser) {
                    setIsLoading(false);
                    reject(new Error("Nenhuma sessão ativa."));
                    return;
                }
                // getSession refreshes tokens before acting
                cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
                    if (err || !session?.isValid()) {
                        setIsLoading(false);
                        reject(new Error("Sessão expirada. Faça login novamente."));
                        return;
                    }
                    cognitoUser.changePassword(oldPassword, newPassword, (err2) => {
                        setIsLoading(false);
                        if (err2) { reject(pt(err2)); return; }
                        resolve();
                    });
                });
            });
        },
        []
    );

    // ── deleteUser ───────────────────────────────────────────────────────────
    const deleteUser = useCallback((): Promise<void> => {
        setIsLoading(true);
        return new Promise((resolve, reject) => {
            const cognitoUser = userPool.getCurrentUser();
            if (!cognitoUser) {
                setIsLoading(false);
                reject(new Error("Nenhuma sessão ativa."));
                return;
            }
            cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
                if (err || !session?.isValid()) {
                    setIsLoading(false);
                    reject(new Error("Sessão expirada. Faça login novamente."));
                    return;
                }
                cognitoUser.deleteUser((err2) => {
                    setIsLoading(false);
                    if (err2) { reject(pt(err2)); return; }
                    // Clean up local state after deletion
                    setUser(null);
                    setIsAuthenticated(false);
                    resolve();
                });
            });
        });
    }, []);

    return {
        user, isAuthenticated, isLoading,
        login, logout, checkAuth,
        signUp, confirmSignUp,
        forgotPassword, confirmForgotPassword,
        changePassword, deleteUser,
    };
}
