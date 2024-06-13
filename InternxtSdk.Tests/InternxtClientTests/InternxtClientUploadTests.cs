namespace InternxtSdk.Tests.InternxtClientTests;

[TestFixture]
public class InternxtClientUploadTests : InternxtClientTestBase
{
    private string _folderId;
    
    public override async Task Setup()
    {
        await base.Setup();
        var loginData = GetTestLogin();
        var result = await Client.LoginAsync(loginData.Username, loginData.Password);
        Assert.That(result, Is.EqualTo(true));
        _folderId = await Client.CreateFolderAsync("TestFolder");
    }

    [Test]
    public async Task Upload_Success()
    {
        var result = await Client.UploadAsync("sample\\test.txt", _folderId);
        Assert.Multiple(() =>
        {
            Assert.That(result.FileId, Is.Not.Null);
            Assert.That(result.Uuid, Is.Not.Null);
        });
    }
}