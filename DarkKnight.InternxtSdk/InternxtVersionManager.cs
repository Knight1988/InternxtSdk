using System.IO.Compression;
using System.Reflection;
using System.Text.Json;
using DarkKnight.InternxtSdk.Exceptions;

namespace DarkKnight.InternxtSdk;

public static class InternxtVersionManager
{
    private static Dictionary<string, DownloadPath> GetVersionList()
    {
        // Use the assembly that contains the embedded resource
        var assembly = Assembly.GetExecutingAssembly();

        // Substitute 'YourNamespace' with your project's default namespace
        using var stream = assembly.GetManifestResourceStream("DarkKnight.InternxtSdk.Resources.download.json");
    
        if(stream == null)
        {
            throw new NullReferenceException("Unable to locate the embedded resource.");
        }

        using var reader = new StreamReader(stream);
        var result = reader.ReadToEnd();
        
        var dict = JsonSerializer.Deserialize<Dictionary<string, DownloadPath>>(result);
        return dict ?? throw new InvalidOperationException();
    }

    public static async Task<(string nodePath, string internxtPath)> DownloadVersionAsync(string version)
    {
        var versionList = GetVersionList();
        if (!versionList.ContainsKey(version))
        {
            throw new VersionNotExistException($"Version {version} does not exist");
        }

        var extractPath = Path.Combine(Directory.GetCurrentDirectory(), ".nvm");
        var nodeVersion = versionList[version].NodeVersion;
        var nodePath = Path.Combine(extractPath, $"v{nodeVersion}", "node.exe");
        var internxtPath = Path.Combine(extractPath, $"v{nodeVersion}", "node_modules", "@internxt", "cli", "bin",
            "run.js");

        if (File.Exists(nodePath) && File.Exists(internxtPath)) return (nodePath, internxtPath);

        var downloadUrl = versionList[version].DownloadUrl;
        var downloadedFile = await DownloadFileAsync(downloadUrl, extractPath);
        // extract downloadedFile as zip
        ZipFile.ExtractToDirectory(downloadedFile, extractPath);

        return (nodePath, internxtPath);
    }

    private static async Task<string> DownloadFileAsync(string downloadUrl, string outputFolder)
    {
        // create folder if not exist
        if (!Directory.Exists(outputFolder))
        {
            Directory.CreateDirectory(outputFolder);
        }
        
        // download file to outputFolder using HttpClient
        using var httpClient = new HttpClient();
        using var response = await httpClient.GetAsync(downloadUrl);
        using var content = response.Content;
        var fileBytes = await content.ReadAsByteArrayAsync();
        var fileName = Path.GetFileName(downloadUrl);
        var filePath = Path.Combine(outputFolder, fileName);
        await File.WriteAllBytesAsync(filePath, fileBytes);

        return filePath;
    }
}