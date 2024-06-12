using Newtonsoft.Json;

namespace InternxtSdk.Tests.InternxtClientTests;

public class InternxtClientLoginTests
{
    private IInternxtClient _client;

    [SetUp]
    public void Setup()
    {
        var userProfilePath = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
        var nodeJsPath = userProfilePath + "\\AppData\\Roaming\\nvm\\v20.14.0\\node.exe";
        var internxtCliPath = userProfilePath + "\\AppData\\Roaming\\nvm\\v20.14.0\\node_modules\\@internxt\\cli\\bin\\run.js";
        _client = new InternxtClient(internxtCliPath, nodeJsPath);
    }

    [Test]
    public async Task Login_CorrectPassword_ReturnTrue()
    {
        // get username, password from login.json
        var loginJson = File.ReadAllText("login.json");
        var loginData = JsonConvert.DeserializeObject<LoginData>(loginJson);
        var username = loginData.Username;
        var password = loginData.Password;
        var result = await _client.LoginAsync(username, password);
        Assert.That(result, Is.EqualTo(true));
    }
    
    // create test when incorrect password
    [Test]
    public async Task Login_IncorrectPassword_ReturnFalse()
    {
        var username = "testuser";
        var password = "incorrectpassword";
        var result = await _client.LoginAsync(username, password);
        Assert.That(result, Is.EqualTo(false));
    }
}