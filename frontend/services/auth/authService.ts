import { api } from "@/lib/api/axios";
import {
    LoginPayload,
    RegisterPayload,
} from "./auth.types";

class AuthService {

    

    async login(payload: LoginPayload) {


        const response = await api.post(
            "/api/auth/login",
            payload
        );

        return response.data;
    }

    async register(payload: RegisterPayload) {
        const response = await api.post(
            "/api/auth/register",
            payload
        );

        return response.data;
    }

    async logout() {
        const response = await api.post(
            "/api/auth/logout"
        );

        return response.data;
    }

    async refreshToken() {
        const response = await api.post(
            "/api/auth/refresh"
        );

        return response.data;
    }
}

export const authService = new AuthService();