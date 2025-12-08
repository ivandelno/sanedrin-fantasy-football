import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/auth.store';
import { databaseService } from '../services/database.service';
import { authService } from '../services/auth.service';
import { useActiveSeason, useAllSeasons } from '../hooks/useSeason';
import { Role, League, type ParticipantTeamSummary } from '../types/database.types';
import { FaFutbol, FaShieldAlt, FaTrophy, FaExchangeAlt, FaSave, FaTimes } from 'react-icons/fa';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function TeamManagementPage() {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    // Season State
    const { data: activeSeason } = useActiveSeason();
    const { data: allSeasons } = useAllSeasons();
    const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');

    // Set default season
    useEffect(() => {
        if (activeSeason && !selectedSeasonId) {
            setSelectedSeasonId(activeSeason.id);
        }
    }, [activeSeason, selectedSeasonId]);

    // Data Fetching
    const { data: teamsSummary, isLoading: teamsLoading } = useQuery({
        queryKey: ['participants-teams-summary', selectedSeasonId],
        queryFn: () => selectedSeasonId ? databaseService.getParticipantsTeamsSummary(selectedSeasonId) : Promise.resolve([]),
        enabled: !!selectedSeasonId
    });

    const { data: standings } = useQuery({
        queryKey: ['standings', selectedSeasonId],
        queryFn: () => selectedSeasonId ? databaseService.getStandings(selectedSeasonId) : Promise.resolve([]),
        enabled: !!selectedSeasonId
    });

    // Processed Data
    const myTeams = useMemo(() => {
        if (!teamsSummary || !user) return [];
        return teamsSummary.filter(t => t.user_id === user.id);
    }, [teamsSummary, user]);

    const myStats = useMemo(() => {
        if (!standings || !user) return null;
        return standings.find(s => s.user_id === user.id);
    }, [standings, user]);

    const { data: changesHistory, isLoading: historyLoading } = useQuery({
        queryKey: ['participant-changes', selectedSeasonId, myStats?.participant_id],
        queryFn: () => (selectedSeasonId && myStats?.participant_id) ? databaseService.getParticipantChanges(selectedSeasonId, myStats.participant_id) : Promise.resolve([]),
        enabled: !!selectedSeasonId && !!myStats?.participant_id
    });

    // Subtitution State
    const [isChangeMode, setIsChangeMode] = useState(false);
    const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
    const [selectedStarterId, setSelectedStarterId] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState('');

    // Mutation
    const changeMutation = useMutation({
        mutationFn: async () => {
            console.log("Attempting team change...", { selectedSeasonId, participantId: myStats?.participant_id, selectedStarterId, selectedSubId });
            if (!user || !myStats?.participant_id || !selectedSeasonId || !selectedSubId || !selectedStarterId) {
                console.error("Missing data for change");
                throw new Error("Datos incompletos");
            }
            await databaseService.performTeamChange(selectedSeasonId, myStats.participant_id, selectedStarterId, selectedSubId);
            console.log("Team change successful");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['participants-teams-summary'] });
            queryClient.invalidateQueries({ queryKey: ['participant-changes'] });
            queryClient.invalidateQueries({ queryKey: ['standings'] });
            resetChangeMode();
        },
        onError: (err) => {
            console.error("Change mutation error:", err);
            setErrorMsg(err instanceof Error ? err.message : 'Error al realizar el cambio');
        }
    });

    // Logic
    const resetChangeMode = () => {
        setIsChangeMode(false);
        setSelectedSubId(null);
        setSelectedStarterId(null);
        setErrorMsg('');
    };

    const handleTeamClick = (team: ParticipantTeamSummary) => {
        if (!isChangeMode) return;

        const isSuplente = team.role.includes('SUPLENTE');

        if (!selectedSubId) {
            // Step 1: Select Substitute
            if (isSuplente) {
                setSelectedSubId(team.team_id);
            }
        } else if (!selectedStarterId) {
            // Step 2: Select Starter
            if (team.team_id === selectedSubId) {
                // Deselect if same
                setSelectedSubId(null);
                return;
            }

            // Allow switching to another substitute
            if (isSuplente) {
                setSelectedSubId(team.team_id);
                return;
            }

            // Check eligibility
            const subTeam = myTeams.find(t => t.team_id === selectedSubId);
            if (subTeam && subTeam.league === team.league && !isSuplente) {
                setSelectedStarterId(team.team_id);
            }
        } else {
            // Step 3: Full selection made
            // Allow changing selection by clicking again
            if (team.team_id === selectedSubId) {
                setSelectedSubId(null);
                setSelectedStarterId(null);
                return;
            }
            if (team.team_id === selectedStarterId) {
                setSelectedStarterId(null);
                return;
            }

            // Allow switching sub
            if (isSuplente) {
                setSelectedSubId(team.team_id);
                setSelectedStarterId(null);
                return;
            }
        }
    };

    // Render Helpers
    const getRenderTeams = () => {
        let teams = [...myTeams];

        // Sorting logic
        teams.sort((a, b) => {
            const getTeamWeight = (team: ParticipantTeamSummary) => {
                const isSuplente = team.role.includes('SUPLENTE');
                if (isSuplente) {
                    if (team.league === League.PRIMERA) return 60;
                    if (team.league === League.SEGUNDA) return 70;
                    if (team.league === League.CHAMPIONS) return 75;
                    return 80;
                }
                if (team.league === League.CHAMPIONS) return 10;
                if (team.league === League.PRIMERA) {
                    if (team.role === Role.SUMAR) return 20;
                    if (team.role === Role.RESTAR) return 30;
                }
                if (team.league === League.SEGUNDA) {
                    if (team.role === Role.SUMAR) return 40;
                    if (team.role === Role.RESTAR) return 50;
                }
                return 90;
            };
            return getTeamWeight(a) - getTeamWeight(b);
        });

        // Visual Swap
        if (selectedSubId && selectedStarterId) {
            const subIdx = teams.findIndex(t => t.team_id === selectedSubId);
            const starterIdx = teams.findIndex(t => t.team_id === selectedStarterId);
            if (subIdx !== -1 && starterIdx !== -1) {
                // Clone to swap visually
                const newTeams = [...teams];
                const temp = newTeams[subIdx];
                newTeams[subIdx] = newTeams[starterIdx];
                newTeams[starterIdx] = temp;
                return newTeams;
            }
        }
        return teams;
    };

    const renderLeagueIcon = (league: string, isSuplente: boolean) => {
        const style = {
            fontSize: '1.2em',
            opacity: isSuplente ? 0.5 : 1,
            filter: isSuplente ? 'grayscale(100%)' : 'none'
        };
        switch (league) {
            case League.CHAMPIONS: return <FaTrophy style={{ ...style, color: '#f59e0b' }} />;
            case League.PRIMERA: return <FaFutbol style={{ ...style, color: '#3b82f6' }} />;
            case League.SEGUNDA: return <FaShieldAlt style={{ ...style, color: '#6b7280' }} />;
            default: return null;
        }
    };

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pwdError, setPwdError] = useState('');
    const [pwdSuccess, setPwdSuccess] = useState('');
    const [pwdLoading, setPwdLoading] = useState(false);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwdError(''); setPwdSuccess('');
        if (!currentPassword || !newPassword || !confirmPassword) return setPwdError('Completa todos los campos');
        if (newPassword !== confirmPassword) return setPwdError('Las contraseñas no coinciden');
        if (!user?.id) return;
        setPwdLoading(true);
        try {
            await authService.changePassword(user.id, currentPassword, newPassword);
            setPwdSuccess('Contraseña cambiada'); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        } catch (err: any) { setPwdError(err.message || 'Error'); }
        finally { setPwdLoading(false); }
    };

    const changesUsed = myStats?.changes_used || 0;
    const maxChanges = 3;

    return (
        <div className="page">
            <div className="page-header">
                <h2>Gestión de Equipos</h2>
                <div className="flex gap-4 items-center">
                    <select
                        value={selectedSeasonId}
                        onChange={(e) => { setSelectedSeasonId(e.target.value); resetChangeMode(); }}
                        className="form-control"
                        style={{ width: 'auto' }}
                    >
                        {allSeasons?.map(s => (
                            <option key={s.id} value={s.id}>
                                {s.name} {s.is_active ? '(Activa)' : ''}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="card">
                <div className="flex justify-between items-center mb-4">
                    <h3>Tus Equipos</h3>
                    {!isChangeMode ? (
                        <button
                            className="btn btn-primary flex items-center gap-2"
                            onClick={() => setIsChangeMode(true)}
                            disabled={changesUsed >= maxChanges || selectedSeasonId !== activeSeason?.id}
                            title={changesUsed >= maxChanges ? "No te quedan cambios" : "Realizar un cambio"}
                        >
                            <FaExchangeAlt /> Cambiar
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            {selectedSubId && selectedStarterId && (
                                <button
                                    className="btn btn-primary flex items-center gap-2"
                                    onClick={() => changeMutation.mutate()}
                                    disabled={changeMutation.isPending}
                                >
                                    <FaSave /> Guardar
                                </button>
                            )}
                            <button
                                className="btn btn-outline-danger flex items-center gap-2"
                                onClick={resetChangeMode}
                                style={{ backgroundColor: '#dc3545', color: 'white' }}
                            >
                                <FaTimes /> Cancelar
                            </button>
                        </div>
                    )}
                </div>

                {isChangeMode && (
                    <div className="alert alert-info mb-4">
                        {!selectedSubId
                            ? "1. Selecciona el jugardor SUPLENTE que quieres que entre."
                            : !selectedStarterId
                                ? "2. Selecciona el jugador TITULAR que quieres sustituir."
                                : "3. Confirma el cambio para guardar."}
                    </div>
                )}

                {errorMsg && <div className="alert alert-danger mb-4">{errorMsg}</div>}

                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'center', width: 50 }}>Liga</th>
                                <th>Equipo</th>
                                {!isChangeMode && <th style={{ textAlign: 'right' }}>Puntos</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {getRenderTeams().map(team => {
                                const isSuplente = team.role.includes('SUPLENTE');
                                const isSelectedSub = team.team_id === selectedSubId;
                                const isSelectedStarter = team.team_id === selectedStarterId;

                                // Determine eligibility for visual cues
                                let isDimmed = false;
                                let isHighlight = false;

                                if (isChangeMode) {
                                    if (!selectedSubId) {
                                        // Stage 1: Only subs are active
                                        if (!isSuplente) isDimmed = true;
                                        else isHighlight = true;
                                    } else if (!selectedStarterId) {
                                        // Stage 2: Selected Sub is active, compatible Starters are active
                                        // Sub is highlighted
                                        if (isSelectedSub) isHighlight = true;
                                        else {
                                            // Check compatibility
                                            const sub = myTeams.find(t => t.team_id === selectedSubId);
                                            if (sub && team.league === sub.league && !isSuplente) {
                                                isHighlight = true; // Compatible starter
                                            } else {
                                                isDimmed = true;
                                            }
                                        }
                                    } else {
                                        // Stage 3: Confirmation
                                        if (isSelectedSub || isSelectedStarter) isHighlight = true;
                                        else isDimmed = true;
                                    }
                                }

                                return (
                                    <tr
                                        key={team.team_id}
                                        onClick={() => handleTeamClick(team)}
                                        style={{
                                            cursor: isChangeMode && !isDimmed ? 'pointer' : 'default',
                                            opacity: isDimmed ? 0.4 : 1,
                                            backgroundColor: isHighlight ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                            border: isSelectedSub || isSelectedStarter ? '2px solid var(--color-primary-500)' : undefined
                                        }}
                                    >
                                        <td style={{ textAlign: 'center' }}>
                                            {renderLeagueIcon(team.league, isSuplente)}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <span style={{
                                                    fontWeight: isSuplente ? 'normal' : 'bold',
                                                    color: isHighlight ? 'var(--color-gray-900)' : 'inherit' // Ensure readable text on light bg (if using light mode highlight) 
                                                    // Actually if using rgba(59, 130, 246, 0.1), that works on both. 
                                                    // But let's trust inheritance unless it's strictly light mode specific.
                                                    // 'var(--color-gray-900)' is black. If dark mode, text should be white.
                                                    // Let's rely on base text color + translucent background.
                                                }}>
                                                    {team.team_name}
                                                </span>
                                                {isSuplente && <span className="text-secondary text-sm">(Suplente)</span>}
                                                {team.last_change_date && !isChangeMode && (
                                                    <span className="text-xs text-secondary">
                                                        [{format(new Date(team.last_change_date), "d MMM", { locale: es })}]
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        {!isChangeMode && (
                                            <td style={{
                                                textAlign: 'right',
                                                fontWeight: 'bold',
                                                color: team.team_points > 0 ? 'var(--color-success-600)' : team.team_points < 0 ? 'var(--color-danger-600)' : 'inherit'
                                            }}>
                                                {team.team_points}
                                            </td>
                                        )}
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card mt-6">
                <div className="flex justify-between items-center mb-4">
                    <h3>Cambios <span className="text-lg text-secondary font-normal ml-2">({changesUsed}/{maxChanges})</span></h3>
                </div>

                {historyLoading ? (
                    <p className="text-secondary">Cargando historial...</p>
                ) : !changesHistory || changesHistory.length === 0 ? (
                    <p className="text-secondary">No has realizado cambios.</p>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th style={{ width: '100px' }}>Fecha</th>
                                    <th><FaExchangeAlt className="text-danger mr-2 inline" style={{ transform: 'rotate(180deg)', marginRight: '8px' }} /> Sale</th>
                                    <th><FaExchangeAlt className="text-success mr-2 inline" style={{ marginRight: '8px' }} /> Entra</th>
                                </tr>
                            </thead>
                            <tbody>
                                {changesHistory.map((change: any) => (
                                    <tr key={change.id}>
                                        <td style={{ fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                                            {format(new Date(change.executed_at), "dd MMM", { locale: es })}
                                        </td>
                                        <td>
                                            <span style={{ color: 'var(--color-danger-600)' }} className="mr-2">↓</span>
                                            {change.from_team?.name || '???'}
                                        </td>
                                        <td>
                                            <span style={{ color: 'var(--color-success-600)' }} className="mr-2">↑</span>
                                            {change.to_team?.name || '???'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="card mt-6">
                <h3>Cambiar Contraseña</h3>
                {pwdError && <div className="alert alert-danger mb-4">{pwdError}</div>}
                {pwdSuccess && <div className="alert alert-success mb-4">{pwdSuccess}</div>}
                <form className="password-form" onSubmit={handlePasswordChange}>
                    <div className="form-group">
                        <label>Contraseña Actual</label>
                        <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} disabled={pwdLoading} />
                    </div>
                    <div className="form-group">
                        <label>Nueva Contraseña</label>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} disabled={pwdLoading} />
                    </div>
                    <div className="form-group">
                        <label>Confirmar Contraseña</label>
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={pwdLoading} />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={pwdLoading}>
                        {pwdLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
                    </button>
                </form>
            </div>
        </div>
    );
}
