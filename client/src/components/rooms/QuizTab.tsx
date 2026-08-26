import { useState, useEffect } from "react";
import {
  useQuizzes,
  useQuiz,
  useCreateQuiz,
  useUpdateQuiz,
  useDeleteQuiz,
  useSubmitQuiz,
  useGradeSubmission,
  useDeleteSubmission,
  usePublishQuiz,
  useUnpublishQuiz,
} from "../../hooks/useQueries";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/Spinner";
import { Trash2, Plus, X, Check, Clock, FileText, ChevronDown, ChevronUp, Star, Send, EyeOff, Search, Pencil, AlertTriangle, Shield } from "lucide-react";
import { cn } from "../../lib/utils";
import { useAntiCheat } from "../../hooks/useAntiCheat";
import type { CoLearningRoomFull, Quiz, QuizQuestion } from "../../types";

interface QuizTabProps {
  room: CoLearningRoomFull;
  isAdmin: boolean;
}

type View = "list" | "create" | "edit" | "taking" | "detail" | "result";

export function QuizTab({ room, isAdmin }: QuizTabProps) {
  const [view, setView] = useState<View>("list");
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);

  const handleQuizSaved = () => {
    setView("list");
  };

  const handleTakeQuiz = (quizId: string) => {
    setSelectedQuizId(quizId);
    setView("taking");
  };

  const handleViewQuiz = (quizId: string) => {
    setSelectedQuizId(quizId);
    setView("detail");
  };

  const handleEditQuiz = (quizId: string) => {
    setSelectedQuizId(quizId);
    setView("edit");
  };

  const handleViewResult = (quizId: string) => {
    setSelectedQuizId(quizId);
    setView("result");
  };

  const handleBack = () => {
    setView("list");
    setSelectedQuizId(null);
  };

  if (view === "create") {
    return <CreateQuizView roomId={room.id} onCreated={handleQuizSaved} onCancel={handleBack} />;
  }

  if (view === "edit" && selectedQuizId) {
    return <EditQuizView roomId={room.id} quizId={selectedQuizId} onSaved={handleQuizSaved} onCancel={handleBack} />;
  }

  if (view === "result" && selectedQuizId) {
    return <QuizResultView roomId={room.id} quizId={selectedQuizId} onBack={handleBack} />;
  }

  if ((view === "taking" || view === "detail") && selectedQuizId) {
    return (
      <QuizDetailView
        roomId={room.id}
        quizId={selectedQuizId}
        isAdmin={isAdmin}
        onBack={handleBack}
      />
    );
  }

  return <QuizListView room={room} isAdmin={isAdmin} onCreate={() => setView("create")} onTakeQuiz={handleTakeQuiz} onViewQuiz={handleViewQuiz} onEditQuiz={handleEditQuiz} onViewResult={handleViewResult} />;
}

/* ─── Quiz List View ───────────────────────────────────────────── */

