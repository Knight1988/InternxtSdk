namespace InternxtSdk.Tests.InternxtClientTests;

[TestFixture]
public class InternxtClientUploadTests : InternxtClientTestBase
{
    private const string UploadFolderId = "996c383b-9507-4d5d-9af5-9d90455fa8f0";
    
    public override async Task Setup()
    {
        await base.Setup();
        var loginData = GetTestLogin();
        var result = await Client.LoginAsync(loginData.Username, loginData.Password);
        Assert.That(result, Is.EqualTo(true));
    }

    [Test]
    public async Task Upload_Success()
    {
        var result = await Client.UploadAsync("sample\\test.txt", UploadFolderId);
        Assert.IsNotNull(result.FileId);
        Assert.IsNotNull(result.Uuid);
    }
}