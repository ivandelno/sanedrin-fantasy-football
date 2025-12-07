import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { StandingsHistoryEntry } from '../types/database.types';

interface Props {
    data: StandingsHistoryEntry[];
}

export default function StandingsChart({ data }: Props) {
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        const matchdays = Array.from(new Set(data.map(d => d.matchday))).sort((a, b) => a - b);
        const participants = Array.from(new Set(data.map(d => d.username)));

        const currentPoints: Record<string, number> = {};
        participants.forEach(p => currentPoints[p] = 0);

        return matchdays.map(matchday => {
            const entry: any = { matchday: `J${matchday}` };

            // Update current points with any new data for this matchday
            // We need to be careful: the SQL returns the cumulative total at that point.
            // If a user is missing from this matchday in SQL, their total hasn't changed.
            data.filter(d => d.matchday === matchday).forEach(d => {
                currentPoints[d.username] = d.total_points;
            });

            // Fill entry with current points state
            participants.forEach(p => {
                entry[p] = currentPoints[p];
            });

            return entry;
        });
    }, [data]);

    const participants = useMemo(() => {
        if (!data) return [];
        return Array.from(new Set(data.map(d => d.username))).sort();
    }, [data]);

    // Generate consistent colors
    const colors = [
        '#2563eb', // blue-600
        '#dc2626', // red-600
        '#16a34a', // green-600
        '#d97706', // amber-600
        '#9333ea', // purple-600
        '#0891b2', // cyan-600
        '#db2777', // pink-600
        '#4f46e5', // indigo-600
        '#ca8a04', // yellow-600
        '#0d9488', // teal-600
    ];

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-secondary">
                No hay datos suficientes para la gráfica
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                        dataKey="matchday"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: '#9ca3af' }}
                    />
                    <YAxis
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: '#9ca3af' }}
                        width={40}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            borderRadius: '8px',
                            border: 'none',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    {participants.map((participant, index) => (
                        <Line
                            key={participant}
                            type="monotone"
                            dataKey={participant}
                            stroke={colors[index % colors.length]}
                            strokeWidth={2}
                            dot={{ r: 3, strokeWidth: 0 }}
                            activeDot={{ r: 6 }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
