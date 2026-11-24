import "@auth/core/types";
import "@auth/core/jwt";

type EnovaUserRole = "STUDENT" | "ADMIN";

declare module "@auth/core/types" {
  interface Session {
    user: {
      id: string;
      role: EnovaUserRole;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role: EnovaUserRole;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: EnovaUserRole;
  }
}
