using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.Text;

namespace ReClaim.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatbotController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private static readonly HttpClient _httpClient = new HttpClient();

        public ChatbotController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public class ChatRequest
        {
            public string Message { get; set; } = string.Empty;
        }

        [HttpPost("ask")]
        public async Task<IActionResult> Ask([FromBody] ChatRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Message))
                return BadRequest(new { reply = "Message is required." });

            var apiKey = _configuration["GeminiApiKey"];
            if (string.IsNullOrEmpty(apiKey))
                return StatusCode(500, new { reply = "Sorry this request could not be processed." });

            // 1. UPDATED URL: Using a newer, active Gemini model (2.5-flash)
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={apiKey}";

            var systemInstruction = @"You are the official support bot for ReClaim.io. 
            ReClaim is a platform that allows users to sell their recyclable waste. 
            You must ONLY answer questions related to ReClaim.io, recycling, waste management, and how our platform works. 
            If a user asks about anything else (coding, math, general knowledge, etc), politely decline and say you only help with ReClaim.io matters. Keep answers concise, helpful, and friendly.";

            var payload = new
            {
                system_instruction = new
                {
                    parts = new[] { new { text = systemInstruction } }
                },
                contents = new[]
                {
                    new { role = "user", parts = new[] { new { text = request.Message } } }
                }
            };

            var jsonPayload = JsonSerializer.Serialize(payload);
            var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(url, content);
            
            // 2. UPDATED ERROR HANDLING: Always return a JSON object so React doesn't crash
            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"\n[GEMINI API ERROR] Status: {response.StatusCode}");
                Console.WriteLine(errorBody + "\n");
                
                return StatusCode((int)response.StatusCode, new { reply = "Sorry, my AI brain is currently offline. Please check the backend console for the exact Google error." });
            }

            var responseString = await response.Content.ReadAsStringAsync();
            
            using var jsonDoc = JsonDocument.Parse(responseString);
            try
            {
                var textResponse = jsonDoc.RootElement
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text").GetString();

                return Ok(new { reply = textResponse });
            }
            catch
            {
                return Ok(new { reply = "I'm sorry, I couldn't process the response right now." });
            }
        }
    }
}