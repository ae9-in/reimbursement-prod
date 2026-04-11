export type AppRole = "employee" | "manager" | "admin";
export type ClaimStatus = "draft" | "submitted" | "manager_approved" | "rejected" | "paid";

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  department: string;
  manager_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Policy {
  id: string;
  rate_per_km: number;
  max_distance_per_claim: number;
  max_monthly_limit: number;
  updated_at: string;
  updated_by: string | null;
}

export interface Claim {
  id: string;
  employee_id: string;
  date_of_travel: string;
  distance_km: number;
  purpose: string;
  odometer_start: number | null;
  odometer_end: number | null;
  status: ClaimStatus;
  amount_calculated: number;
  receipt_url: string | null;
  gps_route_data: any | null;
  created_at: string;
  updated_at: string;
  employee_profile?: Profile | null;
}

export interface ClaimComment {
  id: string;
  claim_id: string;
  author_id: string;
  comment: string;
  created_at: string;
}

export const API_URL = import.meta.env.VITE_API_URL || 'https://reimbursement-prod.onrender.com/api';

const getHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const getProfile = async (userId: string) => {
  const res = await fetch(`${API_URL}/auth/profiles/${userId}`, { headers: getHeaders() });
  if (res.ok) {
    const data = await res.json();
    return data;
  }
  return null;
};

export const getRole = async (userId: string) => {
  const res = await fetch(`${API_URL}/auth/me`, { headers: getHeaders() });
  if (res.ok) {
    const data = await res.json();
    return data.user.role;
  }
  return "employee";
};

export const getClaims = async (userId?: string) => {
  const res = await fetch(`${API_URL}/claims`, { headers: getHeaders() });
  if (res.ok) {
    const data = await res.json();
    return data.map((c: any) => ({ ...c, id: c._id }));
  }
  return [];
};

export const getClaim = async (claimId: string) => {
  const res = await fetch(`${API_URL}/claims/${claimId}`, { headers: getHeaders() });
  if (res.ok) {
    const data = await res.json();
    return { ...data, id: data._id };
  }
  return null;
};

export const createClaim = async (claim: Omit<Claim, "id" | "created_at" | "updated_at">) => {
  const res = await fetch(`${API_URL}/claims`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(claim)
  });
  return res.json();
};

export const updateClaim = async (claimId: string, updates: Partial<Claim>) => {
  const res = await fetch(`${API_URL}/claims/${claimId}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(updates)
  });
  return res.json();
};

export const deleteClaim = async (claimId: string) => {
  await fetch(`${API_URL}/claims/${claimId}`, { 
    method: 'DELETE',
    headers: getHeaders()
  });
};

export const getComments = async (claimId: string) => {
  const res = await fetch(`${API_URL}/comments/${claimId}`, { headers: getHeaders() });
  if (res.ok) {
    const data = await res.json();
    return data.map((c: any) => ({ ...c, id: c._id }));
  }
  return [];
};

export const addComment = async (comment: Omit<ClaimComment, "id" | "created_at">) => {
  const res = await fetch(`${API_URL}/comments`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(comment)
  });
  return res.json();
};

export const getPolicy = async () => {
  const res = await fetch(`${API_URL}/policies`, { headers: getHeaders() });
  if (res.ok) {
    const data = await res.json();
    return { ...data, id: data._id };
  }
  return null;
};

export const updatePolicy = async (updates: Partial<Policy>) => {
  const res = await fetch(`${API_URL}/policies`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(updates)
  });
  return res.json();
};

export const loginApi = async (email: string, password?: string, requiredRole?: string | string[]) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, requiredRole })
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Invalid credentials');
  }
  const data = await res.json();
  localStorage.setItem('auth_token', data.token);
  return data;
};

export const registerApi = async (data: { email: string; password?: string; fullName: string; department: string; role?: string }) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, password: data.password })
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Registration failed');
  }
  const result = await res.json();
  localStorage.setItem('auth_token', result.token);
  return result;
};
