using System;

namespace ReClaim.Api.Entities
{
    public class ChatMessage
    {
        public int Id { get; set; }
        public string SenderId { get; set; } 
        public string ReceiverId { get; set; } 
        public string Message { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        
        // NEW: Tracks if the receiver has seen the message
        public bool IsRead { get; set; } = false; 
    }
}