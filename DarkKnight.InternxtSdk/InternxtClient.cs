using System.Diagnostics;
using DarkKnight.InternxtSdk.Exceptions;
using DarkKnight.InternxtSdk.Results;

namespace DarkKnight.InternxtSdk;

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

        if (!result.NormalOutput.Contains("File uploaded in"))
        {
            throw new Exception(result.ErrorOutput);
        }

        return ResultParser.ParseInternxtUploadResult(result.NormalOutput);
    }

    public async Task MoveToTrashAsync(string id)
    {
        var result = await ExecuteAsync($"trash -n --id {id}");
        if (!result.NormalOutput.Contains("File trashed successfully") &&
            !result.NormalOutput.Contains("Folder trashed successfully"))
        {
            throw new Exception(result.ErrorOutput);
        }
    }

    public async Task<string> CreateFolderAsync(string folderName)
    {
        return await CreateFolderAsync(folderName, string.Empty);
    }

    public async Task<string> CreateFolderAsync(string folderName, string parentId)
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

        return uuid;
    }

    public async Task DownloadAsync(string fileId, string destinationPath, bool isOverwrite = false,
        bool createDirectoryIfNotExist = true)
    {
        if (createDirectoryIfNotExist && !Directory.Exists(destinationPath))
        {
            Directory.CreateDirectory(destinationPath);
        }

        var args = $"download --id {fileId} --directory {destinationPath}";
        if (isOverwrite)
        {
            args += " --overwrite";
        }

        var result = await ExecuteAsync(args);
        if (result.NormalOutput.Contains("ENOENT: no such file or directory"))
        {
            throw new DirectoryNotFoundException();
        }
        if (result.NormalOutput.Contains("File already exists"))
        {
            throw new FileExistException();
        }

        if (result.ErrorOutput.Contains("[REPORTED_ERROR]: File not found") || result.ErrorOutput.Contains("[REPORTED_ERROR]: Invalid UUID"))
        {
            throw new FileNotFoundException();
        }
        if (!result.NormalOutput.Contains("File downloaded successfully"))
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
        
        Console.WriteLine($"Executing command: internxt {args}");

        var process = Process.Start(processStartInfo);
        var normalOutput = await process!.StandardOutput.ReadToEndAsync();
        var errorOutput = await process.StandardError.ReadToEndAsync();
        await process.WaitForExitAsync();
        
        
        if (!string.IsNullOrEmpty(normalOutput))
        {
            Console.WriteLine($"Command output: {normalOutput}");
        }
        if (!string.IsNullOrEmpty(errorOutput))
        {
            Console.WriteLine($"Command error output: {errorOutput}");
        }

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
    Task<string> CreateFolderAsync(string folderName);
    Task<string> CreateFolderAsync(string folderName, string parentId);
    Task DownloadAsync(string fileId, string destinationPath, bool isOverwrite = false,
        bool createDirectoryIfNotExist = true);
}