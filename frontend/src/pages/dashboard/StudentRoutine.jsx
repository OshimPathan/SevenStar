import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getClassRoutine, getActiveAcademicYear } from '../../api';

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const StudentRoutine = () => {
    const { user } = useAuth();
    const [routine, setRoutine] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.class_id) { setLoading(false); return; }
        getClassRoutine(user.class_id, user.section_id || user.section)
            .then(data => setRoutine(Array.isArray(data) ? data : []))
            .catch(() => setRoutine([]))
            .finally(() => setLoading(false));
    }, [user?.class_id, user?.section_id, user?.section]);

    const grouped = useMemo(() => {
        const g = {};
        routine.forEach(r => {
            const d = r.day;
            if (!g[d]) g[d] = [];
            g[d].push(r);
        });
        Object.values(g).forEach(list => list.sort((a, b) => a.period - b.period));
        return g;
    }, [routine]);

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Class Routine</h1>
                    <p className="text-sm text-gray-500 mt-1">Weekly schedule</p>
                </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {days.slice(0,6).map((dayName, idx) => {
                    const d = idx;
                    const list = grouped[d] || [];
                    return (
                        <div key={d} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary" />
                                <h3 className="font-bold text-gray-900">{dayName}</h3>
                            </div>
                            <div className="p-4 space-y-2">
                                {list.length === 0 ? (
                                    <div className="text-sm text-gray-400">No classes</div>
                                ) : list.map(item => (
                                    <div key={item.id} className="flex flex-col gap-1 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100 hover:border-primary/20 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm">{item.subject_name}</p>
                                                <p className="text-xs text-primary font-medium mt-0.5">{item.teacher_name}</p>
                                            </div>
                                            {item.room && <span className="text-[10px] bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-500 flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> {item.room}</span>}
                                        </div>
                                        <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-1 border-t border-gray-100 pt-1.5">
                                            <Clock className="w-3 h-3" /> {item.start_time || '—'} {item.end_time ? `— ${item.end_time}` : ''}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StudentRoutine;

