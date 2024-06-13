using System.Diagnostics;
using InternxtSdk.Exceptions;

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
        var result = await ExecuteAsync($"login -n -e {username} -p {password}");
        return result.NormalOutput.Contains($"Succesfully logged in to: {username}");
    }

    public async Task<List<InternxtItem>> ListAsync()
    {
        var result = await ExecuteAsync($"list -n --csv");
        return ResultParser.ParseInternxtItems(result.NormalOutput);
    }

    public async Task<List<InternxtItem>> ListAsync(string id)
    {
        var result = await ExecuteAsync($"list -n --csv -f {id}");
        return ResultParser.ParseInternxtItems(result.NormalOutput);
    }

    public async Task<InternxtUploadResult> UploadAsync(string filePath, string id)
    {
        var result = await ExecuteAsync($"upload --json --file {filePath} --id {id}");
        if (result.NormalOutput.Contains("Error: File already exists"))
        {
            throw new FileExistException("File already exists");
        }
        return ResultParser.ParseInternxtUploadResult(result.NormalOutput);
    }
    
    public async Task MoveToTrashAsync(string id)
    {
        var result = await ExecuteAsync($"trash -n --id {id}");
        if (!result.NormalOutput.Contains("File trashed successfully") && !result.NormalOutput.Contains("Folder trashed successfully"))
        {
            throw new Exception(result.ErrorOutput);
        }
    }
    
    public async Task CreateFolderAsync(string folderName, string parentId)
    {
        var command = $"create-folder --name \"{folderName}\"";
        if (!string.IsNullOrEmpty(parentId))
        {
            command += $" --id {parentId}";
        }
        var result = await ExecuteAsync(command);
        var uuid = ResultParser.ParseInternxtCreateFolderResult(result.NormalOutput);
        if (string.IsNullOrEmpty(uuid))
        {
            throw new Exception(result.ErrorOutput);
        }
    }

    private async Task<ExecuteResult> ExecuteAsync(string args)
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
        var normalOutput = await process!.StandardOutput.ReadToEndAsync();
        var errorOutput = await process.StandardError.ReadToEndAsync();
        await process.WaitForExitAsync();

        return new ExecuteResult()
        {
            NormalOutput = normalOutput,
            ErrorOutput = errorOutput,
            Command = args
        };
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
    Task MoveToTrashAsync(string id);
    Task CreateFolderAsync(string folderName, string parentId);
}