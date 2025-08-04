export interface RegisterRequest {
  // Step 1: Role Selection
  role: string;

  // Step 2: Account Creation
  username: string;
  email: string;
  password: string;
  confirmPassword: string;

  // Step 3: Common Personal Information
  firstName: string;
  lastName: string;
  phone: string;
  location: string;

  // Service Company specific fields
  companyName?: string;
  companySize?: string;
  establishedYear?: number;
  website?: string;
  companyDescription?: string;

  // Freelancer specific fields
  specialization?: string;
  experienceLevel?: string;
  hourlyRate?: number;
  availableHours?: string;
  skills?: string;

  // Client specific fields
  industry?: string;
  companyType?: string;
  projectBudgetRange?: string;
  preferredProjectDuration?: string;

  // Terms and Conditions
  terms: boolean;
}

export interface AuthenticationRequest {
  username: string;
  password: string;
}

export interface AuthenticationResponse {
  token: string;
  type: string;
  username: string;
  email: string;
  roles: string[];
  id: number;
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}
export interface AuthenticationRequest {
  username: string;
  password: string;
}

export interface AuthenticationResponse {
  token: string;
  username: string;
  role: string; // This matches your backend DTO
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}