namespace ReClaim.Api.Services
{
    public interface IPriceEstimationService
    {
        decimal GetEstimate(string category, string condition, double weight, bool isPoweringOn);
    }
}