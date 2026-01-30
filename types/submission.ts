// Types for form submissions

import { FormSection } from "./form-builder";

export interface FormSubmission {
    id: string;
    form_id: string;
    data: Record<string, string>;
    is_complete: boolean;
    session_id: string;
    last_section_index: number;
    total_sections: number;
    form_version?: number;
    form_content_snapshot?: FormSection[];
    created_at: string;
    updated_at: string;
}

export interface SubmissionStats {
    totalSubmissions: number;
    completeSubmissions: number;
    partialSubmissions: number;
    completionRate: number;
    averageCompletionPercentage: number;
}

export interface SubmissionWithProgress extends FormSubmission {
    progress: number; // 0-100 percentage
    answeredFields: number;
    totalFields: number;
}

// Calculate progress for a submission
export function calculateSubmissionProgress(
    submission: FormSubmission,
    totalFields: number
): SubmissionWithProgress {
    const answeredFields = Object.keys(submission.data || {}).filter(
        key => submission.data[key] !== undefined && submission.data[key] !== ""
    ).length;
    
    const progress = totalFields > 0 
        ? Math.round((answeredFields / totalFields) * 100)
        : 0;
    
    return {
        ...submission,
        progress,
        answeredFields,
        totalFields,
    };
}

// Calculate stats from a list of submissions
export function calculateSubmissionStats(
    submissions: FormSubmission[],
    totalFields: number
): SubmissionStats {
    const completeSubmissions = submissions.filter(s => s.is_complete).length;
    const partialSubmissions = submissions.filter(s => !s.is_complete).length;
    const totalSubmissions = submissions.length;
    
    const completionRate = totalSubmissions > 0
        ? Math.round((completeSubmissions / totalSubmissions) * 100)
        : 0;
    
    // Calculate average completion for partial responses
    const partialResponses = submissions.filter(s => !s.is_complete);
    let averageCompletionPercentage = 0;
    
    if (partialResponses.length > 0 && totalFields > 0) {
        const totalProgress = partialResponses.reduce((acc, sub) => {
            const answeredFields = Object.keys(sub.data || {}).filter(
                key => sub.data[key] !== undefined && sub.data[key] !== ""
            ).length;
            return acc + (answeredFields / totalFields) * 100;
        }, 0);
        averageCompletionPercentage = Math.round(totalProgress / partialResponses.length);
    }
    
    return {
        totalSubmissions,
        completeSubmissions,
        partialSubmissions,
        completionRate,
        averageCompletionPercentage,
    };
}
