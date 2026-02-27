namespace ReClaim.Api.Entities
{
    public class RecyclerApplication
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string ClerkId { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string NidNumber { get; set; } = string.Empty; // National ID for Bangladesh context
        public string OrganizationName { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

        // Navigation property to the User
        public User? User { get; set; }
    }
}