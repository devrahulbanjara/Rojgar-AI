import { useApplicationQueries } from './queries/useApplicationQueries';
import type { ApplicationTrackingBoard } from '../types/application';

export const useApplicationTrackingBoard = () => {
  const { useApplicationTrackingBoard } = useApplicationQueries();
  const { data, isLoading, error, refetch } = useApplicationTrackingBoard();

  // Default empty state for the board
  const emptyBoard: ApplicationTrackingBoard = {
    applied: [],
    interviewing: [],
    outcome: []
  };

  return {
    applicationTrackingData: data || emptyBoard,
    isLoading,
    error,
    refetch
  };
};