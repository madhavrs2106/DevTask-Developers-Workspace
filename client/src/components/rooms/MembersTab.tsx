import { useLeaveRoom } from "../../hooks/useQueries";
import { Button } from "../ui/Button";
import type { CoLearningRoomFull } from "../../types";
import { useNavigate } from "react-router";

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
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-[var(--text-primary)]">
          Members ({room.members.length}/{room.maxMembers})
        </h2>
        {!isAdmin && (
          <Button variant="ghost" onClick={handleLeave} className="text-sm text-red-400">
            Leave Room
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {room.members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]"
          >
            {member.user.avatarUrl ? (
              <img
                src={member.user.avatarUrl}
                alt={member.user.username}
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{ backgroundColor: member.user.avatarColor }}
              >
                {member.user.username[0].toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {member.user.name}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">@{member.user.username}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {member.role === "ADMIN" && (
                <span className="text-xs bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-0.5 rounded-full">
                  Admin
                </span>
              )}
              <span className="text-xs text-[var(--text-secondary)]">
                Joined {new Date(member.joinedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
