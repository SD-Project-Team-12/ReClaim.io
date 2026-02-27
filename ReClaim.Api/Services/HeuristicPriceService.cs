namespace ReClaim.Api.Services
{
    public class HeuristicPriceService : IPriceEstimationService
    {
        public decimal GetEstimate(string category, string condition, double weight, bool isPoweringOn)
        {
            // Simple logic for now: Base price per kg + functioning bonus
            decimal basePerKg = category.ToLower() == "computing" ? 200m : 100m;
            decimal estimate = (decimal)weight * basePerKg;

            if (isPoweringOn) estimate += 500m; 
            return estimate;
        }
    }
}