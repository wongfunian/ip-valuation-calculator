export interface WeightedOption {
  label: string;
  value: string;
  description?: string;
  score?: number;
  multiplier?: number;
  internalPercent?: number;
}

export interface CommercialStrengthQuestion {
  id: "q1" | "q2" | "q3" | "q4" | "q5";
  prompt: string;
  options: WeightedOption[];
}

export interface IpValuationFormValues {
  ipType?: string;
  revenueYear1?: number;
  revenueYear2?: number;
  revenueYear3?: number;
  fullName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  q1?: string;
  q2?: string;
  q3?: string;
  q4?: string;
  q5?: string;
  lifespan?: string;
  legalStatus?: string;
  economicReach?: string;
}
