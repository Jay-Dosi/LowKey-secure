import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/api';
import {
    ArrowLeft,
    Shield,
    ShieldAlert,
    AlertTriangle,
    Activity,
    TrendingUp,
    TrendingDown,
    Minus,
    BarChart3,
    Brain,
    Flag,
    Lightbulb,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Eye,
    Users,
    Repeat,
    Gauge,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/* ── helpers ─────────────────────────────────────────────────────────── */

/** Return "YYYY-MM" string for the given Date. */
const fmtMonth = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

/** Pretty label: "February 2026" */
const prettyMonth = (ym) => {
    const [y, m] = ym.split('-');
    return new Date(y, m - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

/** Shift month ±n from a "YYYY-MM" string. */
const shiftMonth = (ym, delta) => {
    const [y, m] = ym.split('-').map(Number);
    const d = new Date(y, m - 1 + delta);
    return fmtMonth(d);
};

/* ── ring-chart component (pure SVG) ─────────────────────────────────── */

const RiskDonut = ({ high, medium, low }) => {
    const total = high + medium + low;
    if (total === 0) {
        return (
            <div className="flex items-center justify-center w-36 h-36 mx-auto">
                <svg viewBox="0 0 36 36" className="w-full h-full">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor"
                        className="text-slate-800" strokeWidth="3" />
                    <text x="18" y="19.5" textAnchor="middle" className="fill-slate-500 text-[4px] font-medium">
                        No data
                    </text>
                </svg>
            </div>
        );
    }

    const radius = 14;
    const circumference = 2 * Math.PI * radius;
    const segments = [
        { value: high, color: '#ef4444' },
        { value: medium, color: '#f59e0b' },
        { value: low, color: '#22c55e' },
    ];

    let offset = 0;

    return (
        <div className="relative flex items-center justify-center w-36 h-36 mx-auto">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                {segments.map((seg, i) => {
                    const dash = (seg.value / total) * circumference;
                    const el = (
                        <circle key={i} cx="18" cy="18" r={radius} fill="none"
                            stroke={seg.color} strokeWidth="3"
                            strokeDasharray={`${dash} ${circumference - dash}`}
                            strokeDashoffset={-offset}
                            strokeLinecap="round"
                            className="transition-all duration-700"
                        />
                    );
                    offset += dash;
                    return el;
                })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">{total}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">events</span>
            </div>
        </div>
    );
};

/* ── stat card ───────────────────────────────────────────────────────── */

const StatCard = ({ icon: Icon, label, value, sub, accent = 'text-slate-400', bgAccent = 'bg-slate-500/10' }) => (
    <Card className="overflow-hidden">
        <CardContent className="p-4 flex items-start gap-3">
            <figure className={`p-2 rounded-lg ${bgAccent} shrink-0`} aria-hidden="true">
                <Icon className={`size-5 ${accent}`} />
            </figure>
            <div className="min-w-0">
                <p className="text-xs text-slate-400 truncate">{label}</p>
                <p className="text-lg font-bold text-white leading-tight">{value}</p>
                {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
            </div>
        </CardContent>
    </Card>
);

/* ── main page ───────────────────────────────────────────────────────── */

const PrivacyReport = () => {
    const navigate = useNavigate();
    const [month, setMonth] = useState(fmtMonth(new Date()));
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const isCurrentMonth = month === fmtMonth(new Date());
    const isFutureMonth = month > fmtMonth(new Date());

    const fetchReport = useCallback(async (targetMonth) => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/student/privacy-report?month=${targetMonth}`);
            setReport(res.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to fetch privacy report');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReport(month);
    }, [month, fetchReport]);

    const handlePrev = () => setMonth((m) => shiftMonth(m, -1));
    const handleNext = () => { if (!isCurrentMonth) setMonth((m) => shiftMonth(m, 1)); };

    /* ── derived data ─────────────────────── */
    const m = report?.metrics;
    const ra = report?.rule_analysis;
    const ai = report?.ai_summary;

    const bandColor = {
        Low: { badge: 'success', text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: Shield },
        Moderate: { badge: 'warning', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: ShieldAlert },
        High: { badge: 'danger', text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: AlertTriangle },
    };
    const band = ra ? bandColor[ra.risk_band] || bandColor.Low : bandColor.Low;
    const BandIcon = band.icon;

    const velocityIcon = m?.risk_velocity > 0
        ? <TrendingUp className="size-4 text-red-400" />
        : m?.risk_velocity < 0
            ? <TrendingDown className="size-4 text-green-400" />
            : <Minus className="size-4 text-slate-400" />;
    const velocityLabel = m?.risk_velocity > 0
        ? `+${m.risk_velocity} from last month`
        : m?.risk_velocity < 0
            ? `${m.risk_velocity} from last month`
            : 'No change';

    /* ── render ───────────────────────────── */
    return (
        <article className="space-y-6 pb-20 max-w-4xl mx-auto">
            {/* ── Back + Title ─────────────────── */}
            <header className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/student')}
                    className="shrink-0" aria-label="Back to dashboard">
                    <ArrowLeft className="size-5" />
                </Button>
                <div className="flex items-center gap-3">
                    <figure className="p-3 bg-purple-500/10 rounded-xl" aria-hidden="true">
                        <Activity className="size-7 text-purple-400" />
                    </figure>
                    <hgroup>
                        <h1 className="text-2xl font-bold text-white">Privacy Risk Advisor</h1>
                        <p className="text-sm text-muted-foreground">Monthly privacy exposure analysis</p>
                    </hgroup>
                </div>
            </header>

            {/* ── Month Navigation ─────────────── */}
            <div className="flex items-center justify-center gap-3">
                <Button variant="outline" size="icon" onClick={handlePrev} className="h-9 w-9">
                    <ChevronLeft className="size-4" />
                </Button>
                <div className="flex items-center gap-2 min-w-[200px] justify-center">
                    <CalendarDays className="size-4 text-slate-400" />
                    <span className="text-base font-semibold text-white">{prettyMonth(month)}</span>
                    {isCurrentMonth && <Badge variant="info" className="text-[10px] px-1.5">Current</Badge>}
                </div>
                <Button variant="outline" size="icon" onClick={handleNext}
                    disabled={isCurrentMonth}
                    className="h-9 w-9">
                    <ChevronRight className="size-4" />
                </Button>
            </div>

            {/* ── Loading / Error ─────────────── */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="size-8 animate-spin text-purple-400" />
                    <p className="text-sm text-slate-400">Analyzing your privacy footprint…</p>
                </div>
            )}

            {error && (
                <Card className="border-red-500/30 bg-red-500/5">
                    <CardContent className="py-8 text-center">
                        <AlertTriangle className="size-8 text-red-400 mx-auto mb-3" />
                        <p className="text-red-400 font-medium">{error}</p>
                    </CardContent>
                </Card>
            )}

            {/* ── Report Content ─────────────── */}
            {!loading && !error && report && (
                <>
                    {/* ── Risk Band Hero ──────────── */}
                    <Card className={`${band.border} ${band.bg} overflow-hidden`}>
                        <CardContent className="py-6 flex flex-col sm:flex-row items-center gap-6">
                            <figure className={`p-4 rounded-2xl ${band.bg}`} aria-hidden="true">
                                <BandIcon className={`size-12 ${band.text}`} />
                            </figure>
                            <div className="text-center sm:text-left flex-1">
                                <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                                    <h2 className={`text-xl font-bold ${band.text}`}>
                                        {ra.risk_band} Risk
                                    </h2>
                                    <Badge variant={band.badge}>{ra.risk_band.toUpperCase()}</Badge>
                                </div>
                                <p className="text-slate-400 text-sm max-w-md">
                                    {m.total_events === 0
                                        ? 'No events attended this month — your exposure is minimal.'
                                        : `You shared data with ${m.total_events} event${m.total_events !== 1 ? 's' : ''} this month across ${m.unique_org_count} organization${m.unique_org_count !== 1 ? 's' : ''}.`
                                    }
                                </p>
                            </div>
                            <div className="text-center shrink-0">
                                <p className="text-3xl font-black text-white">{m.cumulative_risk_score}</p>
                                <p className="text-[10px] uppercase tracking-wider text-slate-400">Risk Score</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Stats Grid ──────────────── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <StatCard icon={Eye} label="Total Events" value={m.total_events}
                            accent="text-blue-400" bgAccent="bg-blue-500/10" />
                        <StatCard icon={Users} label="Unique Orgs" value={m.unique_org_count}
                            accent="text-indigo-400" bgAccent="bg-indigo-500/10" />
                        <StatCard icon={Repeat} label="Repeated High-Risk" value={m.repeated_high_attr_count}
                            sub="attributes" accent="text-red-400" bgAccent="bg-red-500/10" />
                        <StatCard icon={Gauge} label="Entropy Score" value={m.exposure_entropy_score.toFixed(2)}
                            sub="diversity index" accent="text-amber-400" bgAccent="bg-amber-500/10" />
                    </div>

                    {/* ── Donut + Breakdown ────────── */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <BarChart3 className="size-4 text-purple-400" />
                                    Risk Breakdown
                                </CardTitle>
                                <CardDescription>Events by risk level this month</CardDescription>
                            </CardHeader>
                            <CardContent className="pb-6">
                                <RiskDonut high={m.high_risk_count} medium={m.medium_risk_count} low={m.low_risk_count} />
                                <div className="flex justify-center gap-5 mt-4">
                                    {[
                                        { label: 'High', count: m.high_risk_count, color: 'bg-red-500' },
                                        { label: 'Medium', count: m.medium_risk_count, color: 'bg-amber-500' },
                                        { label: 'Low', count: m.low_risk_count, color: 'bg-green-500' },
                                    ].map((s) => (
                                        <div key={s.label} className="flex items-center gap-1.5 text-xs text-slate-400">
                                            <span className={`size-2.5 rounded-full ${s.color}`} />
                                            {s.label} ({s.count})
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* ── Velocity + Trend ───────── */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <TrendingUp className="size-4 text-cyan-400" />
                                    Trend & Velocity
                                </CardTitle>
                                <CardDescription>Change from last month</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center py-6 gap-4">
                                <div className="flex items-center gap-3">
                                    {velocityIcon}
                                    <span className="text-2xl font-bold text-white">
                                        {m.risk_velocity > 0 ? '+' : ''}{m.risk_velocity}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-400">{velocityLabel}</p>

                                <div className={`w-full rounded-lg p-3 mt-2 text-center text-xs
                                    ${m.risk_velocity > 0
                                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                        : m.risk_velocity < 0
                                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                            : 'bg-slate-800/50 text-slate-400 border border-slate-700'
                                    }`}>
                                    {m.risk_velocity > 0
                                        ? '⚠️ Your risk exposure has increased compared to last month.'
                                        : m.risk_velocity < 0
                                            ? '✅ Your risk exposure decreased — great job!'
                                            : 'Your risk level stayed the same as last month.'}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Flags & Recommendations ──── */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <Card className="border-slate-800">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Flag className="size-4 text-red-400" />
                                    Privacy Flags
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {ra.flags.length === 0 ? (
                                    <p className="text-sm text-slate-500 italic">No flags this month.</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {ra.flags.map((flag, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm">
                                                <span className="mt-0.5 text-red-400/70">•</span>
                                                <span className="text-slate-300">{flag}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-slate-800">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Lightbulb className="size-4 text-amber-400" />
                                    Recommendations
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {ra.recommendations.length === 0 ? (
                                    <p className="text-sm text-slate-500 italic">No recommendations this month.</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {ra.recommendations.map((rec, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm">
                                                <span className="mt-0.5 text-amber-400/70">✦</span>
                                                <span className="text-slate-300">{rec}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── AI Summary ──────────────── */}
                    <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Sparkles className="size-4 text-purple-400" />
                                AI Privacy Advisor
                            </CardTitle>
                            <CardDescription>Personalised summary generated from your aggregated metrics via AI</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-4">
                                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{ai}</p>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </article>
    );
};

export default PrivacyReport;
