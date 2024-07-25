namespace DarkKnight.InternxtSdk.Tests.InternxtClientTests;

[TestFixture]
public class InternxtClientMoveToTrashTests : InternxtClientTestBase
{
    private string _fileId;
    
    public override async Task Setup()
    {
        await base.Setup();
        var loginData = GetTestLogin();
        var loginResult = await Client.LoginAsync(loginData.Username, loginData.Password);
        Assert.That(loginResult, Is.EqualTo(true));
        // create test folder
        var folderId = await Client.CreateFolderAsync(TestFolderName);
        // Upload a file
        
        var testFilePath = Path.Combine(Directory.GetCurrentDirectory(), "sample", "test.txt");
        var uploadResult = await Client.UploadAsync(testFilePath, folderId);
        Assert.Multiple(() =>
        {
            Assert.That(uploadResult.FileId, Is.Not.Null);
            Assert.That(uploadResult.Uuid, Is.Not.Null);
        });
        _fileId = uploadResult.Uuid;
    }

    [Test]
    public async Task Delete_Success()
    {
        await Client.MoveToTrashAsync(_fileId);
        var listResult = await Client.ListAsync(_fileId);
        Assert.That(listResult, Is.Empty);
    }
}