import { getProfile } from "./api";

export const enrichClaimsWithProfiles = async (claims: any[]) => {
  if (!claims?.length) return [];
  
  return Promise.all(claims.map(async (claim) => {
    const profile = await getProfile(claim.employee_id);
    return {
      ...claim,
      employee_profile: profile
    };
  }));
};
