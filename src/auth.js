import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import pool from "./connection/databaseConnection"
import { sign } from "jsonwebtoken"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("Google Sign In - User:", user);
      if (account?.provider === "google") {
        try {
          const res = await pool.query("SELECT * FROM api_user WHERE email = $1", [user.email]);
          const dbUser = res.rows[0];
          if (!dbUser) {
            console.log("User email not found in DB:", user.email);
            return "/login?error=EmailNotRegistered";
          }
          return true;
        } catch (error) {
          console.error("Database error in signIn:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, account, profile }) {
      // Logic for initial sign in or subsequent formatting
      if (account) {
        token.account = account;
        token.profile = profile;

        try {
          const email = profile?.email || token.email;
          const dbRes = await pool.query("SELECT * FROM api_user WHERE email = $1", [email]);
          const user = dbRes.rows[0];

          if (user) {
            console.log("JWT Callback - User found in DB:", user.email);

            // Create custom token to match route.js behavior
            const customToken = sign(
              { id: user.id },
              process.env.JWT_SECRET || "fallback_secret_check_env",
              { expiresIn: '7d' }
            );

            // Sanitize user object to avoid huge cookies
            // Only include fields actually used by the app
            const safeUser = {
              id: user.id,
              email: user.email,
              username: user.username,
              rwandan_name: user.rwandan_name,
              is_crc: user.is_crc,
              is_superuser: user.is_superuser,
              is_alumni: user.is_alumni,
              phone: user.phone, // Optional, if needed
              profile_image: user.profile_image // Be careful with this if it's base64!
            };

            // If profile_image is very long (base64), remove it from the session cookie
            if (safeUser.profile_image && safeUser.profile_image.length > 200) {
              // Don't store large images in cookie
              safeUser.profile_image = null;
            }

            token.customToken = customToken;
            token.dbUser = {
              id: user.id,
              email: user.email,
              username: user.username,
              second_name: user?.rwandan_name
            };
            token.fullInfo = safeUser;
          }
        } catch (e) {
          console.error("Error fetching user in jwt callback", e);
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Pass captured data to the session object
      if (token.dbUser) {
        session.user = {
          ...session.user,
          ...token.dbUser
        };
      }
      if (token.customToken) {
        session.customToken = token.customToken;
      }
      if (token.fullInfo) {
        session.fullInfo = token.fullInfo;
      }

      return session;
    },
  },
})
