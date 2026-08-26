import { useLeaderboard, useMe } from "../../hooks/useQueries";
import type { CoLearningRoomFull } from "../../types";
import { Trophy, Medal } from "lucide-react";

interface Props {
  room: CoLearningRoomFull;
}

interface LeaderboardEntry {
  userId: string;
  name: string;
  username: string;
  avatarColor: string;
  avatarUrl: string | null;
  quizzesTaken: number;
  totalScore: number;
  totalMax: number;
  averagePercent: number;
}

interface QuizWithSubmissions {
  id: string;
  questions: { id: string }[];
  submissions: { score: number | null; userId: string }[];
}

export function LeaderboardTab({ room }: Props) {
  const { data: quizzes = [] } = useLeaderboard(room.id) as { data: QuizWithSubmissions[] };
  const { data: me } = useMe();

  const entries = new Map<string, LeaderboardEntry>();

  for (const member of room.members) {
    if (member.role === "ADMIN") continue;
    entries.set(member.user.id, {
      userId: member.user.id,
      name: member.user.name,
      username: member.user.username,
      avatarColor: member.user.avatarColor,
      avatarUrl: member.user.avatarUrl ?? null,
      quizzesTaken: 0,
      totalScore: 0,
      totalMax: 0,
      averagePercent: 0,
    });
  }

  for (const quiz of quizzes) {
    const maxScore = quiz.questions?.length ?? 0;
    for (const sub of quiz.submissions ?? []) {
      const entry = entries.get(sub.userId);
      if (!entry) continue;
      entry.quizzesTaken += 1;
      entry.totalScore += sub.score ?? 0;
      entry.totalMax += maxScore;
    }
  }

  const sorted = [...entries.values()]
    .map((e) => ({
      ...e,
      averagePercent: e.totalMax > 0 ? Math.round((e.totalScore / e.totalMax) * 100) : 0,
    }))
    .sort((a, b) => b.averagePercent - a.averagePercent || b.totalScore - a.totalScore);

  const medals = ["text-amber-400", "text-slate-300", "text-amber-600"];

  return (
    <div>
      <h2 className="font-semibold text-[var(--text-primary)] mb-4">Leaderboard</h2>

      {quizzes.length === 0 ? (
        <p className="text-[var(--text-secondary)] text-sm py-8 text-center">
          No published quizzes yet. Rankings will appear here once quizzes are taken.
        </p>
      ) : sorted.length === 0 ? (
        <p className="text-[var(--text-secondary)] text-sm py-8 text-center">
          No submissions yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-3 px-3 text-[var(--text-secondary)] font-medium w-12">#</th>
                <th className="text-left py-3 px-3 text-[var(--text-secondary)] font-medium">Member</th>
                <th className="text-center py-3 px-3 text-[var(--text-secondary)] font-medium">Quizzes</th>
                <th className="text-center py-3 px-3 text-[var(--text-secondary)] font-medium">Score</th>
                <th className="text-center py-3 px-3 text-[var(--text-secondary)] font-medium">Average</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry, i) => {
                const isMe = entry.userId === me?.id;
                return (
                  <tr
                    key={entry.userId}
                    className={`border-b border-[var(--border)]/50 ${
                      isMe ? "bg-[var(--accent)]/5" : ""
                    } ${i < 3 ? "bg-white/[0.02]" : ""}`}
                  >
                    <td className="py-3 px-3">
                      {i < 3 ? (
                        <Medal size={16} className={medals[i]} />
                      ) : (
                        <span className="text-[var(--text-secondary)]">{i + 1}</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        {entry.avatarUrl ? (
                          <img
                            src={entry.avatarUrl}
                            alt={entry.username}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: entry.avatarColor }}
                          >
                            {entry.username[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="text-[var(--text-primary)] font-medium">
                            {entry.name}
                          </span>
                          <span className="text-[var(--text-secondary)] text-xs ml-1.5">
                            @{entry.username}
                          </span>
                          {isMe && (
                            <span className="ml-1.5 text-[10px] bg-[var(--accent)]/15 text-[var(--accent)] px-1.5 py-0.5 rounded-full font-medium">
                              You
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center text-[var(--text-secondary)]">
                      {entry.quizzesTaken}
                    </td>
                    <td className="py-3 px-3 text-center text-[var(--text-primary)] font-mono">
                      {entry.totalScore}/{entry.totalMax}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`font-mono font-semibold ${
                          entry.averagePercent >= 80
                            ? "text-emerald-400"
                            : entry.averagePercent >= 50
                            ? "text-amber-400"
                            : "text-red-400"
                        }`}
                      >
                        {entry.averagePercent}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
