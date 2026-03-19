import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { strapi } from "./lib/sdk/sdk";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Password Login",
            credentials: {
                identifier: { label: "Identifier", type: "text" },
                password: { label: "password", type: "text" },
            },
            async authorize(credentials) {
                try {
                    if (!credentials?.identifier || !credentials?.password) return null;

                    const { user, jwt } = (await strapi.login({
                        identifier: credentials?.identifier,
                        password: credentials?.password,
                    })) as any;
                    if (jwt && user) {
                        return {
                            id: String(user.id),
                            identifier: user?.email ? user.email : "User without identifier",
                            jwt: jwt,
                        };
                    }

                    return null;
                } catch (err: any) {
                    throw Error(err.error.message || "something went wrong...")
                }
            },
        }),
    ],

    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.jwt = (user as any).jwt;
                token.identifier = (user as any).identifier;
            }
            return token;
        },
        async session({ session, token }: any) {
            session.user = {
                id: token.sub as string,
                identifier: token.identifier as string,
            };
            session.jwt = token.jwt as string;
            return session;
        },
    },

    session: {
        strategy: "jwt",
    },

    secret: process.env.NEXTAUTH_SECRET,
};
