# 1. Use the .NET 10 SDK image to build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

# 2. Copy the .csproj and restore dependencies
COPY *.csproj ./
RUN dotnet restore

# 3. Copy everything else and build the release
COPY . .
RUN dotnet publish -c Release -o out

# 4. Use the .NET 10 Runtime image (much smaller)
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/out .

# 5. Start the API
ENTRYPOINT ["dotnet", "ReClaim.Api.dll"]