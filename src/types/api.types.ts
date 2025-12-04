// API-Football response types

export interface APIFootballResponse<T> {
    get: string;
    parameters: Record<string, any>;
    errors: any[];
    results: number;
    paging: {
        current: number;
        total: number;
    };
    response: T[];
}

export interface APILeague {
    id: number;
    name: string;
    type: string;
    logo: string;
    round?: string; // Optional round/matchday info
}

export interface APICountry {
    name: string;
    code: string;
    flag: string;
}

export interface APISeason {
    year: number;
    start: string;
    end: string;
    current: boolean;
}

export interface APITeam {
    id: number;
    name: string;
    code: string;
    country: string;
    founded: number;
    national: boolean;
    logo: string;
}

export interface APIVenue {
    id: number;
    name: string;
    address: string;
    city: string;
    capacity: number;
    surface: string;
    image: string;
}

export interface APIFixture {
    id: number;
    referee: string;
    timezone: string;
    date: string;
    timestamp: number;
    periods: {
        first: number;
        second: number;
    };
    venue: APIVenue;
    status: {
        long: string;
        short: string;
        elapsed: number;
    };
}

export interface APIScore {
    halftime: {
        home: number;
        away: number;
    };
    fulltime: {
        home: number;
        away: number;
    };
    extratime: {
        home: number;
        away: number;
    };
    penalty: {
        home: number;
        away: number;
    };
}

export interface APIMatch {
    fixture: APIFixture;
    league: APILeague;
    teams: {
        home: APITeam;
        away: APITeam;
    };
    goals: {
        home: number;
        away: number;
    };
    score: APIScore;
}

export interface APIStanding {
    rank: number;
    team: APITeam;
    points: number;
    goalsDiff: number;
    group: string;
    form: string;
    status: string;
    description: string;
    all: {
        played: number;
        win: number;
        draw: number;
        lose: number;
        goals: {
            for: number;
            against: number;
        };
    };
    home: {
        played: number;
        win: number;
        draw: number;
        lose: number;
        goals: {
            for: number;
            against: number;
        };
    };
    away: {
        played: number;
        win: number;
        draw: number;
        lose: number;
        goals: {
            for: number;
            against: number;
        };
    };
    update: string;
}

// League IDs for API-Football
export const LEAGUE_IDS = {
    LA_LIGA: 140,
    SEGUNDA: 141,
    CHAMPIONS: 2
} as const;

// Status mapping from API to our database
export const STATUS_MAP: Record<string, 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED'> = {
    'TBD': 'SCHEDULED',
    'NS': 'SCHEDULED',
    '1H': 'LIVE',
    'HT': 'LIVE',
    '2H': 'LIVE',
    'ET': 'LIVE',
    'P': 'LIVE',
    'FT': 'FINISHED',
    'AET': 'FINISHED',
    'PEN': 'FINISHED',
    'PST': 'POSTPONED',
    'CANC': 'POSTPONED',
    'ABD': 'POSTPONED',
    'AWD': 'FINISHED',
    'WO': 'FINISHED'
};
