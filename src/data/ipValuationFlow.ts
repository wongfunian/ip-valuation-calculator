import type { CommercialStrengthQuestion, WeightedOption } from "../types/ipValuation";

export const ipTypeOptions: WeightedOption[] = [
  { value: "trademark_brand", label: "Trademark / Brand", internalPercent: 5 },
  { value: "patent_technology", label: "Patent / Technology", internalPercent: 6 },
  { value: "industrial_design", label: "Industrial Design", internalPercent: 4 },
  { value: "copyright_content", label: "Copyright / Content", internalPercent: 8 },
  { value: "software_platform", label: "Software / Platform", internalPercent: 8 },
  { value: "trade_secret", label: "Trade Secret / Know-how", internalPercent: 5 },
];

export const commercialStrengthQuestions: CommercialStrengthQuestion[] = [
  {
    id: "q1",
    prompt: "Does this IP help customers choose your business?",
    options: [
      {
        value: "strong_impact",
        label: "Strong Impact",
        description: "Customers choose the business because of this IP.",
        score: 10,
      },
      {
        value: "some_impact",
        label: "Some Impact",
        description: "The IP helps but is not the main reason.",
        score: 5,
      },
      {
        value: "low_impact",
        label: "Little or No Impact",
        description: "Customers would still choose the business without it.",
        score: 0,
      },
    ],
  },
  {
    id: "q2",
    prompt: "Does this IP make your business different from competitors?",
    options: [
      { value: "clearly_different", label: "Clearly Different", score: 10 },
      { value: "somewhat_different", label: "Somewhat Different", score: 5 },
      { value: "not_different", label: "Not Different", score: 0 },
    ],
  },
  {
    id: "q3",
    prompt: "If this IP disappeared, would your revenue be affected?",
    options: [
      { value: "yes_significantly", label: "Yes, significantly", score: 10 },
      { value: "yes_somewhat", label: "Yes, somewhat", score: 5 },
      { value: "no_impact", label: "No impact", score: 0 },
    ],
  },
  {
    id: "q4",
    prompt: "Can this IP be expanded, licensed, franchised, or used to grow the business?",
    options: [
      { value: "high_potential", label: "High potential", score: 10 },
      { value: "moderate_potential", label: "Moderate potential", score: 5 },
      { value: "low_potential", label: "Low potential", score: 0 },
    ],
  },
  {
    id: "q5",
    prompt: "Is this IP important to the long-term future of your business?",
    options: [
      { value: "very_important", label: "Very important", score: 10 },
      { value: "moderately_important", label: "Moderately important", score: 5 },
      { value: "not_important", label: "Not important", score: 0 },
    ],
  },
];

export const lifespanOptions: WeightedOption[] = [
  { value: "lt_3_years", label: "Less than 3 years", multiplier: 2 },
  { value: "3_5_years", label: "3 - 5 years", multiplier: 4 },
  { value: "5_10_years", label: "5 - 10 years", multiplier: 6 },
  { value: "10_15_years", label: "10 - 15 years", multiplier: 8 },
  { value: "gt_15_years", label: "More than 15 years", multiplier: 10 },
];

export const legalStatusOptions: WeightedOption[] = [
  { value: "registered_granted", label: "Registered / Granted", multiplier: 1 },
  { value: "application_pending", label: "Application Pending", multiplier: 0.85 },
  { value: "not_registered", label: "Not Registered", multiplier: 0.7 },
  { value: "under_dispute", label: "Under Dispute or Challenge", multiplier: 0.5 },
  { value: "not_sure", label: "I'm not sure", multiplier: 0.5 },
];

export const economicReachOptions: WeightedOption[] = [
  { value: "limited_use", label: "Limited / No commercial use", multiplier: 0.7 },
  { value: "internal_use", label: "Internal business use only", multiplier: 1 },
  { value: "licensed_third_parties", label: "Licensed to third parties", multiplier: 1.15 },
  { value: "franchise_multi_outlet", label: "Franchise or multiple business outlets", multiplier: 1.25 },
  { value: "international_markets", label: "Used in international markets", multiplier: 1.35 },
];

export const disclaimerParagraphs = [
  "This calculator applies a simplified version of the Relief-from-Royalty Method, a commonly used approach in intellectual property valuation, to generate an indicative estimate of the potential value of the IP based on the information provided.",
  "The output produced by this calculator is for general informational purposes only and is intended solely as a preliminary directional estimate. It does not constitute a formal valuation report, legal advice, financial advice, investment advice, or professional opinion.",
  "The actual value of any intellectual property asset may vary significantly depending on numerous factors, including but not limited to legal enforceability, ownership structure, market conditions, commercial adoption, revenue attribution, competitive landscape, and other asset-specific considerations.",
  "If you require a defensible and professionally supported valuation, including legal due diligence, commercial analysis, and valuation reporting, please contact our advisory team for further assistance.",
];
