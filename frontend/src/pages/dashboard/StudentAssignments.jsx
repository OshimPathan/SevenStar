import React, { useEffect, useMemo, useState } from 'react';
import { Upload, FileText, Calendar, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAssignmentsForStudent, submitAssignment } from '../../api';

const StudentAssignments = () => {
    const { user } = useAuth();
    const [data, setData] = useState({ assignments: [], submissions: [] });
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(null);

    useEffect(() => {
        if (!user?.student_id) return;
        getAssignmentsForStudent(user.student_id).then(setData).finally(() => setLoading(false));
    }, [user?.student_id]);

    const subMap = useMemo(() => Object.fromEntries((data.submissions || []).map(s => [s.assignment_id, s])), [data.submissions]);

    const onUpload = async (assignmentId, e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(assignmentId);
        try {
            await submitAssignment(assignmentId, user.student_id, file);
            const fresh = await getAssignmentsForStudent(user.student_id);
            setData(fresh);
        } finally {
            setUploading(null);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
                <p className="text-sm text-gray-500 mt-1">View assignments and upload your submissions</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
                {(data.assignments || []).map(a => {
                    const sub = subMap[a.id];
                    return (
                        <div key={a.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary" />
                                        <h3 className="font-bold text-gray-900">{a.title}</h3>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">{a.description || ''}</p>
                                    {a.due_date && (
                                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> Due: {a.due_date}
                                        </p>
                                    )}
                                </div>
                                <div className="shrink-0">
                                    {sub ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-green-100 text-green-700">
                                            <CheckCircle className="w-3 h-3" /> Submitted
                                        </span>
                                    ) : (
                                        <>
                                            <label className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-xs font-semibold cursor-pointer">
                                                {uploading === a.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                                {uploading === a.id ? 'Uploading...' : 'Upload'}
                                                <input type="file" className="hidden" onChange={(e) => onUpload(a.id, e)} disabled={!!uploading} />
                                            </label>
                                        </>
                                    )}
                                </div>
                            </div>
                            {sub && (
                                <div className="mt-3 text-xs text-gray-500">
                                    <p>Submitted: {new Date(sub.submitted_at).toLocaleString()}</p>
                                    {sub.marks != null && <p>Marks: {sub.marks}/{sub.total_marks || 0}</p>}
                                    {sub.file_url && <a href={sub.file_url} target="_blank" rel="noreferrer" className="text-primary font-semibold">View file</a>}
                                </div>
                            )}
                        </div>
                    );
                })}
                {data.assignments.length === 0 && <div className="text-sm text-gray-500">No assignments</div>}
            </div>
        </div>
    );
};

export default StudentAssignments;

