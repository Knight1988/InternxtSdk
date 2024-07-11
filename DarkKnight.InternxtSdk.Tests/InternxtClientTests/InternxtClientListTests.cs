namespace DarkKnight.InternxtSdk.Tests.InternxtClientTests;

[TestFixture]
public class InternxtClientListTests : InternxtClientTestBase
{
    private string _testFolderId;

    public override async Task Setup()
    {
        await base.Setup();
        var loginData = GetTestLogin();
        var result = await Client.LoginAsync(loginData.Username, loginData.Password);
        Assert.That(result, Is.EqualTo(true));

        _testFolderId = await Client.CreateFolderAsync("TestFolder");
        await Client.CreateFolderAsync("Test Folder", _testFolderId);
        await Client.UploadAsync("sample\\test.txt", _testFolderId);
    }

    [Test]
    public async Task List_ReturnListOfItemInRootFolder()
    {
        var list = await Client.ListAsync();
        Assert.That(list, Is.Not.Null);
        Assert.That(list, Has.Count.GreaterThan(0));
    }

    [Test]
    public async Task List_ReturnListOfItemInTestFolder()
    {
        var list = await Client.ListAsync(_testFolderId);
        Assert.That(list, Is.Not.Null);
        Assert.That(list, Has.Count.EqualTo(2));
        Assert.Multiple(() =>
        {
            Assert.That(list[0].Name, Is.EqualTo("Test Folder"));
            Assert.That(list[0].Type, Is.EqualTo("folder"));
            Assert.That(list[1].Name, Is.EqualTo("test.txt"));
            Assert.That(list[1].Type, Is.EqualTo("file"));
        });
    }
}