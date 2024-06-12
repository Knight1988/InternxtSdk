using Newtonsoft.Json;

namespace InternxtSdk.Tests.InternxtClientTests;

public class InternxtClientTestBase
{
    protected IInternxtClient Client;

    [SetUp]
    public virtual async Task Setup()
    {
        await Task.Yield();
        var userProfilePath = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
        var nodeJsPath = userProfilePath + "\\AppData\\Roaming\\nvm\\v20.14.0\\node.exe";
        var internxtCliPath = userProfilePath + "\\AppData\\Roaming\\nvm\\v20.14.0\\node_modules\\@internxt\\cli\\bin\\run.js";
        Client = new InternxtClient(internxtCliPath, nodeJsPath);
    }

    protected LoginData GetTestLogin()
    {
        var loginJson = File.ReadAllText("login.json");
        var loginData = JsonConvert.DeserializeObject<LoginData>(loginJson);
        return loginData;
    }
}