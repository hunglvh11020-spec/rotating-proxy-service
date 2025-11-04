export interface ProxyKey {
  id: string;
  key: string;
  region: string;
  lifetime: number; // in seconds, 0 for unlimited
}

export enum Region {
    US_EAST = "US-East",
    US_WEST = "US-West",
    EU_CENTRAL = "EU-Central",
    ASIA_PACIFIC = "Asia-Pacific",
    RANDOM = "Random",
}

export enum Lifetime {
    HOUR = 3600,
    DAY = 86400,
    WEEK = 604800,
    MONTH = 2592000,
    UNLIMITED = 0,
}