function QuizListView({
  room,
  isAdmin,
  onCreate,
  onTakeQuiz,
  onViewQuiz,
  onEditQuiz,
  onViewResult,
}: {
  room: CoLearningRoomFull;
  isAdmin: boolean;
  onCreate: () => void;
  onTakeQuiz: (id: string) => void;
  onViewQuiz: (id: string) => void;
  onEditQuiz: (id: string) => void;
  onViewResult: (id: string) => void;
}) {
  const { data: quizzes = [], isLoading } = useQuizzes(room.id);
  const deleteQuiz = useDeleteQuiz(room.id);
  const publishQuiz = usePublishQuiz(room.id);
  const unpublishQuiz = useUnpublishQuiz(room.id);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-faint">
          {quizzes.length} quiz{quizzes.length !== 1 && "es"}
        </p>
        {isAdmin && (
          <Button variant="primary" size="sm" onClick={onCreate}>
            <Plus size={14} className="mr-1" />
            Create Quiz
          </Button>
        )}
      </div>

      {quizzes.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-surface-raised p-8 text-center">
          <FileText size={32} className="mx-auto mb-3 text-slate-600" />
          <p className="text-sm font-medium text-white">No quizzes yet</p>
          <p className="mt-1 text-xs text-ink-faint">
            {isAdmin ? "Create a quiz to test your members' knowledge." : "The admin hasn't created any quizzes yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {quizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              isAdmin={isAdmin}
              onTake={() => onTakeQuiz(quiz.id)}
              onView={() => onViewQuiz(quiz.id)}
              onEdit={() => onEditQuiz(quiz.id)}
              onViewResult={() => onViewResult(quiz.id)}
              onDelete={() => deleteQuiz.mutateAsync(quiz.id)}
              onPublish={() => publishQuiz.mutateAsync(quiz.id)}
              onUnpublish={() => unpublishQuiz.mutateAsync(quiz.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function QuizCard({
  quiz,
  isAdmin,
  onTake,
  onView,
  onEdit,
  onViewResult,
  onDelete,
  onPublish,
  onUnpublish,
}: {
  quiz: Quiz;
  isAdmin: boolean;
  onTake: () => void;
  onView: () => void;
  onEdit: () => void;
  onViewResult: () => void;
  onDelete: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const questionCount = quiz._count?.questions ?? quiz.questions?.length ?? 0;
  const submissionCount = quiz._count?.submissions ?? quiz.submissions?.length ?? 0;
  const isDraft = quiz.status === "DRAFT";
  const mySubmission = quiz.mySubmission;
  const hasSubmitted = !!mySubmission;

  const getScoreColor = (score: number | null, total: number) => {
    if (score === null) return "text-slate-400";
    const pct = (score / total) * 100;
    if (pct >= 80) return "text-teal-400";
    if (pct >= 50) return "text-amber-400";
    return "text-red-400";
  };

  return (
    <div className={cn(
      "rounded-xl border bg-surface-raised overflow-hidden",
      isDraft ? "border-amber-400/25" : "border-slate-800"
    )}>
      <div
        className="p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white truncate flex-1 min-w-0">{quiz.title}</h3>
          {isDraft && (
            <span className="shrink-0 rounded-full bg-amber-400/10 border border-amber-400/25 px-2 py-0.5 text-[10px] font-medium uppercase text-amber-300">
              Draft
            </span>
          )}
          {isAdmin && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
            >
              <Trash2 size={14} />
            </button>
          )}
          {expanded ? <ChevronUp size={16} className="text-slate-500 shrink-0" /> : <ChevronDown size={16} className="text-slate-500 shrink-0" />}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-ink-faint">
          <span>{questionCount} question{questionCount !== 1 && "s"}</span>
          <span>{submissionCount} submission{submissionCount !== 1 && "s"}</span>
          <span>by {quiz.creator.name}</span>
        </div>

        {/* Action buttons — full width below info */}
        {isAdmin ? (
          <div className="mt-3 flex items-center gap-2">
            {isDraft ? (
              <>
                <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); onPublish(); }} className="flex-1">
                  <Send size={12} className="mr-1" />
                  Publish
                </Button>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(); }} className="flex-1">
                  <Pencil size={12} className="mr-1" />
                  Edit
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onUnpublish(); }} className="flex-1 text-amber-400 hover:bg-amber-400/10">
                  <EyeOff size={12} className="mr-1" />
                  Unpublish
                </Button>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(); }} className="flex-1">
                  <Pencil size={12} className="mr-1" />
                  Edit
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onView(); }} className="flex-1">
              View
            </Button>
          </div>
        ) : hasSubmitted ? (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 flex items-center justify-between rounded-lg border border-slate-800 bg-white/[0.02] px-4 py-2.5">
              <span className="text-xs text-ink-faint">Your score</span>
              <span className={cn("text-sm font-bold", getScoreColor(mySubmission.score, questionCount))}>
                {mySubmission.score}/{questionCount}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onViewResult(); }}>
              Result
            </Button>
          </div>
        ) : (
          <div className="mt-3">
            <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); onTake(); }} className="w-full">
              Take Quiz
            </Button>
          </div>
        )}
      </div>

      {expanded && quiz.description && (
        <div className="px-4 pb-4 border-t border-slate-800/60 pt-3">
          <p className="text-xs text-ink-faint whitespace-pre-wrap">{quiz.description}</p>
        </div>
      )}
    </div>
  );
}

/* ─── Create Quiz View ─────────────────────────────────────────── */

