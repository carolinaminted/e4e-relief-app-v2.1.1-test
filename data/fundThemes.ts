
export interface FundTheme {
  primary: string;
  secondary: string;
  border: string;
  accent: string;
  accentHover: string;
  gradientStart: string;
  gradientEnd: string;
  logoUrl: string;
}

export const defaultTheme: FundTheme = {
  primary: '#003a70',
  secondary: '#004b8d',
  border: '#005ca0',
  accent: '#ff8400',
  accentHover: '#e67700',
  gradientStart: '#ff8400',
  gradientEnd: '#edda26',
  logoUrl: 'https://gateway.pinata.cloud/ipfs/bafkreigagdtmj6mbd7wgrimtl2zh3ygorbcvv3cagofbyespbtfmpn2nqy',
};

export const fundThemes: Record<string, FundTheme> = {
  // Charizard Relief Fund (Fire)
  'ROST': {
    primary: '#0B1C33',
    secondary: '#132030',
    border: '#C2341D',
    accent: '#F7691A',
    accentHover: '#D6550F',
    gradientStart: '#F7691A',
    gradientEnd: '#FFB449',
    logoUrl: 'https://gateway.pinata.cloud/ipfs/bafkreidkigzbvxi3i5cjpkfmzrn2dtn4yw6sr2y6d65m3ztsbrg747y2ki',
  },
  // Blastoise Relief Fund (Water)
  'DOM': {
    primary: '#003B73',
    secondary: '#1F2F47',
    border: '#79D0FF',
    accent: '#0BAFD9',
    accentHover: '#0990B3',
    gradientStart: '#0BAFD9',
    gradientEnd: '#79D0FF',
    logoUrl: 'https://gateway.pinata.cloud/ipfs/bafkreicjlkl435dnpvrn7fsgjjomfjrrgua2wg5o4y4saa476zo2zz7znq',
  },
  // Venusaur Relief Fund (Grass)
  'SSO': {
    primary: '#1C5F2C',
    secondary: '#153D22',
    border: '#33A466',
    accent: '#33A466',
    accentHover: '#298652',
    gradientStart: '#33A466',
    gradientEnd: '#FF8FA3',
    logoUrl: 'https://gateway.pinata.cloud/ipfs/bafkreigagdtmj6mbd7wgrimtl2zh3ygorbcvv3cagofbyespbtfmpn2nqy',
  },
};
