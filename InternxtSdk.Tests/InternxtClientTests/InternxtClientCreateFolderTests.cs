namespace InternxtSdk.Tests.InternxtClientTests;

[TestFixture]
public class InternxtClientCreateFolderTests : InternxtClientTestBase
{
    public override async Task Setup()
    {
        await base.Setup();
        var loginData = GetTestLogin();
        var result = await Client.LoginAsync(loginData.Username, loginData.Password);
        Assert.That(result, Is.EqualTo(true));
    }

    [Test]
    public async Task CreateFolder_Success()
    {
        await Client.CreateFolderAsync("TestFolder", string.Empty);
        var items = await Client.ListAsync();
        var folder = items.FirstOrDefault(i => i.Name == "TestFolder");
        Assert.That(folder, Is.Not.Null);
    }
}