import { Link } from "react-router-dom";
import { useLeaveRoom } from "../../hooks/useQueries";
import { Button } from "../ui/Button";
import type { CoLearningRoomFull } from "../../types";
import { useNavigate } from "react-router";
import { Crown, CalendarClock, Trash2 } from "lucide-react";

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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-[var(--text-primary)]">
          Members ({room.members.length}/{room.maxMembers})
        </h2>
        {!isAdmin && (
          <Button variant="ghost" onClick={handleLeave} className="text-sm text-red-400">
            Leave Room
          </Button>
        )}
      </div>

      <ul className="space-y-2">
        {room.members.map((member) => (
          <li key={member.id}>
            <Link
              to={`/u/${member.user.username}`}
              className="card card-interactive group flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:flex-nowrap"
            >
              {/* Avatar */}
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold text-slate-950"
                style={{
                  background: `linear-gradient(135deg, ${member.user.avatarColor}, rgb(var(--accent-2-rgb)))`,
                  boxShadow: `0 0 14px ${member.user.avatarColor}55`,
                }}
              >
                {member.user.avatarUrl ? (
                  <img src={member.user.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  member.user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
                )}
              </span>

              {/* Name + username */}
              <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                <div className="flex min-w-0 items-center gap-2">
                  <h4 className="truncate text-sm font-medium text-slate-100">
                    {member.user.name}
                  </h4>
                  {member.role === "ADMIN" && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-400/10 border border-amber-400/25 px-2 py-0.5 text-[10px] font-medium uppercase text-amber-300">
                      <Crown size={10} />
                      Admin
                    </span>
                  )}
                </div>
                <p className="mt-0.5 font-mono text-[11px] text-accent-bright/80">
                  @{member.user.username}
                </p>
              </div>

              {/* Joined date */}
              <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-ink-faint">
                <CalendarClock size={12} />
                {new Date(member.joinedAt).toLocaleDateString()}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
