import { useQuery } from '@tanstack/react-query';
import { resumeService } from '../../services/resumeService';

export const resumeQueryKeys = {
    all: ['resumes'] as const,
    lists: () => [...resumeQueryKeys.all, 'list'] as const,
    detail: (id: string) => [...resumeQueryKeys.all, 'detail', id] as const,
};

export function useResumes() {
    return useQuery({
        queryKey: resumeQueryKeys.lists(),
        queryFn: async () => {
            return await resumeService.getAllResumes();
        },
        staleTime: 0,
        refetchOnMount: 'always',
    });
}
