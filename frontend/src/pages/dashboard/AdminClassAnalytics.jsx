import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Trophy, TrendingUp, Users, AlertCircle, Loader2 } from 'lucide-react';
import { getAllClasses, getExams, getClassAnalytics } from '../../api';

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

const AdminClassAnalytics = () => {
    const [classes, setClasses] = useState([]);
    const [exams, setExams] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedExam, setSelectedExam] = useState('');
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        Promise.all([getAllClasses(), getExams()]).then(([clsRes, exRes]) => {
            const cls = clsRes?.classes || [];
            const ex = exRes?.exams || [];
            setClasses(cls);
            setExams(ex);
            if (cls.length > 0) setSelectedClass(cls[0].id);
            if (ex.length > 0) setSelectedExam(ex[0].id);
        }).catch(e => console.error('Failed to load analytics data:', e));
    }, []);

    useEffect(() => {
        if (selectedClass && selectedExam) {
            fetchAnalytics();
        }
    }, [selectedClass, selectedExam]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const data = await getClassAnalytics(selectedClass, selectedExam);
            setAnalytics(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!selectedClass || !selectedExam) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>;

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Class Analytics</h1>
                    <p className="text-sm text-gray-500 mt-1">Performance overview and insights</p>
                </div>
                <div className="flex gap-3">
                    <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white">
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white">
                        {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="h-64 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : analytics ? (
                <>
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4">Subject Performance</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analytics.subjects}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} angle={-45} textAnchor="end" height={60} />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="average" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Avg Marks" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4">Pass / Fail Ratio</h3>
                             {/* Simple aggregation of all subject pass/fail counts for now, or just show text if pie is complex */}
                             {analytics.subjects.reduce((acc, s) => acc + s.pass + s.fail, 0) > 0 ? (
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Pass', value: analytics.subjects.reduce((acc, s) => acc + s.pass, 0) },
                                                    { name: 'Fail', value: analytics.subjects.reduce((acc, s) => acc + s.fail, 0) }
                                                ]}
                                                cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                                            >
                                                <Cell fill="#10b981" />
                                                <Cell fill="#ef4444" />
                                            </Pie>
                                            <Tooltip />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                             ) : (
                                 <div className="h-64 flex items-center justify-center text-gray-400">No data available</div>
                             )}
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> Top Performers</h3>
                            <div className="space-y-4">
                                {analytics.students.length > 0 ? analytics.students.map((s, i) => (
                                    <div key={s.id} className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-700' : 'bg-orange-50 text-orange-700'}`}>
                                            {i + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                                            <p className="text-xs text-gray-500">{s.total} Total Marks</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-emerald-600">{s.avg}%</span>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-sm text-gray-400 italic">No students ranked yet.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Detailed Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-900">Subject Details</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                                    <tr>
                                        <th className="px-6 py-3">Subject</th>
                                        <th className="px-6 py-3 text-center">Average</th>
                                        <th className="px-6 py-3 text-center">Highest</th>
                                        <th className="px-6 py-3 text-center">Pass</th>
                                        <th className="px-6 py-3 text-center">Fail</th>
                                        <th className="px-6 py-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {analytics.subjects.map(sub => (
                                        <tr key={sub.id} className="hover:bg-gray-50/50">
                                            <td className="px-6 py-3 font-medium text-gray-900">{sub.name}</td>
                                            <td className="px-6 py-3 text-center">{sub.average}</td>
                                            <td className="px-6 py-3 text-center font-bold text-emerald-600">{sub.highest}</td>
                                            <td className="px-6 py-3 text-center text-emerald-600">{sub.pass}</td>
                                            <td className="px-6 py-3 text-center text-red-600">{sub.fail}</td>
                                            <td className="px-6 py-3 text-center">
                                                {parseFloat(sub.average) >= 40 ? (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">Good</span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700">Needs Attention</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {analytics.subjects.length === 0 && (
                                        <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-400">No data found for this selection</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : null}
        </div>
    );
};

export default AdminClassAnalytics;
