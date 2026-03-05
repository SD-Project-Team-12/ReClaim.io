using System;

namespace ReClaim.Api.Entities
{
    public class ChatMessage
    {
        public int Id { get; set; }
        public string SenderId { get; set; } // Clerk User ID
        public string ReceiverId { get; set; } // Clerk User ID
        public string Message { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}