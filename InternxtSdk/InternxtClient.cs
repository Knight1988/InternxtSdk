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
        return ParseInternxtItems(normalOutput);
    }

    public async Task<List<InternxtItem>> ListAsync(string id)
    {
        var (normalOutput, errorOutput) = await ExecuteAsync($"list -n --csv -f {id}");
        return ParseInternxtItems(normalOutput);
    }

    private static List<InternxtItem> ParseInternxtItems(string normalOutput)
    {
        var data = new List<InternxtItem>();
        using var memStream = new MemoryStream(Encoding.UTF8.GetBytes(normalOutput));
        using var streamReader = new StreamReader(memStream);
        using var csvReader = new TextFieldParser(streamReader);
        csvReader.TextFieldType = FieldType.Delimited;
        csvReader.SetDelimiters(",");
        csvReader.ReadLine(); // Ignore first row
        while (!csvReader.EndOfData)
        {
            var fields = csvReader.ReadFields();
            if (fields == null) continue;
            // check length of fields according to the csv input. Might be more than 3.
            if(fields.Length >= 3) 
            {
                data.Add(new InternxtItem()
                {
                    Type = fields[0],
                    Name = fields[1],
                    Id = fields[2],
                });
            }
        }

        return data;
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
}