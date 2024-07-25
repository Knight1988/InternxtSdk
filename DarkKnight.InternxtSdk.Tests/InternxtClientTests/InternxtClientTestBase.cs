using System.Runtime.InteropServices;
using Newtonsoft.Json;

namespace DarkKnight.InternxtSdk.Tests.InternxtClientTests;

public class InternxtClientTestBase
{
    protected IInternxtClient Client;
    protected static string TestFolderName { get; } = Guid.NewGuid().ToString();

    protected static string TestFilePath
    {
        get
        {
            var testFilePath = Path.Combine(Directory.GetCurrentDirectory(), "sample", "test.txt");
            if (File.Exists(testFilePath)) return testFilePath;
            
            Directory.CreateDirectory(Path.Combine(Directory.GetCurrentDirectory(), "sample"));
            File.WriteAllText(testFilePath, "test");

            return testFilePath;
        }
    }

    [SetUp]
    public virtual async Task Setup()
    {
        var platform = RuntimeInformation.IsOSPlatform(OSPlatform.Windows) ? "windows" : "linux";
        var (nodeJsPath, internxtCliPath) = await InternxtVersionManager.DownloadVersionAsync("1.1.2", platform);
        Client = new InternxtClient(internxtCliPath, nodeJsPath);
    }

    [TearDown]
    public async Task TearDown()
    {
        var items = await Client.ListAsync();
        var folders = items.Where(i => i.Name.StartsWith("TestFolder") || i.Name == TestFolderName);
        foreach (var folder in folders)
        {
            await Client.MoveToTrashAsync(folder.Id);
        }
    }

    protected LoginData GetTestLogin()
    {
        var username = Environment.GetEnvironmentVariable("TEST_USERNAME");
        var password = Environment.GetEnvironmentVariable("TEST_PASSWORD");
        var loginData = new LoginData { Username = username, Password = password };
        return loginData;
    }
}