using System.Diagnostics;
using System.Text;
using Microsoft.VisualBasic.FileIO;

namespace InternxtSdk;

public class InternxtClient : IInternxtClient
{
    public string InternxtCliPath { get; set; }
    public string NodeJsPath { get; set; }

    public InternxtClient(string internxtCliPath, string nodeJsPath)
    {
        InternxtCliPath = internxtCliPath;
        NodeJsPath = nodeJsPath;
    }

    public async Task<bool> LoginAsync(string username, string password)
    {
        var (normalOutput, errorOutput) = await ExecuteAsync($"login -n -e {username} -p {password}");
        return normalOutput.Contains($"Succesfully logged in to: {username}");
    }

    public async Task<List<InternxtItem>> ListAsync()
    {
        var (normalOutput, errorOutput) = await ExecuteAsync($"list -n --csv");
        return ResultParser.ParseInternxtItems(normalOutput);
    }

    public async Task<List<InternxtItem>> ListAsync(string id)
    {
        var (normalOutput, errorOutput) = await ExecuteAsync($"list -n --csv -f {id}");
        return ResultParser.ParseInternxtItems(normalOutput);
    }

    public async Task<InternxtUploadResult> UploadAsync(string filePath, string id)
    {
        var (normalOutput, errorOutput) = await ExecuteAsync($"upload --json --file {filePath} --id {id}");
        return ResultParser.ParseInternxtUploadResult(normalOutput);
    }

    private async Task<(string normalOutput, string errorOutput)> ExecuteAsync(string args)
    {
        var processStartInfo = new ProcessStartInfo
        {
            FileName = NodeJsPath,
            Arguments = $"{InternxtCliPath} {args}",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };

        var process = Process.Start(processStartInfo);
        var normalOutput = process.StandardOutput.ReadToEnd();
        var errorOutput = process.StandardError.ReadToEnd();
        await process.WaitForExitAsync();

        return (normalOutput, errorOutput);
    }
}

public interface IInternxtClient
{
    string InternxtCliPath { get; set; }
    string NodeJsPath { get; set; }
    Task<bool> LoginAsync(string username, string password);
    Task<List<InternxtItem>> ListAsync();
    Task<List<InternxtItem>> ListAsync(string id);
    Task<InternxtUploadResult> UploadAsync(string filePath, string id);
}