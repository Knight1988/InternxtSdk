using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using InternxtSdk.Results;
using Microsoft.VisualBasic.FileIO;

namespace InternxtSdk;

public static class ResultParser
{
    public static List<InternxtItem> ParseInternxtItems(string normalOutput)
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

    public static InternxtUploadResult ParseInternxtUploadResult(string normalOutput)
    {
        var startIndex = normalOutput.LastIndexOf('{');
        var jsonText = normalOutput.Substring(startIndex);
        var document = JsonDocument.Parse(jsonText);
        
        var fileId = document.RootElement.GetProperty("fileId").GetString()!;
        var uuid = document.RootElement.GetProperty("uuid").GetString()!;

        return new InternxtUploadResult()
        {
            FileId = fileId,
            Uuid = uuid
        };
    }

    public static string ParseInternxtCreateFolderResult(string normalOutput)
    {
        var regex = new Regex(@"([a-f|\d]{8}-[a-f|\d]{4}-[a-f|\d]{4}-[a-f|\d]{4}-[a-f|\d]{12})");
        
        var match = regex.Match(normalOutput);

        return match.Success ? match.Value : string.Empty;
    }
}