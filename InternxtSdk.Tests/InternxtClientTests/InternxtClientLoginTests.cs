using Newtonsoft.Json;

namespace InternxtSdk.Tests.InternxtClientTests;

public class InternxtClientLoginTests : InternxtClientTestBase
{
    [Test]
    public async Task Login_CorrectPassword_ReturnTrue()
    {
        var loginData = GetTestLogin();
        var result = await Client.LoginAsync(loginData.Username, loginData.Password);
        Assert.That(result, Is.EqualTo(true));
    }
    
    // create test when incorrect password
    [Test]
    public async Task Login_IncorrectPassword_ReturnFalse()
    {
        const string username = "testuser";
        const string password = "incorrectpassword";
        var result = await Client.LoginAsync(username, password);
        Assert.That(result, Is.EqualTo(false));
    }
}