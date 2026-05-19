'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';
import { uploadToCloudinary } from '@/lib/upload';
import { Send, Image as ImageIcon, Video, X, Reply, Edit2, Trash2, Smile, PlayCircle, Loader2, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatTabProps {
  projectId: string;
}

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🚀'];

export function ChatTab({ projectId }: ChatTabProps) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const toast = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
  
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [editingMsg, setEditingMsg] = useState<any | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages();
  }, [projectId]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage: any) => {
      setMessages(prev => {
        if (prev.some(m => m._id === newMessage._id)) return prev;
        return [...prev, newMessage];
      });
      scrollToBottom();
    };

    const handleMessageUpdate = (updatedMsg: any) => {
      setMessages(prev => prev.map(m => (m._id === updatedMsg._id ? updatedMsg : m)));
    };

    const handleMessageDelete = ({ messageId }: { messageId: string }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    };

    socket.on('chat:message', handleNewMessage);
    socket.on('chat:message:update', handleMessageUpdate);
    socket.on('chat:message:delete', handleMessageDelete);

    return () => {
      socket.off('chat:message', handleNewMessage);
      socket.off('chat:message:update', handleMessageUpdate);
      socket.off('chat:message:delete', handleMessageDelete);
    };
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/messages`);
      setMessages(response.data);
    } catch (err) {
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    const type = file.type.startsWith('video/') ? 'video' : 'image';
    setSelectedFile(file);
    setFileType(type);

    const url = URL.createObjectURL(file);
    setFilePreview(url);
    e.target.value = '';
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setFileType(null);
  };

  const sendMessage = async () => {
    if ((!inputText.trim() && !selectedFile) || isSending) return;

    setIsSending(true);
    try {
      if (editingMsg) {
        await api.patch(`/projects/${projectId}/messages/${editingMsg._id}`, {
          content: inputText.trim()
        });
        setEditingMsg(null);
        setInputText('');
      } else {
        let attachments = [];
        if (selectedFile) {
          const url = await uploadToCloudinary(selectedFile);
          attachments.push({
            url,
            type: fileType,
            name: selectedFile.name
          });
        }

        await api.post(`/projects/${projectId}/messages`, {
          content: inputText.trim(),
          attachments,
          replyTo: replyingTo?._id
        });

        setInputText('');
        clearFile();
        setReplyingTo(null);
      }
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      await api.delete(`/projects/${projectId}/messages/${messageId}`);
      setActiveMenuId(null);
    } catch (err) {
      toast.error('Failed to delete message');
    }
  };

  const reactToMessage = async (messageId: string, emoji: string) => {
    try {
      await api.patch(`/projects/${projectId}/messages/${messageId}/react`, { emoji });
      setActiveMenuId(null);
    } catch (err) {
      toast.error('Failed to add reaction');
    }
  };

  const startEdit = (msg: any) => {
    setEditingMsg(msg);
    setReplyingTo(null);
    setInputText(msg.content || '');
    setActiveMenuId(null);
  };

  const startReply = (msg: any) => {
    setReplyingTo(msg);
    setEditingMsg(null);
    setActiveMenuId(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[700px] bg-gray-50/50 rounded-2xl border border-gray-200 overflow-hidden relative">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
              <Smile className="w-8 h-8 text-blue-300" />
            </div>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender === user?._id || msg.sender === user?.id;
            const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={msg._id} className={cn("flex w-full group", isMe ? "justify-end" : "justify-start")}>
                {!isMe && (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mr-3 mt-1 shadow-sm border border-blue-200/50">
                    <span className="text-xs font-bold text-blue-700">
                      {msg.senderName?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                )}

                <div className={cn("flex flex-col max-w-[75%]", isMe ? "items-end" : "items-start")}>
                  {!isMe && <span className="text-xs font-semibold text-slate-500 mb-1 ml-1">{msg.senderName}</span>}

                  <div className="relative group/bubble">
                    <div className={cn(
                      "px-4 py-2.5 rounded-2xl shadow-sm border relative z-10",
                      isMe 
                        ? "bg-blue-600 text-white border-blue-700 rounded-br-sm" 
                        : "bg-white text-gray-800 border-gray-200 rounded-bl-sm"
                    )}>
                      {/* Reply Quote */}
                      {msg.replyTo && (
                        <div className={cn(
                          "mb-2 p-2 rounded-lg border-l-2 text-xs",
                          isMe ? "bg-blue-700/50 border-white text-blue-50" : "bg-gray-50 border-blue-500 text-gray-500"
                        )}>
                          <span className={cn("font-bold block mb-0.5", isMe ? "text-white" : "text-blue-600")}>
                            {msg.replyTo.senderName}
                          </span>
                          <span className="truncate block">
                            {msg.replyTo.content || 'Attachment'}
                          </span>
                        </div>
                      )}

                      {/* Attachments */}
                      {msg.attachments?.map((att: any, idx: number) => (
                        <div key={idx} className="mb-2 overflow-hidden rounded-xl bg-black/5 border border-black/10">
                          {att.type === 'image' ? (
                            <img src={att.url} alt="attachment" className="max-w-full h-auto max-h-64 object-cover" />
                          ) : att.type === 'video' ? (
                            <div className="relative">
                              <video src={att.url} controls className="max-w-full max-h-64 object-cover" />
                            </div>
                          ) : null}
                        </div>
                      ))}

                      {/* Content */}
                      {msg.content && (
                        <p className={cn("text-[14px] leading-relaxed whitespace-pre-wrap", isMe ? "text-blue-50" : "text-gray-700")}>
                          {msg.content}
                        </p>
                      )}

                      <div className="flex items-center justify-end gap-1.5 mt-1.5">
                        {msg.isEdited && <span className={cn("text-[10px] italic", isMe ? "text-blue-200" : "text-slate-400")}>(edited)</span>}
                        <span className={cn("text-[10px]", isMe ? "text-blue-200" : "text-slate-400")}>{time}</span>
                      </div>
                    </div>

                    {/* Reactions */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className={cn("flex flex-wrap gap-1 mt-1 relative z-20", isMe ? "justify-end" : "justify-start")}>
                        {Object.entries(
                          msg.reactions.reduce((acc: any, r: any) => {
                            acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                            return acc;
                          }, {})
                        ).map(([emoji, count]) => (
                          <button
                            key={emoji}
                            onClick={() => reactToMessage(msg._id, emoji)}
                            className={cn(
                              "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border shadow-sm transition-all hover:scale-105",
                              isMe ? "bg-blue-50 border-blue-100" : "bg-white border-gray-200"
                            )}
                          >
                            <span>{emoji}</span>
                            <span className="font-semibold text-slate-600">{count as number}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Hover Actions Menu Button */}
                    <button 
                      onClick={() => setActiveMenuId(activeMenuId === msg._id ? null : msg._id)}
                      className={cn(
                        "absolute top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white shadow-md border border-gray-100 text-slate-400 hover:text-blue-600 transition-all z-30 opacity-0 group-hover/bubble:opacity-100 focus:opacity-100",
                        isMe ? "-left-10" : "-right-10"
                      )}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Action Menu Dropdown */}
                    {activeMenuId === msg._id && (
                      <div className={cn(
                        "absolute top-0 mt-8 bg-white rounded-xl shadow-xl border border-gray-100 w-64 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2",
                        isMe ? "right-full mr-2" : "left-full ml-2"
                      )}>
                        {/* Reaction Bar */}
                        <div className="flex items-center justify-around p-2 bg-slate-50 border-b border-gray-100">
                          {REACTIONS.slice(0,6).map(emoji => (
                            <button 
                              key={emoji} 
                              onClick={() => reactToMessage(msg._id, emoji)}
                              className="text-lg hover:scale-125 transition-transform"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                        <div className="p-1">
                          <button onClick={() => startReply(msg)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-slate-50 rounded-lg transition-colors">
                            <Reply className="w-4 h-4 text-blue-500" /> Reply
                          </button>
                          {isMe && (
                            <button onClick={() => startEdit(msg)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-slate-50 rounded-lg transition-colors">
                              <Edit2 className="w-4 h-4 text-amber-500" /> Edit
                            </button>
                          )}
                          {(isMe || user?.role === 'Admin' || user?.role?.name === 'Admin') && (
                            <button onClick={() => deleteMessage(msg._id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4 shrink-0">
        {(replyingTo || editingMsg) && (
          <div className="flex items-center justify-between bg-blue-50/50 p-3 mb-3 rounded-xl border border-blue-100">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                {replyingTo ? <Reply className="w-4 h-4 text-blue-600" /> : <Edit2 className="w-4 h-4 text-amber-600" />}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-blue-700 block">
                  {replyingTo ? `Replying to ${replyingTo.senderName}` : 'Editing message'}
                </span>
                <span className="text-xs text-slate-500 truncate block">
                  {(replyingTo || editingMsg).content || 'Attachment'}
                </span>
              </div>
            </div>
            <button onClick={() => { setReplyingTo(null); setEditingMsg(null); setInputText(''); }} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {filePreview && (
          <div className="relative inline-block mb-3 bg-gray-50 p-2 rounded-xl border border-gray-200">
            {fileType === 'image' ? (
              <img src={filePreview} alt="Preview" className="h-20 w-auto rounded-lg object-cover" />
            ) : (
              <div className="relative h-20 w-32 bg-black rounded-lg flex items-center justify-center overflow-hidden">
                <video src={filePreview} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                <PlayCircle className="w-8 h-8 text-white relative z-10" />
              </div>
            )}
            <button
              onClick={clearFile}
              className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md border border-gray-200 text-red-500 hover:text-red-700 hover:scale-110 transition-all"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl flex items-end p-1 transition-colors focus-within:bg-white focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100">
            {!editingMsg && (
              <div className="flex items-center gap-1 p-2 shrink-0">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                  title="Attach File"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
              </div>
            )}
            
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={editingMsg ? "Edit your message..." : "Type a message..."}
              className="flex-1 bg-transparent border-0 focus:ring-0 resize-none py-3 px-2 max-h-32 text-sm text-gray-800 placeholder:text-slate-400"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              style={{ minHeight: '44px' }}
            />
          </div>

          <button
            onClick={sendMessage}
            disabled={(!inputText.trim() && !selectedFile) || isSending}
            className="h-[52px] w-[52px] rounded-2xl bg-blue-600 flex items-center justify-center text-white shrink-0 hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-sm active:scale-95"
          >
            {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
          </button>
        </div>
      </div>
    </div>
  );
}
