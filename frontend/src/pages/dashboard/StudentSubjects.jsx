import React, { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getStudentSubjects } from '../../api';

const StudentSubjects = () => {
    const { user } = useAuth();
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.student_id) return;
        getStudentSubjects(user.student_id)
            .then(data => setSubjects(Array.isArray(data) ? data : data?.subjects || []))
            .catch(() => setSubjects([]))
            .finally(() => setLoading(false));
    }, [user?.student_id]);

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">My Subjects</h1>
                <p className="text-sm text-gray-500 mt-1">Subjects for your current class</p>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {subjects.map(s => (
                    <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">{s.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">Teacher: {s.teacher_name}</p>
                        </div>
                    </div>
                ))}
                {subjects.length === 0 && <div className="text-sm text-gray-500">No subjects found</div>}
            </div>
        </div>
    );
};

export default StudentSubjects;

