// Points breakdown type
export interface PointsBreakdown {
    [teamId: string]: {
        team_name: string;
        role: string;
        points: number;
        result?: 'WIN' | 'DRAW' | 'LOSS';
    };
}
