import { fundsRepo } from './firestoreRepo';

export interface FundConfig {
    allowedDomains: string[];
}

// Mock API to get fund configuration
export const getFundConfig = async (fundCode: string): Promise<FundConfig> => {
    console.log(`Fetching config for fundCode: ${fundCode}`);
    
    const fund = await fundsRepo.getFund(fundCode);
    if (fund && fund.domainConfig) {
        return {
            allowedDomains: fund.domainConfig.allowedDomains,
        };
    }
    
    // Fallback for original logic if fund not found
    if (fundCode.toUpperCase() === 'E4E') {
        return {
            allowedDomains: ['example.com', 'fakemail.example'],
        };
    }

    return {
        allowedDomains: [],
    };
};

export interface RosterVerificationInput {
    employeeId: string;
    birthDay: number;
    birthMonth: number;
}

// Mock API to verify user against a roster
export const verifyRoster = async (input: RosterVerificationInput, fundCode: string): Promise<{ ok: boolean }> => {
    console.log('Verifying roster with input:', input, 'for fund:', fundCode);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

    const fund = await fundsRepo.getFund(fundCode);
    if (fund && fund.rosterConfig) {
        const match = fund.rosterConfig.sampleEligibilityRecords.find(record => 
            String(record.employeeId) === input.employeeId &&
            Number(record.birthDay) === input.birthDay &&
            Number(record.birthMonth) === input.birthMonth
        );
        return { ok: !!match };
    }

    // Fallback for original logic if fund is not configured
    if (input.employeeId === '12345' && input.birthDay === 15 && input.birthMonth === 5) {
        return { ok: true };
    }
    return { ok: false };
};

// Mock API to link SSO
export const linkSSO = async (): Promise<{ ok: boolean }> => {
    console.log('Linking SSO...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Mock success
    return { ok: true };
};