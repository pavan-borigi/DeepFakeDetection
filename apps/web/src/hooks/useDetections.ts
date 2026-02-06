import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Detection {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  media_url: string;
  result: 'real' | 'fake';
  confidence: number;
  analysis_details: {
    faces_detected?: number;
    artifacts_found?: number;
    processing_time_ms?: number;
  } | null;
  created_at: string;
}

export interface CreateDetectionInput {
  file_name: string;
  file_type: string;
  file_size: number;
  media_url: string;
  result: 'real' | 'fake';
  confidence: number;
  analysis_details?: Record<string, any>;
}

export function useDetections() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['detections', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('detections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Detection[];
    },
    enabled: !!user,
  });
}

export function useCreateDetection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateDetectionInput) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('detections')
        .insert({
          ...input,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Detection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['detections'] });
    },
  });
}

export function useDeleteDetection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('detections')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['detections'] });
    },
  });
}
