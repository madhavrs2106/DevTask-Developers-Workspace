import { useNavigate } from "react-router";
import {
  UserMinus,
  Crown,
  Shield,
  CalendarDays,
  Mail,
  ExternalLink,
  Users,
} from "lucide-react";
import { useLeaveRoom } from "../../hooks/useQueries";
import { Button } from "../ui/Button";
import type { CoLearningRoomFull } from "../../types";

interface Props {
  room: CoLearningRoomFull;
  isAdmin: boolean;
}

export function MembersTab({ room, isAdmin }: Props) {
  const navigate = useNavigate();
  const leaveRoom = useLeaveRoom();

  const handleLeave = async () => {
    await leaveRoom.mutateAsync(room.id);
    navigate("/rooms");
  };

  const admin = room.members.find((m) => m.role === "ADMIN");
  const members = room.members.filter((m) => m.role !== "ADMIN");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Members
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {room.members.length} / {room.maxMembers} members
          </p>
        </div>
        {!isAdmin && (
          <Button variant="ghost" onClick={handleLeave} className="text-sm text-red-400 hover:text-red-300 gap-2">
            <UserMinus size={14} />
            Leave Room
          </Button>
        )}
      </div>

      {/* Admin Section */}
      {admin && (
        <div>
          <h3 className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3">
            Creator
          </h3>
          <div className="relative p-4 rounded-xl bg-[var(--accent)]/5 border border-[var(--accent)]/20">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold"
                  style={{ backgroundColor: admin.user.avatarColor }}
                >
                  {admin.user.avatarUrl ? (
                    <img src={admin.user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    admin.user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center">
                  <Crown size={12} className="text-yellow-900" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-[var(--text-primary)] truncate">{admin.user.name}</p>
                  <span className="px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 text-xs font-medium">
                    Admin
                  </span>
                </div>
                <p className="text-sm text-[var(--accent)]">@{admin.user.username}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Created {new Date(admin.joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <a
                href={`/u/${admin.user.username}`}
                className="p-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Members Grid */}
      {members.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3">
            Members
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="group p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent)]/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: member.user.avatarColor }}
                    >
                      {member.user.avatarUrl ? (
                        <img src={member.user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        member.user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
                      )}
                    </div>
                    {member.role === "ADMIN" && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center">
                        <Crown size={8} className="text-yellow-900" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {member.user.name}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] truncate">
                      @{member.user.username}
                    </p>
                  </div>
                  <a
                    href={`/u/${member.user.username}`}
                    className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>
                <div className="flex items-center gap-1.5 mt-3 text-xs text-[var(--text-secondary)]">
                  <CalendarDays size={12} />
                  Joined {new Date(member.joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {members.length === 0 && !admin && (
        <div className="text-center py-8">
          <Users size={32} className="mx-auto mb-3 text-[var(--text-secondary)] opacity-50" />
          <p className="text-sm text-[var(--text-secondary)]">No other members yet.</p>
        </div>
      )}
    </div>
  );
}
