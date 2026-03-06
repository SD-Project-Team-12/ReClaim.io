using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using ReClaim.Api.Entities;

namespace ReClaim.Api.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly AppDbContext _context;
        private static readonly ConcurrentDictionary<string, bool> _onlineUsers = new();
        private static readonly ConcurrentDictionary<string, HashSet<string>> _userConnections =
            new();

        public ChatHub(AppDbContext context)
        {
            _context = context;
        }

        public override async Task OnConnectedAsync()
        {
            var userId =
                Context.User?.FindFirst("sub")?.Value
                ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                _onlineUsers[userId] = true;

                var connections = _userConnections.GetOrAdd(userId, _ => new HashSet<string>());
                lock (connections)
                {
                    connections.Add(Context.ConnectionId);
                }

                await Clients.All.SendAsync("UserConnected", userId);
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId =
                Context.User?.FindFirst("sub")?.Value
                ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                _onlineUsers.TryRemove(userId, out _);

                if (_userConnections.TryGetValue(userId, out var connections))
                {
                    lock (connections)
                    {
                        connections.Remove(Context.ConnectionId);
                    }
                }

                await Clients.All.SendAsync("UserDisconnected", userId);
            }
            await base.OnDisconnectedAsync(exception);
        }

        public Task<IEnumerable<string>> GetOnlineUsers()
        {
            return Task.FromResult((IEnumerable<string>)_onlineUsers.Keys);
        }

        public async Task SendMessage(string receiverId, string message)
        {
            var senderId =
                Context.User?.FindFirst("sub")?.Value
                ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(senderId))
                return;

            var chatMessage = new ChatMessage
            {
                SenderId = senderId,
                ReceiverId = receiverId,
                Message = message,
                Timestamp = DateTime.UtcNow,
                IsRead = false, // Default to unread
            };

            _context.ChatMessages.Add(chatMessage);
            await _context.SaveChangesAsync();

            if (
                _userConnections.TryGetValue(receiverId, out var connections)
                && connections.Count > 0
            )
            {
                List<string> connectionIds;
                lock (connections)
                {
                    connectionIds = connections.ToList();
                }
                // Pass "false" for IsRead to the receiver
                await Clients
                    .Clients(connectionIds)
                    .SendAsync("ReceiveMessage", senderId, message, chatMessage.Timestamp, false);
            }
            else
            {
                await Clients
                    .User(receiverId)
                    .SendAsync("ReceiveMessage", senderId, message, chatMessage.Timestamp, false);
            }
        }

        // NEW METHOD: Called by the frontend when a user opens a chat or receives a message while looking at the chat
        public async Task MarkMessagesAsRead(string senderId)
        {
            var myUserId =
                Context.User?.FindFirst("sub")?.Value
                ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(myUserId))
                return;

            // Find all unread messages sent BY senderId TO me
            var unreadMessages = _context
                .ChatMessages.Where(m =>
                    m.SenderId == senderId && m.ReceiverId == myUserId && !m.IsRead
                )
                .ToList();

            if (unreadMessages.Any())
            {
                foreach (var msg in unreadMessages)
                {
                    msg.IsRead = true;
                }
                await _context.SaveChangesAsync();

                // Notify the original sender that their messages were just read by me
                if (
                    _userConnections.TryGetValue(senderId, out var connections)
                    && connections.Count > 0
                )
                {
                    List<string> connectionIds;
                    lock (connections)
                    {
                        connectionIds = connections.ToList();
                    }
                    await Clients.Clients(connectionIds).SendAsync("MessagesRead", myUserId);
                }
                else
                {
                    await Clients.User(senderId).SendAsync("MessagesRead", myUserId);
                }
            }
        }

        // NEW: Typing Indicator Method
        public async Task NotifyTyping(string receiverId, bool isTyping)
        {
            var senderId =
                Context.User?.FindFirst("sub")?.Value
                ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(senderId))
                return;

            if (
                _userConnections.TryGetValue(receiverId, out var connections)
                && connections.Count > 0
            )
            {
                List<string> connectionIds;
                lock (connections)
                {
                    connectionIds = connections.ToList();
                }
                await Clients.Clients(connectionIds).SendAsync("ReceiveTyping", senderId, isTyping);
            }
            else
            {
                await Clients.User(receiverId).SendAsync("ReceiveTyping", senderId, isTyping);
            }
        }
    }
}
