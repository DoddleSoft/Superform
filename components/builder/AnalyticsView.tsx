"use client";

import { useMemo } from "react";
import { motion } from "@/lib/animations";
import {
    LuUsers,
    LuCircleCheck,
    LuClock,
    LuChartBar,
    LuChartPie,
    LuActivity,
    LuTarget,
    LuPercent,
    LuArrowUp,
    LuArrowDown,
    LuMinus,
    LuCalendar,
} from "react-icons/lu";
import { FormSubmission, calculateSubmissionStats } from "@/types/submission";
import { useFormBuilder } from "@/context/FormBuilderContext";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend,
} from "recharts";

interface AnalyticsViewProps {
    submissions: FormSubmission[];
}

// Color palette for charts
const COLORS = {
    primary: "#6366f1",
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#3b82f6",
    muted: "#94a3b8",
};

const PIE_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"];

export function AnalyticsView({ submissions }: AnalyticsViewProps) {
    const { sections } = useFormBuilder();

    // Calculate total fields for completion stats
    const totalFields = useMemo(() => {
        return sections.reduce((acc, section) => {
            return acc + section.rows.reduce((rowAcc, row) => rowAcc + row.elements.length, 0);
        }, 0);
    }, [sections]);

    // Calculate stats
    const stats = useMemo(() => calculateSubmissionStats(submissions, totalFields), [submissions, totalFields]);

    // Generate time-series data for submissions over time
    const submissionsByDay = useMemo(() => {
        const dayMap = new Map<string, { complete: number; partial: number }>();
        
        // Get last 30 days
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const key = date.toISOString().split("T")[0];
            dayMap.set(key, { complete: 0, partial: 0 });
        }

        // Count submissions
        submissions.forEach((sub) => {
            const date = new Date(sub.created_at).toISOString().split("T")[0];
            if (dayMap.has(date)) {
                const current = dayMap.get(date)!;
                if (sub.is_complete) {
                    current.complete++;
                } else {
                    current.partial++;
                }
            }
        });

        return Array.from(dayMap.entries()).map(([date, counts]) => ({
            date,
            displayDate: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            complete: counts.complete,
            partial: counts.partial,
            total: counts.complete + counts.partial,
        }));
    }, [submissions]);

    // Completion rate pie data
    const completionPieData = useMemo(() => [
        { name: "Complete", value: stats.completeSubmissions, color: COLORS.success },
        { name: "Partial", value: stats.partialSubmissions, color: COLORS.warning },
    ], [stats]);

    // Submissions by hour of day
    const submissionsByHour = useMemo(() => {
        const hours = Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            label: i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`,
            count: 0,
        }));

        submissions.forEach((sub) => {
            const hour = new Date(sub.created_at).getHours();
            hours[hour].count++;
        });

        return hours;
    }, [submissions]);

    // Field completion rates
    const fieldCompletionRates = useMemo(() => {
        if (submissions.length === 0) return [];

        const fieldCounts = new Map<string, { filled: number; label: string }>();

        // Get field labels from sections
        sections.forEach((section) => {
            section.rows.forEach((row) => {
                row.elements.forEach((element) => {
                    const label = element.extraAttributes?.label || element.type;
                    fieldCounts.set(element.id, { filled: 0, label });
                });
            });
        });

        // Count how many submissions have each field filled
        submissions.forEach((sub) => {
            Object.keys(sub.data || {}).forEach((fieldId) => {
                if (sub.data[fieldId] && sub.data[fieldId] !== "" && fieldCounts.has(fieldId)) {
                    const current = fieldCounts.get(fieldId)!;
                    current.filled++;
                }
            });
        });

        return Array.from(fieldCounts.entries())
            .map(([id, data]) => ({
                id,
                label: data.label.length > 20 ? data.label.substring(0, 20) + "..." : data.label,
                fullLabel: data.label,
                rate: Math.round((data.filled / submissions.length) * 100),
                filled: data.filled,
            }))
            .sort((a, b) => b.rate - a.rate)
            .slice(0, 10);
    }, [submissions, sections]);

    // Calculate week-over-week change
    const weeklyChange = useMemo(() => {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        const thisWeek = submissions.filter(
            (s) => new Date(s.created_at) >= oneWeekAgo
        ).length;
        const lastWeek = submissions.filter(
            (s) => new Date(s.created_at) >= twoWeeksAgo && new Date(s.created_at) < oneWeekAgo
        ).length;

        if (lastWeek === 0) return thisWeek > 0 ? 100 : 0;
        return Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
    }, [submissions]);

    // Average completion time (mock - would need timestamps per field in real implementation)
    const avgCompletionTime = useMemo(() => {
        const completeSubmissions = submissions.filter((s) => s.is_complete);
        if (completeSubmissions.length === 0) return "N/A";
        // Estimate based on field count - roughly 30 seconds per field
        const estimatedSeconds = totalFields * 30;
        if (estimatedSeconds < 60) return `${estimatedSeconds}s`;
        if (estimatedSeconds < 3600) return `${Math.round(estimatedSeconds / 60)}m`;
        return `${Math.round(estimatedSeconds / 3600)}h`;
    }, [submissions, totalFields]);

    return (
        <div className="h-full overflow-y-auto bg-base-100">
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <h2 className="text-2xl font-bold text-base-content">Analytics</h2>
                    <p className="text-base-content/60 mt-1">
                        Track your form performance and submission insights
                    </p>
                </motion.div>

                {/* Key Metrics Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.05 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                    <MetricCard
                        title="Total Submissions"
                        value={stats.totalSubmissions}
                        icon={LuUsers}
                        color="primary"
                        trend={weeklyChange}
                        trendLabel="vs last week"
                    />
                    <MetricCard
                        title="Completion Rate"
                        value={`${stats.completionRate}%`}
                        icon={LuTarget}
                        color="success"
                        subtitle={`${stats.completeSubmissions} complete`}
                    />
                    <MetricCard
                        title="Partial Submissions"
                        value={stats.partialSubmissions}
                        icon={LuClock}
                        color="warning"
                        subtitle={`${stats.averageCompletionPercentage}% avg progress`}
                    />
                    <MetricCard
                        title="Est. Completion Time"
                        value={avgCompletionTime}
                        icon={LuActivity}
                        color="info"
                        subtitle={`${totalFields} fields`}
                    />
                </motion.div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Submissions Over Time - Large Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: 0.1 }}
                        className="lg:col-span-2 bg-base-100 border border-base-200 rounded-2xl p-6"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-base-content">Submissions Over Time</h3>
                                <p className="text-sm text-base-content/60">Last 30 days</p>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.success }} />
                                    <span className="text-base-content/70">Complete</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.warning }} />
                                    <span className="text-base-content/70">Partial</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-64">
                            {submissions.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={submissionsByDay} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorComplete" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3} />
                                                <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorPartial" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={COLORS.warning} stopOpacity={0.3} />
                                                <stop offset="95%" stopColor={COLORS.warning} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                                        <XAxis
                                            dataKey="displayDate"
                                            tick={{ fontSize: 12, fill: "#9ca3af" }}
                                            tickLine={false}
                                            axisLine={false}
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis
                                            tick={{ fontSize: 12, fill: "#9ca3af" }}
                                            tickLine={false}
                                            axisLine={false}
                                            allowDecimals={false}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "var(--fallback-b1,oklch(var(--b1)/1))",
                                                border: "1px solid var(--fallback-b2,oklch(var(--b2)/1))",
                                                borderRadius: "0.75rem",
                                                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="complete"
                                            stroke={COLORS.success}
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorComplete)"
                                            name="Complete"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="partial"
                                            stroke={COLORS.warning}
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorPartial)"
                                            name="Partial"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyChartState message="No submissions yet" />
                            )}
                        </div>
                    </motion.div>

                    {/* Completion Rate Pie Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: 0.15 }}
                        className="bg-base-100 border border-base-200 rounded-2xl p-6"
                    >
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-base-content">Completion Status</h3>
                            <p className="text-sm text-base-content/60">Submission breakdown</p>
                        </div>
                        <div className="h-64 flex items-center justify-center">
                            {stats.totalSubmissions > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={completionPieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {completionPieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "var(--fallback-b1,oklch(var(--b1)/1))",
                                                border: "1px solid var(--fallback-b2,oklch(var(--b2)/1))",
                                                borderRadius: "0.75rem",
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyChartState message="No data available" />
                            )}
                        </div>
                        {stats.totalSubmissions > 0 && (
                            <div className="flex justify-center gap-6 mt-4">
                                {completionPieData.map((item) => (
                                    <div key={item.name} className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span className="text-sm text-base-content/70">
                                            {item.name} ({item.value})
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Submissions by Hour */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: 0.2 }}
                        className="bg-base-100 border border-base-200 rounded-2xl p-6"
                    >
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-base-content">Peak Submission Hours</h3>
                            <p className="text-sm text-base-content/60">When users submit most frequently</p>
                        </div>
                        <div className="h-64">
                            {submissions.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={submissionsByHour} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} vertical={false} />
                                        <XAxis
                                            dataKey="label"
                                            tick={{ fontSize: 10, fill: "#9ca3af" }}
                                            tickLine={false}
                                            axisLine={false}
                                            interval={2}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 12, fill: "#9ca3af" }}
                                            tickLine={false}
                                            axisLine={false}
                                            allowDecimals={false}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "var(--fallback-b1,oklch(var(--b1)/1))",
                                                border: "1px solid var(--fallback-b2,oklch(var(--b2)/1))",
                                                borderRadius: "0.75rem",
                                            }}
                                            formatter={(value) => [value, "Submissions"]}
                                        />
                                        <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyChartState message="No submissions yet" />
                            )}
                        </div>
                    </motion.div>

                    {/* Field Completion Rates */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: 0.25 }}
                        className="bg-base-100 border border-base-200 rounded-2xl p-6"
                    >
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-base-content">Field Completion Rates</h3>
                            <p className="text-sm text-base-content/60">Top 10 fields by completion</p>
                        </div>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {fieldCompletionRates.length > 0 ? (
                                fieldCompletionRates.map((field, index) => (
                                    <div key={field.id} className="group">
                                        <div className="flex items-center justify-between mb-1">
                                            <span
                                                className="text-sm text-base-content/80 truncate max-w-[200px]"
                                                title={field.fullLabel}
                                            >
                                                {field.label}
                                            </span>
                                            <span className="text-sm font-medium text-base-content">
                                                {field.rate}%
                                            </span>
                                        </div>
                                        <div className="h-2 bg-base-200 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${field.rate}%` }}
                                                transition={{ duration: 0.5, delay: index * 0.05 }}
                                                className="h-full rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        field.rate >= 80
                                                            ? COLORS.success
                                                            : field.rate >= 50
                                                            ? COLORS.warning
                                                            : COLORS.error,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-base-content/50">
                                    <LuChartBar className="w-8 h-8 mb-2" />
                                    <p className="text-sm">No field data available</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Quick Stats Footer */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.3 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                    <QuickStat
                        label="This Week"
                        value={submissions.filter((s) => new Date(s.created_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                        icon={LuCalendar}
                    />
                    <QuickStat
                        label="Today"
                        value={submissions.filter((s) => new Date(s.created_at).toDateString() === new Date().toDateString()).length}
                        icon={LuActivity}
                    />
                    <QuickStat
                        label="Avg. Fields Filled"
                        value={
                            submissions.length > 0
                                ? Math.round(
                                      submissions.reduce(
                                          (acc, s) => acc + Object.keys(s.data || {}).filter((k) => s.data[k]).length,
                                          0
                                      ) / submissions.length
                                  )
                                : 0
                        }
                        icon={LuCircleCheck}
                    />
                    <QuickStat
                        label="Drop-off Rate"
                        value={stats.totalSubmissions > 0 ? `${100 - stats.completionRate}%` : "0%"}
                        icon={LuPercent}
                    />
                </motion.div>
            </div>
        </div>
    );
}

// ============== Metric Card Component ==============
function MetricCard({
    title,
    value,
    icon: Icon,
    color,
    trend,
    trendLabel,
    subtitle,
}: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: "primary" | "success" | "warning" | "error" | "info";
    trend?: number;
    trendLabel?: string;
    subtitle?: string;
}) {
    const colorClasses = {
        primary: "bg-primary/10 text-primary",
        success: "bg-success/10 text-success",
        warning: "bg-warning/10 text-warning",
        error: "bg-error/10 text-error",
        info: "bg-info/10 text-info",
    };

    return (
        <div className="bg-base-100 border border-base-200 rounded-2xl p-5 hover:shadow-lg hover:border-base-300 transition-all">
            <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-xl ${colorClasses[color]}`}>
                    <Icon className="w-5 h-5" />
                </div>
                {trend !== undefined && (
                    <div
                        className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                            trend > 0
                                ? "bg-success/10 text-success"
                                : trend < 0
                                ? "bg-error/10 text-error"
                                : "bg-base-200 text-base-content/50"
                        }`}
                    >
                        {trend > 0 ? (
                            <LuArrowUp className="w-3 h-3" />
                        ) : trend < 0 ? (
                            <LuArrowDown className="w-3 h-3" />
                        ) : (
                            <LuMinus className="w-3 h-3" />
                        )}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <div className="mt-4">
                <p className="text-2xl font-bold text-base-content">{value}</p>
                <p className="text-sm text-base-content/60 mt-0.5">{title}</p>
                {subtitle && <p className="text-xs text-base-content/40 mt-1">{subtitle}</p>}
                {trendLabel && trend !== undefined && (
                    <p className="text-xs text-base-content/40 mt-1">{trendLabel}</p>
                )}
            </div>
        </div>
    );
}

// ============== Quick Stat Component ==============
function QuickStat({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: string | number;
    icon: React.ElementType;
}) {
    return (
        <div className="bg-base-200/50 rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 bg-base-100 rounded-lg">
                <Icon className="w-4 h-4 text-base-content/60" />
            </div>
            <div>
                <p className="text-lg font-semibold text-base-content">{value}</p>
                <p className="text-xs text-base-content/60">{label}</p>
            </div>
        </div>
    );
}

// ============== Empty Chart State ==============
function EmptyChartState({ message }: { message: string }) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-base-content/40">
            <LuChartBar className="w-12 h-12 mb-3" />
            <p className="text-sm">{message}</p>
            <p className="text-xs mt-1">Submit some responses to see analytics</p>
        </div>
    );
}
