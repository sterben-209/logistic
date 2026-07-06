import { useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabaseService';
import useTaskStore from '../store/useTaskStore';

export default function useRealtimeSync(userId) {
  const channelRef = useRef(null);
  
  useEffect(() => {
    if (!userId) return;

    // Khởi tạo channel riêng cho user (hoặc nhóm user trong cùng 1 cảng)
    const channelName = `port-room-${userId}`;
    const channel = supabase.channel(channelName);

    channel
      .on('broadcast', { event: 'SYNC_TASK_ADDED' }, (payload) => {
        const { task } = payload.payload;
        // Bỏ qua nếu task đã có
        const currentTasks = useTaskStore.getState().tasks;
        if (!currentTasks.find(t => t.id === task.id)) {
          useTaskStore.getState().addTask(task);
        }
      })
      .on('broadcast', { event: 'SYNC_INVENTORY' }, (payload) => {
        const { inventory } = payload.payload;
        useTaskStore.getState().setInventory(inventory);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('🔗 Đã kết nối Supabase Realtime Broadcast:', channelName);
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const broadcastTaskAdded = useCallback((task) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'SYNC_TASK_ADDED',
        payload: { task }
      });
    }
  }, []);

  const broadcastInventorySync = useCallback((inventory) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'SYNC_INVENTORY',
        payload: { inventory }
      });
    }
  }, []);

  return useMemo(() => ({
    broadcastTaskAdded,
    broadcastInventorySync
  }), [broadcastTaskAdded, broadcastInventorySync]);
}
