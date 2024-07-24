using System.Runtime.InteropServices;
using Newtonsoft.Json;

namespace DarkKnight.InternxtSdk.Tests.InternxtClientTests;

public class InternxtClientTestBase
{
    protected IInternxtClient Client;

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
        var folder = items.FirstOrDefault(i => i.Name == "TestFolder");
        if (folder != null)
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