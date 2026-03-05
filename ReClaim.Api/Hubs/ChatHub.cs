using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using ReClaim.Api.Entities; 
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ReClaim.Api.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly AppDbContext _context;
        
        private static readonly ConcurrentDictionary<string, bool> _onlineUsers = new();
        
        private static readonly ConcurrentDictionary<string, HashSet<string>> _userConnections = new();

        public ChatHub(AppDbContext context)
        {
            _context = context;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirst("sub")?.Value ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                _onlineUsers[userId] = true;
                
                var connections = _userConnections.GetOrAdd(userId, _ => new HashSet<string>());
                lock (connections) { connections.Add(Context.ConnectionId); }

                await Clients.All.SendAsync("UserConnected", userId); 
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.User?.FindFirst("sub")?.Value ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                _onlineUsers.TryRemove(userId, out _);
                
                if (_userConnections.TryGetValue(userId, out var connections))
                {
                    lock (connections) { connections.Remove(Context.ConnectionId); }
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
            var senderId = Context.User?.FindFirst("sub")?.Value ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value; 
            if (string.IsNullOrEmpty(senderId)) return;

            var chatMessage = new ChatMessage
            {
                SenderId = senderId,
                ReceiverId = receiverId,
                Message = message,
                Timestamp = DateTime.UtcNow
            };
            
            _context.ChatMessages.Add(chatMessage);
            await _context.SaveChangesAsync();

            if (_userConnections.TryGetValue(receiverId, out var connections) && connections.Count > 0)
            {
                List<string> connectionIds;
                lock (connections) { connectionIds = connections.ToList(); }
                
                await Clients.Clients(connectionIds).SendAsync("ReceiveMessage", senderId, message);
            }
            else 
            {
                await Clients.User(receiverId).SendAsync("ReceiveMessage", senderId, message);
            }
        }
    }
}