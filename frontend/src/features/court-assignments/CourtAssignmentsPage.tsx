import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Sparkles, Trophy } from 'lucide-react';
import { badmintonApi, extractErrorMessage } from '../../services/api';
import { MatchStatus, type CourtAssignment } from '../../types';
import { formatDateVi } from '../../utils/formatters';
import { MatchStatusBadge } from '../../components/StatusBadge';

export const CourtAssignmentsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [selectedSessionId, setSelectedSessionId] = useState<number>(0);
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [courtId, setCourtId] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions-court-assign'],
    queryFn: () => badmintonApi.getSessions({ page: 1, pageSize: 20 }),
  });

  const sessions = sessionsData?.items || [];
  const activeSessionId = selectedSessionId || sessions.find((s) => s.status === 2)?.id || sessions[0]?.id || 0;

  const { data: courts = [] } = useQuery({
    queryKey: ['courts-all'],
    queryFn: () => badmintonApi.getCourts(),
  });

  const { data: matches = [] } = useQuery({
    queryKey: ['court-assignments', activeSessionId],
    queryFn: () => badmintonApi.getCourtAssignments(activeSessionId),
    enabled: activeSessionId > 0,
  });

  const autoGenerateMutation = useMutation({
    mutationFn: () => badmintonApi.autoGenerateCourtAssignments(activeSessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['court-assignments', activeSessionId] });
      setFeedback('Đã tự động ghép cặp cân bằng trình độ từ danh sách thành viên có mặt!');
    },
    onError: (err) => setFeedback(extractErrorMessage(err)),
  });

  const saveMatchMutation = useMutation({
    mutationFn: (payload: { id: number | null; data: Parameters<typeof badmintonApi.saveCourtAssignment>[1] }) =>
      badmintonApi.saveCourtAssignment(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['court-assignments', activeSessionId] });
      setTeamA('');
      setTeamB('');
    },
  });

  const handleCreateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamA.trim() || !teamB.trim() || !activeSessionId) return;
    const chosenCourtId = courtId || courts[0]?.id || 1;
    saveMatchMutation.mutate({
      id: null,
      data: {
        sessionId: activeSessionId,
        courtId: chosenCourtId,
        matchOrder: matches.length + 1,
        teamAPlayerNames: teamA,
        teamBPlayerNames: teamB,
        teamAScore: 0,
        teamBScore: 0,
        status: MatchStatus.InProgress,
        notes: 'Xếp sân thủ công',
      },
    });
  };

  const handleScoreBump = (m: CourtAssignment, side: 'A' | 'B', delta: number) => {
    const newA = side === 'A' ? Math.max(0, m.teamAScore + delta) : m.teamAScore;
    const newB = side === 'B' ? Math.max(0, m.teamBScore + delta) : m.teamBScore;
    const nextStatus = newA >= 21 || newB >= 21 ? MatchStatus.Completed : MatchStatus.InProgress;

    saveMatchMutation.mutate({
      id: m.id,
      data: {
        sessionId: m.sessionId,
        courtId: m.courtId,
        matchOrder: m.matchOrder,
        teamAPlayerNames: m.teamAPlayerNames,
        teamBPlayerNames: m.teamBPlayerNames,
        teamAScore: newA,
        teamBScore: newB,
        status: nextStatus,
        notes: m.notes,
      },
    });
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <h4 className="fw-bold mb-1">Điều phối Sân & Ghép cặp Đánh Đôi</h4>
          <div className="small text-muted">
            Phân bổ các cặp đôi vào từng sân trống và cập nhật tỉ số sét cầu trực tiếp.
          </div>
        </div>
        <button
          type="button"
          onClick={() => autoGenerateMutation.mutate()}
          disabled={!activeSessionId || autoGenerateMutation.isPending}
          className="btn btn-primary d-inline-flex align-items-center gap-2"
        >
          <Sparkles size={17} />
          <span>Ghép cặp tự động theo trình độ</span>
        </button>
      </div>

      {feedback && (
        <div className="alert alert-info d-flex justify-content-between align-items-center py-2 mb-0">
          <span>{feedback}</span>
          <button type="button" className="btn-close" onClick={() => setFeedback(null)} />
        </div>
      )}

      {/* Session & Manual Match Form */}
      <div className="row g-3">
        <div className="col-12 col-lg-5">
          <div className="bh-card p-3 h-100">
            <label className="form-label small fw-bold" style={{ color: 'var(--color-primary)' }}>
              BUỔI SINH HOẠT ĐANG ĐIỀU PHỐI
            </label>
            <select
              className="form-select"
              value={activeSessionId}
              onChange={(e) => setSelectedSessionId(Number(e.target.value))}
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  [{formatDateVi(s.sessionDate)}] {s.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <form onSubmit={handleCreateMatch} className="bh-card p-3 h-100">
            <div className="small fw-bold mb-2" style={{ color: 'var(--color-primary)' }}>
              XẾP KÈO ĐÔI MỚI VÀO SÂN
            </div>
            <div className="row g-2">
              <div className="col-12 col-sm-3">
                <select
                  className="form-select form-select-sm"
                  value={courtId}
                  onChange={(e) => setCourtId(Number(e.target.value))}
                >
                  {courts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.courtName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-sm-3">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Đội A (VD: Đức & Khánh)"
                  value={teamA}
                  onChange={(e) => setTeamA(e.target.value)}
                />
              </div>
              <div className="col-12 col-sm-3">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Đội B (VD: Hoàng & Kiệt)"
                  value={teamB}
                  onChange={(e) => setTeamB(e.target.value)}
                />
              </div>
              <div className="col-12 col-sm-3">
                <button type="submit" className="btn btn-primary btn-sm w-100 d-inline-flex align-items-center justify-content-center gap-1">
                  <Plus size={15} />
                  <span>Vào sân</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Matches Grid */}
      <div className="row g-3">
        {matches.map((m) => (
          <div key={m.id} className="col-12 col-md-6 col-xl-4">
            <div className={`bh-card p-3 h-100 ${m.status === MatchStatus.InProgress ? 'bh-card-selected' : ''}`}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="bh-badge bh-badge-navy">
                  Lượt #{m.matchOrder} • {m.courtName}
                </span>
                <MatchStatusBadge status={m.status} />
              </div>

              <div className="p-3 rounded border bg-white my-2">
                <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                  <div className="fw-bold">{m.teamAPlayerNames}</div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="fs-5 fw-bold" style={{ color: 'var(--color-primary)' }}>
                      {m.teamAScore}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleScoreBump(m, 'A', 1)}
                      className="btn btn-soft-blue btn-sm py-0 px-2"
                    >
                      +1
                    </button>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center">
                  <div className="fw-bold">{m.teamBPlayerNames}</div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="fs-5 fw-bold" style={{ color: 'var(--color-primary)' }}>
                      {m.teamBScore}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleScoreBump(m, 'B', 1)}
                      className="btn btn-soft-blue btn-sm py-0 px-2"
                    >
                      +1
                    </button>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center small text-muted mt-2">
                <span>{m.notes || 'Sét 21 điểm tiêu chuẩn BWF'}</span>
                {m.status !== MatchStatus.Completed && (
                  <button
                    type="button"
                    onClick={() =>
                      saveMatchMutation.mutate({
                        id: m.id,
                        data: {
                          sessionId: m.sessionId,
                          courtId: m.courtId,
                          matchOrder: m.matchOrder,
                          teamAPlayerNames: m.teamAPlayerNames,
                          teamBPlayerNames: m.teamBPlayerNames,
                          teamAScore: m.teamAScore,
                          teamBScore: m.teamBScore,
                          status: MatchStatus.Completed,
                          notes: m.notes,
                        },
                      })
                    }
                    className="btn btn-outline-primary btn-sm py-0 px-2 d-inline-flex align-items-center gap-1"
                  >
                    <Trophy size={13} />
                    <span>Kết thúc sét</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
