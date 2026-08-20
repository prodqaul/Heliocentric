export type ScanResultPayload = {
  fileName: string;
  prediction: string;
  confidence: number;
  disease: string;
  description: string;
  cause: string;
  treatment: string[];
  severity: string;
};

export type ScanContact = {
  name: string;
  email: string | null;
  phone: string;
  location: string;
};

export type ScanRecord = ScanContact & {
  id: string;
  userId: string | null;
  fileName: string;
  prediction: string;
  confidence: number;
  disease: string;
  description: string;
  cause: string;
  treatment: string[];
  severity: string;
  createdAt: Date | null;
};

export type UserRole = "admin" | "farmer";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  role: UserRole;
  createdAt: Date | null;
};

export type AppPage =
  | "home"
  | "support"
  | "login"
  | "signup"
  | "dashboard"
  | "users"
  | "notifications";
