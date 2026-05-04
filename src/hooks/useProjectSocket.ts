'use client';

import { useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useToast } from '@/context/ToastContext';

export const useProjectSocket = (projectId: string, onEvent?: (event: string, data: any) => void) => {
  const { socket, joinProject, leaveProject } = useSocket();
  const toast = useToast();

  useEffect(() => {
    if (socket && projectId) {
      joinProject(projectId);

      const events = [
        'plans:updated',
        'issue:created',
        'issue:updated',
        'snag:created',
        'snag:updated',
        'material:updated',
        'boq:updated',
        'budget:updated',
        'milestones:updated'
      ];

      const handleEvent = (event: string, data: any) => {
        console.log(`Socket event received: ${event}`, data);
        if (onEvent) onEvent(event, data);
        
        // Show context-aware toasts
        if (event.includes('created')) {
          toast.success(`New ${event.split(':')[0]} reported in this project`);
        } else if (event.includes('updated')) {
          toast.info(`Project ${event.split(':')[0]} has been updated`);
        }
      };

      events.forEach(event => {
        socket.on(event, (data) => handleEvent(event, data));
      });

      return () => {
        events.forEach(event => {
          socket.off(event);
        });
        leaveProject(projectId);
      };
    }
  }, [socket, projectId, joinProject, leaveProject, toast]);
};