function CreateQuizView({
  roomId,
  onCreated,
  onCancel,
}: {
  roomId: string;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const createQuiz = useCreateQuiz(roomId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<{
    text: string;
    type: "MCQ" | "NUMERICAL";
    options: string[];
    answer: string;
  }[]>([{ text: "", type: "MCQ", options: ["", ""], answer: "" }]);

  const addQuestion = () => {
    if (questions.length >= 20) return;
    setQuestions([...questions, { text: "", type: "MCQ", options: ["", ""], answer: "" }]);
  };

  const removeQuestion = (i: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, idx) => idx !== i));
  };

  const updateQuestion = (i: number, patch: Partial<typeof questions[number]>) => {
    setQuestions(questions.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  };

  const updateOption = (qi: number, oi: number, value: string) => {
    setQuestions(questions.map((q, idx) => {
      if (idx !== qi) return q;
      const newOpts = [...q.options];
      newOpts[oi] = value;
      return { ...q, options: newOpts };
    }));
  };

  const addOption = (qi: number) => {
    setQuestions(questions.map((q, idx) => {
      if (idx !== qi) return q;
      return { ...q, options: [...q.options, ""] };
    }));
  };

  const removeOption = (qi: number, oi: number) => {
    setQuestions(questions.map((q, idx) => {
      if (idx !== qi) return q;
      if (q.options.length <= 2) return q;
      const newOpts = q.options.filter((_, idx) => idx !== oi);
      return { ...q, options: newOpts, answer: q.answer === q.options[oi] ? "" : q.answer };
    }));
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    const valid = questions.every(
      (q) => q.text.trim() && q.answer.trim() &&
        (q.type === "NUMERICAL" || q.options.every((o) => o.trim()))
    );
    if (!valid) return;

    await createQuiz.mutateAsync({
      title: title.trim(),
      description: description.trim() || undefined,
      questions: questions.map((q) => ({
        text: q.text.trim(),
        type: q.type,
        options: q.type === "MCQ" ? q.options.map((o) => o.trim()) : undefined,
        answer: q.answer.trim(),
      })),
    });
    onCreated();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Create Quiz</h2>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X size={14} className="mr-1" />
          Cancel
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-ink-faint mb-1.5">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-dark w-full"
            placeholder="Quiz title"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-faint mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-dark w-full min-h-[60px] font-mono"
            placeholder="Optional description (supports multi-line)"
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                const ta = e.currentTarget;
                const start = ta.selectionStart;
                const end = ta.selectionEnd;
                const val = ta.value;
                setDescription(val.substring(0, start) + "\t" + val.substring(end));
                setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + 1; }, 0);
              }
            }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, qi) => (
          <div key={qi} className="rounded-xl border border-slate-800 bg-surface-raised p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-accent-bright">Question {qi + 1}</span>
              <div className="flex items-center gap-2">
                <select
                  value={q.type}
                  onChange={(e) => updateQuestion(qi, {
                    type: e.target.value as "MCQ" | "NUMERICAL",
                    options: e.target.value === "NUMERICAL" ? [] : ["", ""],
                  })}
                  className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white"
                >
                  <option value="MCQ">Multiple Choice</option>
                  <option value="NUMERICAL">Numerical</option>
                </select>
                {questions.length > 1 && (
                  <button
                    onClick={() => removeQuestion(qi)}
                    className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>

            <textarea
              value={q.text}
              onChange={(e) => updateQuestion(qi, { text: e.target.value })}
              className="input-dark w-full text-sm font-mono min-h-[60px]"
              placeholder="Question text (supports multi-line & code)"
              onKeyDown={(e) => {
                if (e.key === "Tab") {
                  e.preventDefault();
                  const ta = e.currentTarget;
                  const start = ta.selectionStart;
                  const end = ta.selectionEnd;
                  const val = ta.value;
                  updateQuestion(qi, { text: val.substring(0, start) + "\t" + val.substring(end) });
                  setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + 1; }, 0);
                }
              }}
            />

            {q.type === "MCQ" ? (
              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`answer-${qi}`}
                      checked={q.answer === opt}
                      onChange={() => updateQuestion(qi, { answer: opt })}
                      className="accent-[var(--accent)]"
                      disabled={!opt.trim()}
                    />
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => updateOption(qi, oi, e.target.value)}
                      className="input-dark flex-1 text-sm"
                      placeholder={`Option ${oi + 1}`}
                    />
                    {q.options.length > 2 && (
                      <button
                        onClick={() => removeOption(qi, oi)}
                        className="p-1 rounded text-slate-500 hover:text-red-400"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))}
                {q.options.length < 6 && (
                  <button
                    onClick={() => addOption(qi)}
                    className="text-xs text-accent-bright hover:underline"
                  >
                    + Add option
                  </button>
                )}
              </div>
            ) : (
              <input
                type="text"
                value={q.answer}
                onChange={(e) => updateQuestion(qi, { answer: e.target.value })}
                className="input-dark w-full text-sm"
                placeholder="Correct answer (number)"
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={addQuestion} disabled={questions.length >= 20}>
          <Plus size={14} className="mr-1" />
          Add Question ({questions.length}/20)
        </Button>
        <div className="flex-1" />
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={createQuiz.isPending}
        >
          {createQuiz.isPending ? "Creating..." : "Create Quiz"}
        </Button>
      </div>
    </div>
  );
}

/* ─── Edit Quiz View ─────────────────────────────────────────── */

