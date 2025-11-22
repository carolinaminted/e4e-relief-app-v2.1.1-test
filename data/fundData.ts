// FIX: Added type definitions to make this file a module and define the shape of Fund data.
export type CVType = 'Domain' | 'Roster' | 'SSO' | 'Manual';

export interface FundLimits {
  singleRequestMax: number;
  twelveMonthMax: number;
  lifetimeMax: number;
}

export interface FundDomainConfig {
    allowedDomains: string[];
}

export interface RosterEligibilityRecord {
    employeeId: string;
    birthMonth: number;
    birthDay: number;
}

export interface FundRosterConfig {
    sampleEligibilityRecords: RosterEligibilityRecord[];
}


export interface Fund {
  code: string;
  name: string;
  cvType: CVType;
  limits: FundLimits;
  eligibleDisasters: string[];
  eligibleHardships: string[];
  eligibleEmploymentTypes: string[];
  domainConfig?: FundDomainConfig;
  rosterConfig?: FundRosterConfig;
  eligibleStorms?: string[];
  supportEmail?: string;
  supportPhone?: string;
  supportedLanguages?: string[];
}