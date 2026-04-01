using System;

namespace ReClaim.Api.Entities
{
    public class ChatMessage
    {
        public int Id { get; set; }
        
        public required string SenderId { get; set; } 
        
        public required string ReceiverId { get; set; } 
        
        public required string Message { get; set; }
        
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        
        // Tracks if the receiver has seen the message
        public bool IsRead { get; set; } = false; 
    }
}