function EditQuizView({
  roomId,
  quizId,
  onSaved,
  onCancel,
}: {
  roomId: string;
  quizId: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { data: quiz, isLoading } = useQuiz(roomId, quizId);
  const updateQuiz = useUpdateQuiz(roomId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<{
    text: string;
    type: "MCQ" | "NUMERICAL";
    options: string[];
    answer: string;
  }[]>([]);
  const [initialized, setInitialized] = useState(false);

  if (quiz && !initialized && quiz.questions) {
    const parsedQuestions = quiz.questions.map((q) => {
      const textOnly = q.text.replace(/!\[image\]\([^)]+\)/g, "").trim();
      let parsedOptions: string[] = [];
      if (q.type === "MCQ" && q.options) {
        parsedOptions = JSON.parse(q.options).map((opt: string) => {
          return opt.replace(/!\[image\]\([^)]+\)/g, "").trim();
        });
      }
      return {
        text: textOnly,
        type: q.type as "MCQ" | "NUMERICAL",
        options: parsedOptions.length > 0 ? parsedOptions : ["", ""],
        answer: q.answer ?? "",
      };
    });
    setTitle(quiz.title);
    setDescription(quiz.description ?? "");
    setQuestions(parsedQuestions);
    setInitialized(true);
  }

  const addQuestion = () => {
    if (questions.length >= 20) return;
    setQuestions([...questions, { text: "", type: "MCQ", options: ["", ""], answer: "" }]);
  };

  const removeQuestion = (i: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, idx) => idx !== i));
  };

  const updateQuestion = (i: number, patch: Partial<typeof questions[number]>) => {
    setQuestions(questions.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  };

  const updateOption = (qi: number, oi: number, value: string) => {
    setQuestions(questions.map((q, idx) => {
      if (idx !== qi) return q;
      const newOpts = [...q.options];
      newOpts[oi] = value;
      return { ...q, options: newOpts };
    }));
  };

  const addOption = (qi: number) => {
    setQuestions(questions.map((q, idx) => {
      if (idx !== qi) return q;
      return { ...q, options: [...q.options, ""] };
    }));
  };

  const removeOption = (qi: number, oi: number) => {
    setQuestions(questions.map((q, idx) => {
      if (idx !== qi) return q;
      if (q.options.length <= 2) return q;
      const newOpts = q.options.filter((_, idx) => idx !== oi);
      return { ...q, options: newOpts, answer: q.answer === q.options[oi] ? "" : q.answer };
    }));
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    const valid = questions.every(
      (q) => q.text.trim() && q.answer.trim() &&
        (q.type === "NUMERICAL" || q.options.every((o) => o.trim()))
    );
    if (!valid) return;

    await updateQuiz.mutateAsync({
      quizId,
      data: {
        title: title.trim(),
        description: description.trim() || undefined,
        questions: questions.map((q) => ({
          text: q.text.trim(),
          type: q.type,
          options: q.type === "MCQ" ? q.options.map((o) => o.trim()) : undefined,
          answer: q.answer.trim(),
        })),
      },
    });
    onSaved();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-16">
        <p className="text-ink-faint">Quiz not found.</p>
        <Button variant="ghost" className="mt-4" onClick={onCancel}>Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Edit Quiz</h2>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X size={14} className="mr-1" />
          Cancel
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-ink-faint mb-1.5">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-dark w-full"
            placeholder="Quiz title"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-faint mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-dark w-full min-h-[60px] font-mono"
            placeholder="Optional description (supports multi-line)"
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                const ta = e.currentTarget;
                const start = ta.selectionStart;
                const end = ta.selectionEnd;
                const val = ta.value;
                setDescription(val.substring(0, start) + "\t" + val.substring(end));
                setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + 1; }, 0);
              }
            }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, qi) => (
          <div key={qi} className="rounded-xl border border-slate-800 bg-surface-raised p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-accent-bright">Question {qi + 1}</span>
              <div className="flex items-center gap-2">
                <select
                  value={q.type}
                  onChange={(e) => updateQuestion(qi, {
                    type: e.target.value as "MCQ" | "NUMERICAL",
                    options: e.target.value === "NUMERICAL" ? [] : ["", ""],
                  })}
                  className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white"
                >
                  <option value="MCQ">Multiple Choice</option>
                  <option value="NUMERICAL">Numerical</option>
                </select>
                {questions.length > 1 && (
                  <button
                    onClick={() => removeQuestion(qi)}
                    className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>

            <textarea
              value={q.text}
              onChange={(e) => updateQuestion(qi, { text: e.target.value })}
              className="input-dark w-full text-sm font-mono min-h-[60px]"
              placeholder="Question text (supports multi-line & code)"
              onKeyDown={(e) => {
                if (e.key === "Tab") {
                  e.preventDefault();
                  const ta = e.currentTarget;
                  const start = ta.selectionStart;
                  const end = ta.selectionEnd;
                  const val = ta.value;
                  updateQuestion(qi, { text: val.substring(0, start) + "\t" + val.substring(end) });
                  setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + 1; }, 0);
                }
              }}
            />

            {q.type === "MCQ" ? (
              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`answer-${qi}`}
                      checked={q.answer === opt}
                      onChange={() => updateQuestion(qi, { answer: opt })}
                      className="accent-[var(--accent)]"
                      disabled={!opt.trim()}
                    />
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => updateOption(qi, oi, e.target.value)}
                      className="input-dark flex-1 text-sm"
                      placeholder={`Option ${oi + 1}`}
                    />
                    {q.options.length > 2 && (
                      <button
                        onClick={() => removeOption(qi, oi)}
                        className="p-1 rounded text-slate-500 hover:text-red-400"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))}
                {q.options.length < 6 && (
                  <button
                    onClick={() => addOption(qi)}
                    className="text-xs text-accent-bright hover:underline"
                  >
                    + Add option
                  </button>
                )}
              </div>
            ) : (
              <input
                type="text"
                value={q.answer}
                onChange={(e) => updateQuestion(qi, { answer: e.target.value })}
                className="input-dark w-full text-sm"
                placeholder="Correct answer (number)"
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={addQuestion} disabled={questions.length >= 20}>
          <Plus size={14} className="mr-1" />
          Add Question ({questions.length}/20)
        </Button>
        <div className="flex-1" />
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={updateQuiz.isPending}
        >
          {updateQuiz.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

/* ─── Quiz Detail View ─────────────────────────────────────────── */

function QuizDetailView({
  roomId,
  quizId,
  isAdmin,
  onBack,
}: {
  roomId: string;
  quizId: string;
  isAdmin: boolean;
  onBack: () => void;
}) {
  const { data: quiz, isLoading } = useQuiz(roomId, quizId);
  const submitQuiz = useSubmitQuiz(roomId, quizId);
  const gradeSubmission = useGradeSubmission(roomId, quizId);
  const deleteSubmission = useDeleteSubmission(roomId, quizId);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [gradeInputs, setGradeInputs] = useState<Record<string, { score: string; feedback: string }>>({});
  const [submissionQuery, setSubmissionQuery] = useState("");
  const [expandedSubmissions, setExpandedSubmissions] = useState<Set<string>>(new Set());
  const [sortMode, setSortMode] = useState<"default" | "low" | "high">("default");
  const [quizStarted, setQuizStarted] = useState(false);

  const isTakingQuiz = !isAdmin && !quiz?.mySubmission && !submitted;
  const {
    violations,
    isLocked,
    showWarning,
    warningMessage,
    isFullscreen,
    requestFullscreen,
    exitFullscreen,
    clearLock,
  } = useAntiCheat({
    quizId,
    enabled: isTakingQuiz && quizStarted,
    onViolation: () => {},
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-16">
        <p className="text-ink-faint">Quiz not found.</p>
        <Button variant="ghost" className="mt-4" onClick={onBack}>Back</Button>
      </div>
    );
  }

  const mySubmission = quiz.mySubmission;
  const hasSubmitted = !!mySubmission;
  const questions = quiz.questions ?? [];

  const handleSubmit = async () => {
    const allAnswered = questions.every((q) => answers[q.id]?.trim());
    if (!allAnswered) return;
    await submitQuiz.mutateAsync(answers);
    clearLock();
    setSubmitted(true);
  };

  const handleGrade = async (submissionId: string) => {
    const input = gradeInputs[submissionId];
    if (!input || !input.score.trim()) return;
    await gradeSubmission.mutateAsync({
      submissionId,
      score: parseInt(input.score, 10),
      feedback: input.feedback.trim() || undefined,
    });
    setGradeInputs((prev) => ({ ...prev, [submissionId]: { score: "", feedback: "" } }));
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    await deleteSubmission.mutateAsync(submissionId);
  };

  const getScoreColor = (score: number | null, total: number) => {
    if (score === null) return "text-slate-400";
    const pct = (score / total) * 100;
    if (pct >= 80) return "text-teal-400";
    if (pct >= 50) return "text-amber-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="text-xs text-ink-muted hover:text-accent-bright transition-colors mb-1"
          >
            Back to quizzes
          </button>
          <h2 className="text-lg font-bold text-white">{quiz.title}</h2>
          {quiz.description && (
            <p className="mt-1 text-sm text-ink-faint whitespace-pre-wrap">{quiz.description}</p>
          )}
        </div>
        <span className="text-xs text-ink-faint">
          {questions.length} question{questions.length !== 1 && "s"}
        </span>
      </div>

      {/* Questions — for taking or admin viewing */}
      {!isAdmin && !hasSubmitted && !submitted && (
        <>
          {/* Anti-cheat warning overlay */}
          {showWarning && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-in fade-in">
              <div className="bg-red-900/90 border border-red-500 rounded-xl p-8 text-center max-w-sm mx-4">
                <AlertTriangle size={48} className="mx-auto mb-4 text-red-400" />
                <p className="text-white font-bold text-lg">Warning!</p>
                <p className="text-red-200 mt-2">{warningMessage}</p>
                <p className="text-red-300/70 text-sm mt-3">
                  This is your only attempt.
                </p>
              </div>
            </div>
          )}

          {/* Quiz locked screen */}
          {isLocked && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
              <div className="bg-slate-900 border border-red-500 rounded-xl p-8 text-center max-w-sm mx-4">
                <Shield size={48} className="mx-auto mb-4 text-red-400" />
                <p className="text-white font-bold text-lg">Quiz Locked</p>
                <p className="text-slate-300 mt-2">
                  You have exceeded the maximum number of violations.
                </p>
                <p className="text-slate-400 text-sm mt-2">
                  Please contact your admin to retake the quiz.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {!quizStarted ? (
              <div className="card p-6 text-center">
                <Shield size={40} className="mx-auto mb-3 text-[var(--accent)]" />
                <h3 className="text-white font-semibold mb-2">Quiz Rules</h3>
                <ul className="text-sm text-ink-faint space-y-1.5 mb-4">
                  <li>Tab switching is monitored</li>
                  <li>Screenshots are blocked</li>
                  <li>Right-click is disabled</li>
                  <li>Keyboard shortcuts are restricted</li>
                  <li>1 violation = quiz locked immediately</li>
                </ul>
                <Button
                  variant="primary"
                  onClick={() => {
                    requestFullscreen();
                    setQuizStarted(true);
                  }}
                >
                  Start Quiz
                </Button>
              </div>
            ) : (
              <>
                {/* Violation counter */}
                {violations > 0 && (
                  <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
                    <AlertTriangle size={14} />
                    <span>
                      {violations} violation — quiz is now locked
                    </span>
                  </div>
                )}

                {/* Fullscreen indicator */}
                {!isFullscreen && (
                  <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
                    <AlertTriangle size={14} />
                    <span>Quiz works best in fullscreen. </span>
                    <button
                      onClick={requestFullscreen}
                      className="underline hover:text-amber-300"
                    >
                      Enter fullscreen
                    </button>
                  </div>
                )}

                {questions.map((q, i) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    index={i}
                    value={answers[q.id] ?? ""}
                    onChange={(val) => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
                    showAnswer={false}
                  />
                ))}
                <div className="flex justify-end">
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={submitQuiz.isPending || !questions.every((q) => answers[q.id]?.trim()) || isLocked}
                  >
                    {submitQuiz.isPending ? "Submitting..." : "Submit Quiz"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* After submission */}
      {submitted && mySubmission && (
        <div className="rounded-xl border border-teal-400/25 bg-teal-400/5 p-6 text-center">
          <Check size={32} className="mx-auto mb-2 text-teal-400" />
          <p className="font-semibold text-white">Quiz submitted!</p>
          <p className="mt-1 text-sm text-ink-faint">
            {mySubmission.status === "GRADED"
              ? `Score: ${mySubmission.score}/${questions.length}`
              : "Waiting for admin to grade."}
          </p>
        </div>
      )}

      {/* Already submitted */}
      {!isAdmin && hasSubmitted && mySubmission && (
        <div className="space-y-4">
          {questions.map((q, i) => {
            const parsed = JSON.parse(mySubmission.answers ?? "{}");
            return (
              <QuestionCard
                key={q.id}
                question={q}
                index={i}
                value={parsed[q.id] ?? ""}
                onChange={() => {}}
                showAnswer={false}
                disabled
                userAnswer={parsed[q.id]}
              />
            );
          })}
          <div className="rounded-xl border border-slate-800 bg-surface-raised p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-faint">Your submission</span>
              {mySubmission.status === "GRADED" ? (
                <span className={cn("text-sm font-bold", getScoreColor(mySubmission.score, questions.length))}>
                  {mySubmission.score}/{questions.length}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-amber-400">
                  <Clock size={12} />
                  Pending review
                </span>
              )}
            </div>
            {mySubmission.feedback && (
              <p className="mt-2 text-xs text-ink-faint">{mySubmission.feedback}</p>
            )}
          </div>
        </div>
      )}

      {/* Admin: view submissions & grade */}
      {isAdmin && quiz.submissions && quiz.submissions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-white shrink-0">Submissions ({quiz.submissions.length})</h3>
            <div className="flex-1 flex items-center gap-2 max-w-xs">
              <div className="relative flex-1">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={submissionQuery}
                  onChange={(e) => setSubmissionQuery(e.target.value)}
                  placeholder="Search by name or username…"
                  className="input-dark w-full pl-8 text-sm"
                />
              </div>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as "default" | "low" | "high")}
                className="shrink-0 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-ink-faint"
              >
                <option value="default">Sort</option>
                <option value="low">Low %</option>
                <option value="high">High %</option>
              </select>
            </div>
          </div>
          {quiz.submissions
            .slice()
            .sort((a, b) => {
              if (sortMode === "default") return 0;
              const pctA = questions.length > 0 ? ((a.score ?? 0) / questions.length) * 100 : 0;
              const pctB = questions.length > 0 ? ((b.score ?? 0) / questions.length) * 100 : 0;
              return sortMode === "low" ? pctA - pctB : pctB - pctA;
            })
            .filter((sub) => {
              if (!submissionQuery.trim()) return true;
              const q = submissionQuery.toLowerCase();
              return (
                sub.user.name.toLowerCase().includes(q) ||
                sub.user.username.toLowerCase().includes(q)
              );
            })
            .map((sub) => {
            const parsed = JSON.parse(sub.answers ?? "{}");
            const isGraded = sub.status === "GRADED";
            return (
              <div key={sub.id} className="rounded-xl border border-slate-800 bg-surface-raised p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold text-slate-950"
                      style={{
                        background: `linear-gradient(135deg, ${sub.user.avatarColor}, rgb(var(--accent-2-rgb)))`,
                      }}
                    >
                      {sub.user.avatarUrl ? (
                        <img src={sub.user.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                      ) : (
                        sub.user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
                      )}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white">{sub.user.name}</p>
                      <p className="text-[11px] text-ink-faint">@{sub.user.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isGraded ? (
                      <span className={cn("text-sm font-bold", getScoreColor(sub.score, questions.length))}>
                        {sub.score}/{questions.length}
                        <span className="text-xs font-normal text-ink-faint ml-1.5">
                          ({Math.round(((sub.score ?? 0) / questions.length) * 100)}%)
                        </span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-amber-400">
                        <Clock size={12} />
                        Pending
                      </span>
                    )}
                    <button
                      onClick={() => handleDeleteSubmission(sub.id)}
                      className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                    <button
                      onClick={() => setExpandedSubmissions((prev) => {
                        const next = new Set(prev);
                        if (next.has(sub.id)) next.delete(sub.id);
                        else next.add(sub.id);
                        return next;
                      })}
                      className="p-1 rounded text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      {expandedSubmissions.has(sub.id)
                        ? <ChevronUp size={14} />
                        : <ChevronDown size={14} />
                      }
                    </button>
                  </div>
                </div>

                {/* Show answers — collapsed by default */}
                {expandedSubmissions.has(sub.id) && (
                  <div className="grid gap-2 border-t border-slate-800/60 pt-3">
                    {questions.map((q, i) => (
                      <div key={q.id} className="flex items-start gap-2 text-xs">
                        <span className="text-ink-faint shrink-0">Q{i + 1}:</span>
                        <span className="text-white">{parsed[q.id] ?? "—"}</span>
                        {q.type === "MCQ" && (
                          <span className="text-ink-faint ml-auto">
                            Answer: {JSON.parse(q.options ?? "[]")[parseInt(q.answer || "0")] ?? q.answer}
                          </span>
                        )}
                        {q.type === "NUMERICAL" && (
                          <span className="text-ink-faint ml-auto">Answer: {q.answer}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Grade input */}
                {!isGraded && (
                  <div className="flex items-end gap-2 border-t border-slate-800/60 pt-3">
                    <div className="flex-1">
                      <label className="block text-[10px] text-ink-faint mb-1">Score (0-{questions.length})</label>
                      <input
                        type="number"
                        min={0}
                        max={questions.length}
                        value={gradeInputs[sub.id]?.score ?? ""}
                        onChange={(e) => setGradeInputs((prev) => ({
                          ...prev,
                          [sub.id]: { ...prev[sub.id], score: e.target.value, feedback: prev[sub.id]?.feedback ?? "" },
                        }))}
                        className="input-dark w-full text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] text-ink-faint mb-1">Feedback</label>
                      <input
                        type="text"
                        value={gradeInputs[sub.id]?.feedback ?? ""}
                        onChange={(e) => setGradeInputs((prev) => ({
                          ...prev,
                          [sub.id]: { ...prev[sub.id], feedback: e.target.value, score: prev[sub.id]?.score ?? "" },
                        }))}
                        className="input-dark w-full text-sm"
                        placeholder="Optional feedback"
                      />
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleGrade(sub.id)}
                      disabled={!gradeInputs[sub.id]?.score?.trim()}
                    >
                      <Star size={13} className="mr-1" />
                      Grade
                    </Button>
                  </div>
                )}

                {isGraded && sub.feedback && (
                  <p className="text-xs text-ink-faint border-t border-slate-800/60 pt-2">Feedback: {sub.feedback}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isAdmin && quiz.submissions && quiz.submissions.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-ink-faint">No submissions yet.</p>
        </div>
      )}
    </div>
  );
}

/* ─── Question Card ────────────────────────────────────────────── */

/* ─── Quiz Result View ────────────────────────────────────────── */

function QuizResultView({
  roomId,
  quizId,
  onBack,
}: {
  roomId: string;
  quizId: string;
  onBack: () => void;
}) {
  const { data: quiz, isLoading } = useQuiz(roomId, quizId);

  const getScoreColor = (score: number, total: number) => {
    const pct = (score / total) * 100;
    if (pct >= 80) return "text-teal-400";
    if (pct >= 50) return "text-amber-400";
    return "text-red-400";
  };

  const getRowColor = (userAnswer: string, correctAnswer: string) => {
    if (userAnswer === correctAnswer) return "bg-teal-400/5";
    return "bg-red-400/5";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-16">
        <p className="text-ink-faint">Quiz not found.</p>
        <Button variant="ghost" className="mt-4" onClick={onBack}>Back</Button>
      </div>
    );
  }

  const mySubmission = quiz.mySubmission;
  if (!mySubmission) {
    return (
      <div className="text-center py-16">
        <p className="text-ink-faint">No submission found.</p>
        <Button variant="ghost" className="mt-4" onClick={onBack}>Back</Button>
      </div>
    );
  }

  const questions = quiz.questions ?? [];
  const userAnswers = JSON.parse(mySubmission.answers ?? "{}");
  const totalQuestions = questions.length;
  const score = mySubmission.score ?? 0;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="text-xs text-ink-muted hover:text-accent-bright transition-colors mb-1"
          >
            Back to quizzes
          </button>
          <h2 className="text-lg font-bold text-white">Result: {quiz.title}</h2>
        </div>
      </div>

      {/* Score summary */}
      <div className="rounded-xl border border-slate-800 bg-surface-raised p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-slate-800 bg-white/[0.02] p-4 text-center">
            <p className="text-3xl font-bold text-white">{score}/{totalQuestions}</p>
            <p className="text-xs text-ink-faint mt-1">Total Marks Obtained</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-white/[0.02] p-4 text-center">
            <p className={cn("text-3xl font-bold", getScoreColor(score, totalQuestions))}>{percentage}%</p>
            <p className="text-xs text-ink-faint mt-1">Percentage</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-white/[0.02] p-4 text-center">
            <p className="text-3xl font-bold text-teal-400">{score}</p>
            <p className="text-xs text-ink-faint mt-1">Correct</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-white/[0.02] p-4 text-center">
            <p className="text-3xl font-bold text-red-400">{totalQuestions - score}</p>
            <p className="text-xs text-ink-faint mt-1">Incorrect</p>
          </div>
        </div>
      </div>

      {/* Results table */}
      <div className="rounded-xl border border-slate-800 bg-surface-raised overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-white/[0.02]">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-faint">Q#</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-faint">Question</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-faint">Correct Answer</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-faint">Your Answer</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-ink-faint">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {questions.map((q, i) => {
                const userAnswer = userAnswers[q.id] ?? "—";
                let correctAnswer = q.answer;
                if (q.type === "MCQ" && q.options) {
                  const opts = JSON.parse(q.options);
                  correctAnswer = opts[parseInt(q.answer)] ?? q.answer;
                }
                const isCorrect = (userAnswers[q.id] ?? "").trim() === q.answer.trim();

                // Parse question text (strip image markdown for display)
                const questionText = q.text.replace(/!\[image\]\([^)]+\)/g, "").trim() || "—";

                // Strip image markdown from answer text
                const cleanAnswer = (val: string) => {
                  if (!val || val === "—") return <span>—</span>;
                  const clean = val.replace(/!\[image\]\([^)]+\)/g, "").trim();
                  return <span>{clean || "—"}</span>;
                };

                return (
                  <tr key={q.id} className={cn("transition-colors", getRowColor(userAnswers[q.id] ?? "", q.answer))}>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-accent-bright">{i + 1}</td>
                    <td className="px-4 py-3 text-white max-w-[200px]">
                      <p className="truncate" title={questionText}>{questionText}</p>
                    </td>
                    <td className="px-4 py-3 text-white">{cleanAnswer(correctAnswer)}</td>
                    <td className={cn("px-4 py-3", isCorrect ? "text-teal-400" : "text-red-400")}>
                      {cleanAnswer(userAnswer)}
                      {q.type === "MCQ" && q.options && userAnswers[q.id] && (
                        <span className="ml-2 text-xs text-ink-faint">
                          ({JSON.parse(q.options).findIndex((o: string) => o === userAnswers[q.id]) + 1})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-teal-400/10 px-2 py-0.5 text-[10px] font-medium text-teal-400">
                          <Check size={10} /> Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-400/10 px-2 py-0.5 text-[10px] font-medium text-red-400">
                          <X size={10} /> Wrong
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {mySubmission.feedback && (
        <div className="rounded-xl border border-slate-800 bg-surface-raised p-4">
          <p className="text-xs font-medium text-ink-faint mb-1">Admin Feedback</p>
          <p className="text-sm text-white">{mySubmission.feedback}</p>
        </div>
      )}
    </div>
  );
}

function QuestionCard({
  question,
  index,
  value,
  onChange,
  showAnswer,
  disabled,
  userAnswer,
}: {
  question: QuizQuestion;
  index: number;
  value: string;
  onChange: (val: string) => void;
  showAnswer?: boolean;
  disabled?: boolean;
  userAnswer?: string;
}) {
  const displayVal = userAnswer ?? value;
  const textOnly = question.text.replace(/!\[image\]\([^)]+\)/g, "").trim();

  return (
    <div className="rounded-xl border border-slate-800 bg-surface-raised p-4 space-y-3">
      <div className="flex items-start gap-3">
        <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-[11px] font-bold text-accent-bright">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white whitespace-pre-wrap font-mono">{textOnly}</p>
          <span className="mt-1 inline-block rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium uppercase text-ink-faint">
            {question.type === "MCQ" ? "Multiple Choice" : "Numerical"}
          </span>
        </div>
      </div>

      {question.type === "MCQ" && question.options ? (
        <div className="ml-9 space-y-2">
          {JSON.parse(question.options).map((opt: string, oi: number) => {
            const optText = opt.replace(/!\[image\]\([^)]+\)/g, "").trim();
            return (
              <label
                key={oi}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-2.5 text-sm transition-colors cursor-pointer",
                  displayVal === opt
                    ? "border-accent/50 bg-accent/10 text-white"
                    : "border-slate-800 bg-white/[0.02] text-ink-faint hover:border-slate-700",
                  disabled && "cursor-default opacity-70"
                )}
              >
                <input
                  type="radio"
                  name={`q-${question.id}`}
                  checked={displayVal === opt}
                  onChange={() => onChange(opt)}
                  disabled={disabled}
                  className="accent-[var(--accent)]"
                />
                <span className="flex-1">{optText}</span>
              </label>
            );
          })}
        </div>
      ) : (
        <div className="ml-9">
          <input
            type="text"
            value={displayVal}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="input-dark w-full max-w-xs text-sm"
            placeholder="Enter number"
          />
        </div>
      )}

      {showAnswer && (
        <div className="ml-9 text-xs text-teal-400">
          Correct: {question.type === "MCQ" && question.options
            ? JSON.parse(question.options)[parseInt(question.answer || "0")]?.replace(/!\[image\]\([^)]+\)/g, "").trim() ?? question.answer
            : question.answer}
        </div>
      )}
    </div>
  );
}
