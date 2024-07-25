namespace DarkKnight.InternxtSdk.Tests.InternxtClientTests;

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
        _folderId = await Client.CreateFolderAsync(TestFolderName);
    }

    [Test]
    public async Task Upload_Success()
    {
        var testFilePath = Path.Combine(Directory.GetCurrentDirectory(), "sample", "test.txt");
        var result = await Client.UploadAsync(testFilePath, _folderId);
        Assert.Multiple(() =>
        {
            Assert.That(result.FileId, Is.Not.Null);
            Assert.That(result.Uuid, Is.Not.Null);
        });
    }

    [Test]
    public void Upload_ThrowsException()
    {
        // Arrange: Prepare the conditions that will cause the operation to throw an exception.
        // This typically involves setting up mocks, but in your case it could be a bad input.
        string invalidFilePath = "invalid\\path.txt";
        string invalidFolderId = "invalidId";

        // Assert: Specify that the operation should throw an exception.
        Assert.ThrowsAsync<Exception>(async () =>
        {
            // Act: Perform the operation that is expected to throw an exception.
            await Client.UploadAsync(invalidFilePath, invalidFolderId);
        });
    }
}